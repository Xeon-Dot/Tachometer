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
  if (path === "/" || path === "/health" || path.startsWith("/api/")) {
    return new Response("Not found", { status: 404 })
  }
  return handleProxy(request)
})

app.listen(PORT, () => {
  console.log(`[tachometer] listening on http://localhost:${PORT}`)
  console.log(`[tachometer] proxy: http://localhost:${PORT}/<target-host>/<path>  e.g. /api.openai.com/v1/responses`)
  console.log(`[tachometer] dashboard: http://localhost:${PORT}/`)
})

export type App = typeof app
