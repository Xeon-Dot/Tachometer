import { insertMetric } from "./db";

export function extractProvider(pathname: string): {
  host: string | null;
  rest: string;
} {
  const trimmed = pathname.replace(/^\/+/, "");
  if (!trimmed) return { host: null, rest: "/" };
  const idx = trimmed.indexOf("/");
  // Handle paths that start with "/"
  const host = idx === -1 ? trimmed : trimmed.slice(0, idx);
  const rest = idx === -1 ? "/" : "/" + trimmed.slice(idx + 1);
  if (!host.includes(".")) return { host: null, rest: pathname };
  return { host, rest };
}

function pickNum(o: Record<string, unknown>, keys: string[]): number | null {
  let v: number | null = null;
  for (const k of keys) if (typeof o[k] === "number") v = o[k] as number;
  return v;
}

const IN_KEYS = [
  "prompt_tokens",
  "input_tokens",
  "promptTokenCount",
  "inputTokens",
];
const OUT_KEYS = [
  "completion_tokens",
  "output_tokens",
  "candidatesTokenCount",
  "outputTokens",
  "completionTokens",
];
const TOTAL_KEYS = ["total_tokens", "totalTokenCount", "totalTokens"];
const CACHED_KEYS = [
  "cached_tokens",
  "cachedTokens",
  "cache_read_input_tokens",
  "cached_content_token_count",
];

function parseTokensFromJson(obj: any): {
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  totalTokens: number | null;
  model: string | null;
} {
  const none = {
    inputTokens: null,
    outputTokens: null,
    cachedTokens: null,
    totalTokens: null,
    model: null,
  };
  if (!obj || typeof obj !== "object") return { ...none };
  const usages = [
    obj.usage,
    obj.usageMetadata,
    obj.usage_metadata,
    obj.message?.usage,
    obj.delta?.usage,
    obj.response?.usage,
    obj,
  ].filter((u) => u && typeof u === "object") as Record<string, unknown>[];
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  let cachedTokens: number | null = null;
  let totalTokens: number | null = null;
  for (const u of usages) {
    inputTokens = pickNum(u, IN_KEYS) ?? inputTokens;
    outputTokens = pickNum(u, OUT_KEYS) ?? outputTokens;
    totalTokens = pickNum(u, TOTAL_KEYS) ?? totalTokens;
    cachedTokens =
      pickNum(u, CACHED_KEYS) ??
      (u.prompt_tokens_details && typeof u.prompt_tokens_details === "object"
        ? pickNum(u.prompt_tokens_details as Record<string, unknown>, [
            "cached_tokens",
          ])
        : null) ??
      cachedTokens;
  }
  const model: string | null =
    obj.model ??
    obj.model_name ??
    obj.message?.model ??
    obj.response?.model ??
    null;
  if (inputTokens !== null && outputTokens !== null && totalTokens === null)
    totalTokens = inputTokens + outputTokens;
  return { inputTokens, outputTokens, cachedTokens, totalTokens, model };
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractFromSseBuffer(buffer: string) {
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  let cachedTokens: number | null = null;
  let totalTokens: number | null = null;
  let model: string | null = null;
  const lines = buffer.split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    let jsonStr: string | null = null;
    if (t.startsWith("data:")) jsonStr = t.slice(5).trim();
    else if (t.startsWith("{") || t.startsWith("[")) jsonStr = t;
    if (!jsonStr || jsonStr === "[DONE]") continue;
    const obj = tryParseJson(jsonStr);
    if (!obj) continue;
    const p = parseTokensFromJson(obj);
    if (p.inputTokens !== null) inputTokens = p.inputTokens;
    if (p.outputTokens !== null) outputTokens = p.outputTokens;
    if (p.cachedTokens !== null) cachedTokens = p.cachedTokens;
    if (p.totalTokens !== null) totalTokens = p.totalTokens;
    if (p.model) model = p.model;
  }
  return { inputTokens, outputTokens, cachedTokens, totalTokens, model };
}

