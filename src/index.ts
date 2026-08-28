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
  const windowMinutes = Math.min(Number((query as any).window || 60), 1440)
  const bucket = windowMinutes <= 15 ? 1 : windowMinutes <= 60 ? 5 : 15
  const all = windowMinutes >= 1440 ? await getAll() : await getAllSince(new Date(Date.now() - windowMinutes * 60 * 1000))
  const summaries = computeSummaries(all, windowMinutes)
  const series = computeTimeSeries(all, bucket, windowMinutes)
  const modelRankings = computeModelRankings(all, windowMinutes)
  const total = summaries.find(s => s.provider === "__all__")?.totalRequests ?? 0
  return { windowMinutes, bucketMinutes: bucket, total, summaries, series, modelRankings }
})

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
