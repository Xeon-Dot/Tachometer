// models.dev 가격표 로더.
// https://models.dev/api.json 전체를 주기적으로 받아 메모리에 캐시하고,
// (provider, model) 조합에 대한 USD/1M-token 단가를 조회해 준다.
// DB에는 저장하지 않는다 — 비용은 조회 시점에 계산된다.

export type ModelPrices = {
  input: number;
  output: number;
  cacheRead: number | null;
  cacheWrite: number | null;
};

export type PricingMeta = {
  source: string;
  updatedAt: string | null;
  models: number;
  providers: number;
  loading: boolean;
  error: string | null;
};

const PRICING_URL = process.env.PRICING_URL || "https://models.dev/api.json";
const REFRESH_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 4096;

let byProvider = new Map<string, Map<string, ModelPrices>>();
let providerIds = new Set<string>();
let globalIndex = new Map<string, ModelPrices>();
let lookupCache = new Map<string, ModelPrices | null>();
let meta: PricingMeta = {
  source: PRICING_URL,
  updatedAt: null,
  models: 0,
  providers: 0,
  loading: false,
  error: null,
};

// 프록시가 보는 upstream host → models.dev provider id.
const HOST_ALIASES: Record<string, string> = {
  "api.openai.com": "openai",
  "api.anthropic.com": "anthropic",
  "generativelanguage.googleapis.com": "google",
  "aiplatform.googleapis.com": "google-vertex",
  "openrouter.ai": "openrouter",
  "api.deepseek.com": "deepseek",
  "api.x.ai": "xai",
  "api.mistral.ai": "mistral",
  "api.groq.com": "groq",
  "api.together.xyz": "togetherai",
  "api.together.ai": "togetherai",
  "api.fireworks.ai": "fireworks-ai",
  "api.cerebras.ai": "cerebras",
  "api.perplexity.ai": "perplexity",
  "api.cohere.com": "cohere",
  "api.cohere.ai": "cohere",
  "integrate.api.nvidia.com": "nvidia",
  "api.moonshot.ai": "moonshotai",
  "api.moonshot.cn": "moonshotai-cn",
  "api.minimax.chat": "minimax",
  "api.minimaxi.com": "minimax",
  "api.z.ai": "zai",
  "open.bigmodel.cn": "zhipuai",
  "dashscope.aliyuncs.com": "alibaba",
  "dashscope-intl.aliyuncs.com": "alibaba",
  "api.novita.ai": "novita-ai",
  "api.githubcopilot.com": "github-copilot",
  "api.ai21.com": "ai21",
  "api.siliconflow.cn": "siliconflow",
  "api.siliconflow.com": "siliconflow",
  "ark.cn-beijing.volces.com": "volcengine",
  "api.302.ai": "302ai",
  "api.aihubmix.com": "aihubmix",
};

const TLD = new Set([
  "com", "net", "org", "io", "ai", "cn", "dev", "xyz", "co", "me",
  "app", "cloud", "tech", "run", "sh", "kr", "jp", "in", "us", "uk",
  "de", "fr", "cc", "tv", "info", "biz", "site", "online", "top", "pro",
]);
const HOST_NOISE = new Set([
  "api", "www", "open", "portal", "integrate", "gateway", "proxy", "aiplatform",
]);

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function parseCost(cost: unknown): ModelPrices | null {
  if (!cost || typeof cost !== "object") return null;
  const c = cost as Record<string, unknown>;
  const input = num(c.input);
  const output = num(c.output);
  if (input === null || output === null) return null;
  return {
    input,
    output,
    cacheRead: num(c.cache_read),
    cacheWrite: num(c.cache_write),
  };
}

/** 모델 id의 표기 변형들(정확한 id 우선, 날짜/버전 접미사·vendor 접두사·구분자 변형). */
function modelCandidates(raw: string): string[] {
  const out = new Set<string>();
  const add = (s: string) => {
    const t = s.trim().toLowerCase();
    if (t) out.add(t);
  };
  let m = raw.trim();
  if (m.toLowerCase().startsWith("models/")) m = m.slice(7);
  add(m);
  const noDate = m
    .replace(/[-@]?\d{8}$/, "")
    .replace(/[-@]?\d{4}-\d{2}-\d{2}$/, "");
  add(noDate);
  add(noDate.replace(/[-@]?\d{3}$/, ""));
  for (const base of [m, noDate]) add(base.replace(/[:-]free$/i, ""));
  for (const base of [...out]) {
    const slash = base.lastIndexOf("/");
    if (slash !== -1) add(base.slice(slash + 1));
  }
  for (const base of [...out]) {
    if (base.includes("-")) add(base.replaceAll("-", "."));
    if (base.includes(".")) add(base.replaceAll(".", "-"));
  }
  return [...out];
}

/** host에서 models.dev provider id 후보를 만든다. */
function hostCandidates(host: string): string[] {
  const labels = host
    .toLowerCase()
    .split(".")
    .filter(Boolean);
  const core = labels.filter((l) => !TLD.has(l) && !HOST_NOISE.has(l));
  const out = new Set<string>();
  const add = (s: string) => {
    const t = s.replace(/[^a-z0-9]/g, "");
    if (t) out.add(t);
  };
  add(core.join(""));
  const first = core[0] ?? "";
  add(first);
  add(first.replace(/ai$/, ""));
  add(first + "ai");
  return [...out];
}

function providerIdFor(host: string): string | null {
  const h = host.toLowerCase();
  const alias = HOST_ALIASES[h];
  if (alias) return alias;
  const table = byProvider;
  for (const cand of hostCandidates(h)) {
    if (table.has(cand) || providerIds.has(cand)) return cand;
  }
  return null;
}

