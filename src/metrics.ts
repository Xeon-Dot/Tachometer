import type { RequestMetric } from "./db";

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]!;
}

function statsFor(latencies: number[]) {
  if (!latencies.length)
    return { p50: null, p95: null, p99: null, avg: null, min: null, max: null };
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  return {
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    avg: Math.round(avg * 100) / 100,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

export type ProviderSummary = {
  provider: string;
  totalRequests: number;
  successRate: number;
  latency: {
    p50: number | null;
    p95: number | null;
    p99: number | null;
    avg: number | null;
    min: number | null;
    max: number | null;
  };
  ttft: {
    p50: number | null;
    p95: number | null;
    p99: number | null;
    avg: number | null;
  };
  inputTokens: { total: number; avg: number | null };
  outputTokens: { total: number; avg: number | null };
  cachedTokens: { total: number };
  rpm: number;
  tpm: { input: number; output: number; total: number };
  tokensPerSec: number | null;
};

function buildSummary(
  provider: string,
  items: RequestMetric[],
  windowMinutes: number,
): ProviderSummary {
  const latencies = items.map((i) => i.latencyMs).filter(Boolean) as number[];
  const ttfts = items
    .map((i) => i.ttftMs)
    .filter((v): v is number => v !== null && v > 0);
  const lStats = statsFor(latencies);
  const tStats = statsFor(ttfts);
  const total = items.length;
  const success = items.filter((i) => i.status >= 200 && i.status < 400).length;
  const inputTotal = items.reduce((a, i) => a + (i.inputTokens ?? 0), 0);
  const outputTotal = items.reduce((a, i) => a + (i.outputTokens ?? 0), 0);
  const cachedTotal = items.reduce((a, i) => a + (i.cachedTokens ?? 0), 0);
  const totalTokensForRate = items.reduce(
    (a, i) =>
      a + (i.totalTokens ?? (i.inputTokens ?? 0) + (i.outputTokens ?? 0)),
    0,
  );
  const countWithInput = items.filter((i) => i.inputTokens !== null).length;
  const countWithOutput = items.filter((i) => i.outputTokens !== null).length;
  const totalLatencySec = latencies.reduce((a, b) => a + b, 0) / 1000;
  const rate = (n: number) =>
    windowMinutes > 0 ? Math.round((n / windowMinutes) * 100) / 100 : 0;
  const rpm = rate(total);
  const tps =
    totalLatencySec > 0 && outputTotal > 0
      ? Math.round((outputTotal / totalLatencySec) * 100) / 100
      : null;

  return {
    provider,
    totalRequests: total,
    successRate: total ? Math.round((success / total) * 10000) / 100 : 0,
    latency: lStats,
    ttft: {
      p50: tStats.p50,
      p95: tStats.p95,
      p99: tStats.p99,
      avg: tStats.avg,
    },
    inputTokens: {
      total: inputTotal,
      avg: countWithInput
        ? Math.round((inputTotal / countWithInput) * 100) / 100
        : null,
    },
    outputTokens: {
      total: outputTotal,
      avg: countWithOutput
        ? Math.round((outputTotal / countWithOutput) * 100) / 100
        : null,
    },
    cachedTokens: { total: cachedTotal },
    rpm,
    tpm: {
      input: rate(inputTotal),
      output: rate(outputTotal),
      total: rate(totalTokensForRate),
    },
    tokensPerSec: tps,
  };
}

export type ModelRanking = {
  model: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  totalRequests: number;
  avgLatency: number | null;
  providers: string[];
};

export function computeModelRankings(items: RequestMetric[]): ModelRanking[] {
  const groups = new Map<string, RequestMetric[]>();
  for (const m of items) {
    const key = m.model || "(unknown)";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(m);
  }
  const rankings: ModelRanking[] = [];
  for (const [model, group] of groups) {
    const inputTokens = group.reduce((a, i) => a + (i.inputTokens ?? 0), 0);
    const outputTokens = group.reduce((a, i) => a + (i.outputTokens ?? 0), 0);
    const cachedTokens = group.reduce((a, i) => a + (i.cachedTokens ?? 0), 0);
    const totalTokens = group.reduce(
      (a, i) =>
        a + (i.totalTokens ?? (i.inputTokens ?? 0) + (i.outputTokens ?? 0)),
      0,
    );
    const avgLatency = group.length
      ? Math.round(group.reduce((a, i) => a + i.latencyMs, 0) / group.length)
      : null;
    const providers = [...new Set(group.map((i) => i.provider))];
    rankings.push({
      model,
      totalTokens,
      inputTokens,
      outputTokens,
      cachedTokens,
      totalRequests: group.length,
      avgLatency,
      providers,
    });
  }
  rankings.sort((a, b) => b.totalTokens - a.totalTokens);
  return rankings;
}

export function computeSummaries(
  items: RequestMetric[],
  windowMinutes = 60,
): ProviderSummary[] {
  const groups = new Map<string, RequestMetric[]>();
  for (const m of items) {
    if (!groups.has(m.provider)) groups.set(m.provider, []);
    groups.get(m.provider)?.push(m);
  }
  const overall: RequestMetric[] = items;
  const result: ProviderSummary[] = [];
  if (overall.length)
    result.push(buildSummary("__all__", overall, windowMinutes));
  for (const [provider, group] of groups) {
    result.push(buildSummary(provider, group, windowMinutes));
  }
  return result;
}

export function computeTimeSeries(items: RequestMetric[], windowMinutes = 60) {
  const bucketMinutes = 5;
  const now = Date.now();
  const since = now - windowMinutes * 60 * 1000;
  const buckets = Math.ceil(windowMinutes / bucketMinutes);
  const series: {
    time: string;
    count: number;
    avgLatency: number | null;
    avgTtft: number | null;
  }[] = [];
  for (let b = 0; b < buckets; b++) {
    const start = since + b * bucketMinutes * 60 * 1000;
    const end = start + bucketMinutes * 60 * 1000;
    const slice = items.filter((i) => {
      const t = i.timestamp.getTime();
      return t >= start && t < end;
    });
    const lat = slice.map((i) => i.latencyMs);
    const avgLatency = lat.length
      ? Math.round(lat.reduce((a, c) => a + c, 0) / lat.length)
      : null;
    const ttfts = slice
      .map((i) => i.ttftMs)
      .filter((v): v is number => v !== null && v > 0);
    const avgTtft = ttfts.length
      ? Math.round(ttfts.reduce((a, c) => a + c, 0) / ttfts.length)
      : null;
    series.push({
      time: new Date(start).toISOString().slice(11, 16).replace("T", " "),
      count: slice.length,
      avgLatency,
      avgTtft,
    });
  }
  return series;
}
