# AGENTS.md

Bun + Elysia proxy that meters AI API calls. No test, lint, or typecheck scripts — do not invent them.

## Commands

```bash
bun install
bun run dev              # watch src/index.ts
bun run start            # bun run src/index.ts
bun run build            # bun build → dist/, --target bun
docker compose up --build
```

Env (Bun loads `.env`): `PORT` (3000), `MONGO_URL` or `MONGODB_URI`, `DB_NAME` (`tachometer`), `REQUIRE_MONGO` (`1`/`true`/`yes`/`on` → Mongo 연결 실패 시 서버 시작 자체를 실패, 폴백 없음), `PRICING_URL` (기본 `https://models.dev/api.json`). Mongo is optional — connect fails → in-memory store (cap 10_000).

## Layout

| File               | Role                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `src/index.ts`     | Elysia app. Register new routes **before** `app.all("/*")`.                                    |
| `src/proxy.ts`     | HTTPS passthrough + token/TTFT scrape                                                          |
| `src/metrics.ts`   | In-process aggregations (tokens, latency, cost via pricing.ts)                                                                        |
| `src/db.ts`        | Mongo collection `requests`; memory fallback                                                   |
| `src/pricing.ts` | models.dev `api.json` loader (6h refresh) + (host, model) -> USD per 1M tokens; not persisted |
| `src/dashboard.ts` | Entire UI as one HTML/CSS/JS template string (Chart.js CDN). Do not split into a frontend app. |

`.commandcode/` is design notes, not runtime.

## Proxy

- URL: `/pass/<target-host>/<path>` (local: `http://localhost:3000/pass/api.openai.com/v1/responses`)
- Host must contain `.` or the request is 400
- Upstream is always `https://`; headers/body forwarded; body streamed back
- Token parse is heuristic in `proxy.ts` (OpenAI / Anthropic / Gemini / SSE). Extend there — no parser package.

## APIs

- `GET /` dashboard
- `GET /health` always 200; `db` is `"mongodb"` \| `"memory"` (compose/Dockerfile healthcheck uses this)
- `GET /api/stats?window=60` window max 1440 min; `window=all` = 전체 시간 (데이터 전체 집계, 응답의 `windowMinutes`는 실제 데이터 스팬 분, `allTime: true`); includes synthetic provider `__all__`; `modelRankings` sorted by total tokens; `pricing` = 가격표 메타(`updatedAt`/`models`/`error`); each summary/ranking has `cost` (USD, `pricedRequests`/`unpricedRequests`) and `cacheWriteTokens`
- `GET /api/requests?limit=100` limit max 500; 각 행에 `cost`(USD, 가격 미매칭이면 `null`) 포함

## CI / Docker

`.github/workflows/docker.yml` only: Blacksmith multi-arch build → `ghcr.io/<repo>`. PRs build, do not push. No test job. Do not swap runners/actions unless asked.

## Conventions

- Dashboard copy is English (`lang="en"`).
- Timestamps are stored and transported as UTC (ISO 8601 `Z`); the dashboard renders them in the viewer's local timezone.
- Keep model rankings ordered by total tokens (input+output), not request count or latency.
- Runtime is Bun. Deps are `elysia` + `mongodb` only.
- Favicon load in `src/index.ts` passes the `URL` to `Bun.file` directly.
