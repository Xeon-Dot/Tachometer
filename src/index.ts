import { Elysia } from "elysia";
import { initDb, queryMetrics, isDbConnected } from "./db";
import {
  computeSummaries,
  computeTimeSeries,
  computeModelRankings,
} from "./metrics";
import { handleProxy } from "./proxy";
import { dashboardHtml } from "./dashboard";

const PORT = Number(process.env.PORT || 3000);

await initDb();

const app = new Elysia();

app.get("/health", () => ({
  ok: true,
  service: "tachometer",
  db: isDbConnected() ? "mongodb" : "memory",
  time: new Date().toISOString(),
}));

app.get("/api/requests", async ({ query }) => {
  const limit = Math.min(Number((query as unknown).limit || 100), 500);
  const requests = await queryMetrics({ limit });
  return { requests };
});

app.get("/api/stats", async ({ query }) => {
  const raw = (query as unknown).window;
  const allTime = raw === "all";
  const requestedMinutes = allTime ? 0 : Math.min(Number(raw || 60), 1440);
  const all = await queryMetrics(
    allTime || requestedMinutes >= 1440
      ? {}
      : { since: new Date(Date.now() - requestedMinutes * 60 * 1000) },
  );
  const windowMinutes = allTime
    ? Math.max(
        1,
        all.length
          ? Math.floor(
              (Date.now() -
                Math.min(...all.map((m) => m.timestamp.getTime()))) /
                60000,
            ) + 1
          : 1,
      )
    : requestedMinutes;
  const summaries = computeSummaries(all, windowMinutes);
  const series = computeTimeSeries(all, windowMinutes);
  const modelRankings = computeModelRankings(all);
  const total =
    summaries.find((s) => s.provider === "__all__")?.totalRequests ?? 0;
  return {
    windowMinutes,
    allTime,
    bucketMinutes: 5,
    total,
    summaries,
    series,
    modelRankings,
  };
});

const faviconFile = Bun.file(new URL("../public/favicon.svg", import.meta.url));
app.get(
  "/favicon.svg",
  () =>
    new Response(faviconFile, {
      headers: {
        "content-type": "image/svg+xml",
        "cache-control": "public, max-age=86400",
      },
    }),
);

app.get(
  "/",
  () =>
    new Response(dashboardHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
);

app.all("/*", async ({ request }) => {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === "/pass" || path.startsWith("/pass/")) {
    return handleProxy(request);
  }
  return new Response("Not found", { status: 404 });
});

app.listen({ port: PORT, hostname: "0.0.0.0" }, () => {
  console.log(`[tachometer] listening on http://0.0.0.0:${PORT}`);
  console.log(
    `[tachometer] proxy: http://0.0.0.0:${PORT}/pass/<target-host>/<path>  e.g. /pass/api.openai.com/v1/responses`,
  );
  console.log(`[tachometer] dashboard: http://0.0.0.0:${PORT}/`);
});
