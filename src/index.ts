import { Elysia } from "elysia"
import { initDb, getRecent, getAll, getAllSince, isDbConnected } from "./db"
import { computeSummaries, computeTimeSeries, computeModelRankings } from "./metrics"
import { handleProxy } from "./proxy"
import { dashboardHtml } from "./dashboard"

const PORT = Number(process.env.PORT || 3000)

await initDb()

const app = new Elysia()

app.get("/health", () => ({
  ok: true,
  service: "tachometer",
  db: isDbConnected() ? "mongodb" : "memory",
  time: new Date().toISOString(),
}))

app.get("/healthz", async () => {
  const started = Date.now()
  let dbStatus: "ok" | "degraded" | "memory" = "memory"
  let dbLatencyMs: number | null = null
  if (isDbConnected()) {
    try {
      const { getCollection } = await import("./db")
      const col = getCollection()
      const t0 = Date.now()
      await col!.findOne({}, { projection: { _id: 1 } })
      dbLatencyMs = Date.now() - t0
      dbStatus = "ok"
    } catch {
      dbStatus = "degraded"
    }
  }
  return {
    ok: true,
    service: "tachometer",
    db: dbStatus,
    dbLatencyMs,
    uptimeSec: Math.round(process.uptime()),
    time: new Date().toISOString(),
    latencyMs: Date.now() - started,
  }
})

app.get("/readyz", async ({ set }: any) => {
  if (!isDbConnected()) {
    set.status = 503
    return { ok: false, ready: false, db: "memory", reason: "db not connected (running in memory mode)" }
  }
  try {
    const { getCollection } = await import("./db")
    await getCollection()!.findOne({}, { projection: { _id: 1 } })
    return { ok: true, ready: true, db: "ok" }
  } catch (e) {
    set.status = 503
    return { ok: false, ready: false, db: "degraded", reason: (e as Error).message }
  }
})

app.get("/api/requests", async ({ query }) => {
  const limit = Math.min(Number((query as any).limit || 100), 500)
  const requests = await getRecent(limit)
  return { requests }
})

app.get("/api/stats", async ({ query }) => {
  const raw = (query as any).window
  const allTime = raw === "all"
  const requestedMinutes = allTime ? 0 : Math.min(Number(raw || 60), 1440)
  const all = allTime || requestedMinutes >= 1440 ? await getAll() : await getAllSince(new Date(Date.now() - requestedMinutes * 60 * 1000))
  const oldest = all.length ? all.reduce((min, m) => Math.min(min, m.timestamp.getTime()), Date.now()) : Date.now()
  const windowMinutes = allTime ? Math.max(1, Math.floor((Date.now() - oldest) / 60000) + 1) : requestedMinutes
  const bucket = allTime
    ? Math.max(15, Math.ceil(windowMinutes / 96 / 15) * 15)
    : requestedMinutes <= 15 ? 1 : requestedMinutes <= 60 ? 5 : 15
  const summaries = computeSummaries(all, windowMinutes)
  const series = computeTimeSeries(all, bucket, windowMinutes)
  const modelRankings = computeModelRankings(all, windowMinutes)
  const total = summaries.find(s => s.provider === "__all__")?.totalRequests ?? 0
  return { windowMinutes, allTime, bucketMinutes: bucket, total, summaries, series, modelRankings }
})

const faviconSvg = await Bun.file(new URL("../public/favicon.svg", import.meta.url).pathname).text().catch(() => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#18181b"/><g fill="none" stroke="#fff" stroke-linecap="round"><path d="M6 20 A10 10 0 0 1 26 20" stroke-width="1.9"/><path d="M6 20 L7.3 19.15 M16 10 L16 12.3 M26 20 L24.7 19.15 M9.15 13.05 L10.55 13.95 M22.85 13.05 L21.45 13.95" stroke-width="1.55"/></g><g><line x1="16" y1="20" x2="23.6" y2="13.1" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/><circle cx="16" cy="20" r="2.7" fill="#fff"/><circle cx="16" cy="20" r="2.7" fill="none" stroke="#18181b" stroke-width=".7"/><circle cx="16" cy="20" r="1.05" fill="#18181b"/></g></svg>`)

app.get("/favicon.svg", () => new Response(faviconSvg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=86400" } }))
app.get("/favicon.ico", () => new Response(faviconSvg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=86400" } }))

app.get("/", () => new Response(dashboardHtml, { headers: { "content-type": "text/html; charset=utf-8" } }))

app.all("/*", async ({ request }) => {
  const url = new URL(request.url)
  const path = url.pathname
  if (path === "/pass" || path.startsWith("/pass/")) {
    return handleProxy(request)
  }
  return new Response("Not found", { status: 404 })
})

app.listen({ port: PORT, hostname: "0.0.0.0" }, () => {
  console.log(`[tachometer] listening on http://0.0.0.0:${PORT}`)
  console.log(`[tachometer] proxy: http://0.0.0.0:${PORT}/pass/<target-host>/<path>  e.g. /pass/api.openai.com/v1/responses`)
  console.log(`[tachometer] dashboard: http://0.0.0.0:${PORT}/`)
})

export type App = typeof app