export async function handleProxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let pathname = url.pathname;
  if (pathname.startsWith("/pass/")) pathname = pathname.slice(5);
  else if (pathname === "/pass") pathname = "/";

  const { host, rest } = extractProvider(pathname);
  if (!host) {
    return new Response(
      JSON.stringify({
        error:
          "Invalid proxy path. Use /pass/<target-host>/<path> e.g. /pass/api.openai.com/v1/responses",
      }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const targetUrl = `https://${host}${rest}${url.search}`;
  const start = performance.now();
  let ttftMs: number | null = null;

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.delete("host");
  forwardHeaders.delete("connection");
  forwardHeaders.delete("content-length");
  forwardHeaders.set("host", host);
  forwardHeaders.set("x-forwarded-host", url.host);
  forwardHeaders.set("x-tachometer-proxy", "1");

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 0) body = buf;
  }
  const requestBytes = body?.byteLength ?? 0;
  const log = (extra: Record<string, unknown>) =>
    insertMetric({
      provider: host,
      path: rest,
      method: request.method,
      status: 0,
      latencyMs: Math.round(performance.now() - start),
      ttftMs: null,
      isStreaming: false,
      inputTokens: null,
      outputTokens: null,
      cachedTokens: null,
      totalTokens: null,
      requestBytes,
      responseBytes: null,
      timestamp: new Date(),
      model: null,
      error: null,
      ...extra,
    } as never);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: body as unknown,
      redirect: "manual",
    } as unknown);
  } catch (e: unknown) {
    await log({ status: 502, error: String((e as Error)?.message ?? e) });
    return new Response(
      JSON.stringify({
        error: "Upstream fetch failed",
        target: targetUrl,
        details: String((e as Error)?.message ?? e),
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const isStreaming =
    (upstream.headers.get("content-type") || "").includes("event-stream") ||
    upstream.headers.get("x-stream") === "1";

  const respHeaders = new Headers(upstream.headers);
  respHeaders.delete("content-encoding");
  respHeaders.delete("content-length");
  respHeaders.set("x-tachometer-provider", host);
  respHeaders.set("access-control-allow-origin", "*");
  respHeaders.set("access-control-expose-headers", "*");

  if (!upstream.body) {
    const ct = upstream.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        const text = await upstream.text();
        const p = parseTokensFromJson(tryParseJson(text));
        await log({
          status: upstream.status,
          ...p,
          responseBytes: text.length,
          error: upstream.ok ? null : `upstream ${upstream.status}`,
        });
        return new Response(text, {
          status: upstream.status,
          headers: respHeaders,
        });
      } catch {}
    }
    await log({
      status: upstream.status,
      responseBytes: 0,
      error: upstream.ok ? null : `upstream ${upstream.status}`,
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  }

  const decoder = new TextDecoder();
  let responseBytes = 0;
  let sseBuffer = "";
  let rawBuffer = "";
  let isJsonBuffered = false;
  const contentType = upstream.headers.get("content-type") || "";

  if (!isStreaming && contentType.includes("application/json"))
    isJsonBuffered = true;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body?.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (ttftMs === null) {
            ttftMs = Math.round(performance.now() - start);
          }
          responseBytes += value.byteLength;
          if (
            isStreaming ||
            contentType.includes("event-stream") ||
            contentType.includes("text/plain")
          ) {
            sseBuffer += decoder.decode(value, { stream: true });
            if (sseBuffer.length > 200000) sseBuffer = sseBuffer.slice(-200000);
          } else if (isJsonBuffered) {
            rawBuffer += decoder.decode(value, { stream: true });
            if (rawBuffer.length > 500000) rawBuffer = rawBuffer.slice(-500000);
          }
          controller.enqueue(value);
        }
      } catch (e) {
        controller.error(e);
      } finally {
        controller.close();
        const buf = sseBuffer || (isJsonBuffered ? rawBuffer : "");
        const p = buf
          ? isJsonBuffered && !sseBuffer
            ? parseTokensFromJson(tryParseJson(buf))
            : extractFromSseBuffer(buf)
          : null;
        await log({
          status: upstream.status,
          ttftMs,
          isStreaming: isStreaming || sseBuffer.includes("data:"),
          ...(p ?? {}),
          responseBytes,
          error: upstream.ok ? null : `upstream ${upstream.status}`,
        });
      }
    },
  });

  return new Response(stream, {
    status: upstream.status,
    headers: respHeaders,
  });
}
