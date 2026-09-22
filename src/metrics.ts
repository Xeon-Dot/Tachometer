import type { RequestMetric } from "./db";
import { lookupPrices } from "./pricing";

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

// Anthropic reports `input_tokens` already excluding cache reads/writes
// (`cache_read_input_tokens` / `cache_creation_input_tokens` are separate), so
// cached tokens must not be subtracted again. Other providers (OpenAI, Gemini, …)
// count cached tokens inside the prompt/input total.
export function inputExcludesCached(provider: string): boolean {
  return /anthropic/i.test(provider);
}

/** Input tokens with the cached portion removed when the provider includes it. */
export function netInputTokens(item: RequestMetric): number {
  const input = item.inputTokens ?? 0;
  if (inputExcludesCached(item.provider)) return input;
  return Math.max(
    0,
    input - (item.cachedTokens ?? 0) - (item.cacheWriteTokens ?? 0),
  );
}

export type CostBreakdown = {
  total: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  /** 가격을 찾아 계산된 요청 수 */
  pricedRequests: number;
  /** usage는 있는데 가격을 못 찾은 요청 수 */
  unpricedRequests: number;
};

export type RequestCost = Omit<
  CostBreakdown,
  "pricedRequests" | "unpricedRequests"
>;

function roundCost(v: number): number {
  return Math.round(v * 1e8) / 1e8;
}

/** usage가 실제로 수집된 요청인지. 가격 미매칭 집계는 이런 요청만 센다. */
export function hasUsage(item: RequestMetric): boolean {
  return (
    (item.inputTokens ?? null) !== null ||
    (item.outputTokens ?? null) !== null ||
    (item.cachedTokens ?? null) !== null ||
    (item.cacheWriteTokens ?? null) !== null
  );
}

/** 요청 1건의 USD 비용. 단가를 못 찾으면 null. (USD per 1M tokens 기준) */
export function requestCost(item: RequestMetric): RequestCost | null {
  const p = lookupPrices(item.provider, item.model);
  if (!p) return null;
  const per = (tokens: number, price: number) => (tokens * price) / 1_000_000;
  const input = per(netInputTokens(item), p.input);
  const output = per(item.outputTokens ?? 0, p.output);
  const cacheRead = per(item.cachedTokens ?? 0, p.cacheRead ?? p.input);
  const cacheWrite = per(item.cacheWriteTokens ?? 0, p.cacheWrite ?? p.input);
  return {
    total: roundCost(input + output + cacheRead + cacheWrite),
    input: roundCost(input),
    output: roundCost(output),
    cacheRead: roundCost(cacheRead),
    cacheWrite: roundCost(cacheWrite),
  };
}

export function computeCost(items: RequestMetric[]): CostBreakdown {
  const cost: CostBreakdown = {
    total: 0,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    pricedRequests: 0,
    unpricedRequests: 0,
  };
  for (const item of items) {
    const c = requestCost(item);
    if (!c) {
      if (hasUsage(item)) cost.unpricedRequests++;
      continue;
    }
    cost.total += c.total;
    cost.input += c.input;
    cost.output += c.output;
    cost.cacheRead += c.cacheRead;
    cost.cacheWrite += c.cacheWrite;
    cost.pricedRequests++;
  }
  cost.total = roundCost(cost.total);
  cost.input = roundCost(cost.input);
  cost.output = roundCost(cost.output);
  cost.cacheRead = roundCost(cost.cacheRead);
  cost.cacheWrite = roundCost(cost.cacheWrite);
  return cost;
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
  inputTokens: {
    total: number;
    avg: number | null;
    netTotal: number;
    netAvg: number | null;
  };
  outputTokens: { total: number; avg: number | null };
  cachedTokens: { total: number };
  cacheWriteTokens: { total: number };
  cost: CostBreakdown;
  rpm: number;
  tpm: { input: number; output: number; total: number; netInput: number };
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
  const cacheWriteTotal = items.reduce(
    (a, i) => a + (i.cacheWriteTokens ?? 0),
    0,
  );
  const netInputTotal = items.reduce((a, i) => a + netInputTokens(i), 0);
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
      netTotal: netInputTotal,
      netAvg: countWithInput
        ? Math.round((netInputTotal / countWithInput) * 100) / 100
        : null,
    },
    outputTokens: {
      total: outputTotal,
      avg: countWithOutput
        ? Math.round((outputTotal / countWithOutput) * 100) / 100
        : null,
    },
    cachedTokens: { total: cachedTotal },
    cacheWriteTokens: { total: cacheWriteTotal },
    cost: computeCost(items),
    rpm,
    tpm: {
      input: rate(inputTotal),
      output: rate(outputTotal),
      total: rate(totalTokensForRate),
      netInput: rate(netInputTotal),
    },
    tokensPerSec: tps,
  };
}

export type ModelRanking = {
  model: string;
  totalTokens: number;
  inputTokens: number;
  netInputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  cacheWriteTokens: number;
  cost: CostBreakdown;
  totalRequests: number;
  avgLatency: number | null;
  providers: string[];
};

export function normalizeModelName(raw: string | null | undefined): string {
  if (!raw) return "(unknown)";
  let name = raw.trim();
  if (!name) return "(unknown)";
  // Gateway/OpenRouter 스타일 "제작사/모델" → "모델" (마지막 "/" 뒤만 사용)
  // e.g. "meta/muse-spark-1.3-contributor" → "muse-spark-1.3-contributor"
  const slash = name.lastIndexOf("/");
  if (slash !== -1) name = name.slice(slash + 1).trim();
  if (!name) return "(unknown)";
  name = name.replace(/[:-]free$/i, "");
  if (!name) return "(unknown)";
  return name;
}

export function computeModelRankings(items: RequestMetric[]): ModelRanking[] {
  const groups = new Map<string, { display: string; items: RequestMetric[] }>();
  for (const m of items) {
    const display = normalizeModelName(m.model);
    const key = display.toLowerCase();
    if (!groups.has(key)) groups.set(key, { display, items: [] });
    groups.get(key)?.items.push(m);
  }
  const rankings: ModelRanking[] = [];
  for (const { display: model, items: group } of groups.values()) {
    const inputTokens = group.reduce((a, i) => a + (i.inputTokens ?? 0), 0);
    const netInputTokensTotal = group.reduce((a, i) => a + netInputTokens(i), 0);
    const outputTokens = group.reduce((a, i) => a + (i.outputTokens ?? 0), 0);
    const cachedTokens = group.reduce((a, i) => a + (i.cachedTokens ?? 0), 0);
    const cacheWriteTokens = group.reduce(
      (a, i) => a + (i.cacheWriteTokens ?? 0),
      0,
    );
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
      netInputTokens: netInputTokensTotal,
      outputTokens,
      cachedTokens,
      cacheWriteTokens,
      cost: computeCost(group),
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
