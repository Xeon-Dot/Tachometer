import { insertMetric } from "./db";

export function extractProvider(pathname: string): {
  host: string | null;
  rest: string;
} {
  const trimmed = pathname.replace(/^\/+/, "");
  if (!trimmed) return { host: null, rest: "/" };
  const idx = trimmed.indexOf("/");
  const host = idx === -1 ? trimmed : trimmed.slice(0, idx);
  const rest = idx === -1 ? "/" : "/" + trimmed.slice(idx + 1);
  if (!host.includes(".")) return { host: null, rest: pathname };
  return { host, rest };
}

function parseTokensFromJson(obj: unknown): {
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  totalTokens: number | null;
  model: string | null;
} {
  if (!obj || typeof obj !== "object")
    return {
      inputTokens: null,
      outputTokens: null,
      cachedTokens: null,
      totalTokens: null,
      model: null,
    };
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  let cachedTokens: number | null = null;
  let totalTokens: number | null = null;
  let model: string | null = obj.model ?? obj.model_name ?? null;

  const u = obj.usage ?? obj.usageMetadata ?? obj.usage_metadata ?? null;
  if (u) {
    if (typeof u.prompt_tokens === "number") inputTokens = u.prompt_tokens;
    if (typeof u.input_tokens === "number") inputTokens = u.input_tokens;
    if (typeof u.promptTokenCount === "number")
      inputTokens = u.promptTokenCount;
    if (typeof u.inputTokens === "number") inputTokens = u.inputTokens;

    if (typeof u.completion_tokens === "number")
      outputTokens = u.completion_tokens;
    if (typeof u.output_tokens === "number") outputTokens = u.output_tokens;
    if (typeof u.candidatesTokenCount === "number")
      outputTokens = u.candidatesTokenCount;
    if (typeof u.outputTokens === "number") outputTokens = u.outputTokens;
    if (typeof u.completionTokens === "number")
      outputTokens = u.completionTokens;

    if (typeof u.total_tokens === "number") totalTokens = u.total_tokens;
    if (typeof u.totalTokenCount === "number") totalTokens = u.totalTokenCount;
    if (typeof u.totalTokens === "number") totalTokens = u.totalTokens;

    if (typeof u.cached_tokens === "number") cachedTokens = u.cached_tokens;
    if (typeof u.cachedTokens === "number") cachedTokens = u.cachedTokens;
    if (
      u.prompt_tokens_details &&
      typeof u.prompt_tokens_details.cached_tokens === "number"
    )
      cachedTokens = u.prompt_tokens_details.cached_tokens;
    if (typeof u.cache_read_input_tokens === "number")
      cachedTokens = u.cache_read_input_tokens;
    if (typeof u.cached_content_token_count === "number")
      cachedTokens = u.cached_content_token_count;
  }
  if (obj.prompt_tokens && inputTokens === null)
    inputTokens = obj.prompt_tokens;
  if (obj.completion_tokens && outputTokens === null)
    outputTokens = obj.completion_tokens;
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
    const candidates = [
      parseTokensFromJson(obj.message ?? obj.delta ?? obj.response ?? obj),
      parseTokensFromJson(obj),
    ];
    for (const p of candidates) {
      if (!p) continue;
      if (p.inputTokens !== null) inputTokens = p.inputTokens;
      if (p.outputTokens !== null) outputTokens = p.outputTokens;
      if (p.cachedTokens !== null) cachedTokens = p.cachedTokens;
      if (p.totalTokens !== null) totalTokens = p.totalTokens;
      if (p.model) model = p.model;
    }
    if (obj.type === "message_start" && obj.message?.usage) {
      const pu = parseTokensFromJson({ usage: obj.message.usage });
      if (pu.inputTokens !== null) inputTokens = pu.inputTokens;
    }
    if (obj.type === "message_delta" && obj.usage) {
      const pu = parseTokensFromJson({ usage: obj.usage });
      if (pu.outputTokens !== null) outputTokens = pu.outputTokens;
    }
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

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: body as unknown,
      redirect: "manual",
    } as unknown);
  } catch (e: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    await insertMetric({
      provider: host,
      path: rest,
      method: request.method,
      status: 502,
      latencyMs,
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
      error: String(e?.message ?? e),
    });
    return new Response(
      JSON.stringify({
        error: "Upstream fetch failed",
        target: targetUrl,
        details: String(e?.message ?? e),
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
    const latencyMs = Math.round(performance.now() - start);
    let inputTokens: number | null = null,
      outputTokens: number | null = null,
      cachedTokens: number | null = null,
      totalTokens: number | null = null,
      model: string | null = null;
    const ct = upstream.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        const text = await upstream.text();
        const json = tryParseJson(text);
        if (json) {
          const p = parseTokensFromJson(json);
          inputTokens = p.inputTokens;
          outputTokens = p.outputTokens;
          cachedTokens = p.cachedTokens;
          totalTokens = p.totalTokens;
          model = p.model;
        }
        const metricsLatency = Math.round(performance.now() - start);
        await insertMetric({
          provider: host,
          path: rest,
          method: request.method,
          status: upstream.status,
          latencyMs: metricsLatency,
          ttftMs: null,
          isStreaming: false,
          inputTokens,
          outputTokens,
          cachedTokens,
          totalTokens,
          requestBytes,
          responseBytes: text.length,
          timestamp: new Date(),
          model,
          error: upstream.ok ? null : `upstream ${upstream.status}`,
        });
        return new Response(text, {
          status: upstream.status,
          headers: respHeaders,
        });
      } catch {}
    }
    await insertMetric({
      provider: host,
      path: rest,
      method: request.method,
      status: upstream.status,
      latencyMs,
      ttftMs: null,
      isStreaming: false,
      inputTokens,
      outputTokens,
      cachedTokens,
      totalTokens,
      requestBytes,
      responseBytes: 0,
      timestamp: new Date(),
      model,
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
        const latencyMs = Math.round(performance.now() - start);
        let inputTokens: number | null = null,
          outputTokens: number | null = null,
          cachedTokens: number | null = null,
          totalTokens: number | null = null,
          model: string | null = null;

        if (isStreaming || sseBuffer) {
          const parsed = extractFromSseBuffer(sseBuffer);
          inputTokens = parsed.inputTokens;
          outputTokens = parsed.outputTokens;
          cachedTokens = parsed.cachedTokens;
          totalTokens = parsed.totalTokens;
          model = parsed.model;
        }
        if (isJsonBuffered && rawBuffer) {
          const json = tryParseJson(rawBuffer);
          if (json) {
            const p = parseTokensFromJson(json);
            if (p.inputTokens !== null) inputTokens = p.inputTokens;
            if (p.outputTokens !== null) outputTokens = p.outputTokens;
            if (p.cachedTokens !== null) cachedTokens = p.cachedTokens;
            if (p.totalTokens !== null) totalTokens = p.totalTokens;
            if (p.model) model = p.model;
          }
        }
        const isStreamFlag = isStreaming || sseBuffer.includes("data:");
        await insertMetric({
          provider: host,
          path: rest,
          method: request.method,
          status: upstream.status,
          latencyMs,
          ttftMs,
          isStreaming: isStreamFlag,
          inputTokens,
          outputTokens,
          cachedTokens,
          totalTokens,
          requestBytes,
          responseBytes,
          timestamp: new Date(),
          model,
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