function cheaper(a: ModelPrices, b: ModelPrices): boolean {
  if (a.input !== b.input) return a.input < b.input;
  return a.output < b.output;
}

// 무료가 아닌 단가를 우선한다. 구독/토큰 플랜 프로바이더의 $0 표기가
// 실제 종량 단가를 덮어써 비용을 0으로 만드는 것을 막기 위함.
function isZeroPrice(p: ModelPrices): boolean {
  return p.input === 0 && p.output === 0;
}

function betterPrice(a: ModelPrices, b: ModelPrices): boolean {
  const az = isZeroPrice(a) ? 1 : 0;
  const bz = isZeroPrice(b) ? 1 : 0;
  if (az !== bz) return az < bz;
  return cheaper(a, b);
}

function providerTableLookup(
  pid: string,
  candidates: string[],
): ModelPrices | null {
  const table = byProvider.get(pid);
  if (!table) return null;
  for (const c of candidates) {
    const hit = table.get(c);
    if (hit) return hit;
  }
  return null;
}

function buildIndex(json: Record<string, unknown>): void {
  const nextByProvider = new Map<string, Map<string, ModelPrices>>();
  const nextGlobal = new Map<string, ModelPrices>();
  const nextIds = new Set<string>();
  let modelCount = 0;
  for (const [pid, rawProvider] of Object.entries(json)) {
    nextIds.add(pid);
    const models =
      rawProvider && typeof rawProvider === "object"
        ? ((rawProvider as Record<string, unknown>).models as
            | Record<string, unknown>
            | undefined)
        : undefined;
    if (!models || typeof models !== "object") continue;
    const table = new Map<string, ModelPrices>();
    const entries: Array<[string, ModelPrices]> = [];
    for (const [mid, rawModel] of Object.entries(models)) {
      const prices =
        rawModel && typeof rawModel === "object"
          ? parseCost((rawModel as Record<string, unknown>).cost)
          : null;
      if (!prices) continue;
      modelCount++;
      entries.push([mid, prices]);
      table.set(mid.toLowerCase(), prices);
    }
    for (const [mid, prices] of entries) {
      const candidates = modelCandidates(mid);
      for (let i = 1; i < candidates.length; i++) {
        if (!table.has(candidates[i]!)) table.set(candidates[i]!, prices);
      }
      for (const c of candidates) {
        const cur = nextGlobal.get(c);
        if (!cur || betterPrice(prices, cur)) nextGlobal.set(c, prices);
      }
    }
    if (table.size) nextByProvider.set(pid, table);
  }
  byProvider = nextByProvider;
  globalIndex = nextGlobal;
  providerIds = nextIds;
  lookupCache = new Map();
  meta = {
    ...meta,
    updatedAt: new Date().toISOString(),
    models: modelCount,
    providers: nextByProvider.size,
    error: null,
  };
}

function resolve(provider: string, model: string): ModelPrices | null {
  const candidates = modelCandidates(model);
  const pid = providerIdFor(provider);
  if (pid) {
    const hit = providerTableLookup(pid, candidates);
    if (hit) return hit;
  }
  const lower = model.trim().toLowerCase();
  // "vendor/model" 형태면 vendor를 프로바이더 id로 간주한다.
  const slash = lower.lastIndexOf("/");
  if (slash > 0) {
    const vendor = lower.slice(0, slash);
    for (const v of [vendor, vendor.replace(/[^a-z0-9]/g, "")]) {
      const hit = providerTableLookup(v, candidates);
      if (hit) return hit;
    }
  }
  // 모델 id가 프로바이더 id로 시작하면("deepseek-...", "mistral-...") 그 단가를 우선한다.
  for (const id of providerIds) {
    if (id.length > 2 && lower.startsWith(`${id}-`)) {
      const hit = providerTableLookup(id, candidates);
      if (hit) return hit;
    }
  }
  // 그래도 못 찾으면 전체에서 이름이 맞는 단가를 쓴다(무료 표기 우선 회피).
  for (const c of candidates) {
    const hit = globalIndex.get(c);
    if (hit) return hit;
  }
  return null;
}

/** (upstream host, 모델 id)에 해당하는 USD/1M-token 단가. 없으면 null. */
export function lookupPrices(
  provider: string,
  model: string | null | undefined,
): ModelPrices | null {
  if (!model) return null;
  const key = `${provider}\u0000${model}`;
  if (lookupCache.has(key)) return lookupCache.get(key) ?? null;
  const result = resolve(provider, model);
  if (lookupCache.size >= CACHE_MAX) lookupCache.clear();
  lookupCache.set(key, result);
  return result;
}

export function getPricingMeta(): PricingMeta {
  return { ...meta };
}

export async function refreshPricing(): Promise<void> {
  meta = { ...meta, loading: true };
  try {
    const res = await fetch(PRICING_URL, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buildIndex((await res.json()) as Record<string, unknown>);
    console.log(
      `[pricing] loaded ${meta.models} models / ${meta.providers} providers from ${PRICING_URL}`,
    );
  } catch (e) {
    meta = { ...meta, error: String((e as Error)?.message ?? e) };
    console.warn(
      `[pricing] failed to load ${PRICING_URL}: ${meta.error} (keeping previous table)`,
    );
  } finally {
    meta = { ...meta, loading: false };
  }
}

/** 서버 시작 시 백그라운드 로드 + 주기적 갱신. 실패해도 서버는 계속 동작한다. */
export function initPricing(): void {
  void refreshPricing();
  const timer = setInterval(() => void refreshPricing(), REFRESH_MS);
  if (typeof (timer as { unref?: () => void }).unref === "function")
    (timer as { unref: () => void }).unref();
}
