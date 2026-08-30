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

Env (Bun loads `.env`): `PORT` (3000), `MONGO_URL` or `MONGODB_URI`, `DB_NAME` (`tachometer`). Mongo is optional — connect fails → in-memory store (cap 10_000).

## Layout

| File | Role |
|---|---|
| `src/index.ts` | Elysia app. Register new routes **before** `app.all("/*")`. |
| `src/proxy.ts` | HTTPS passthrough + token/TTFT scrape |
| `src/metrics.ts` | In-process aggregations |
| `src/db.ts` | Mongo collection `requests`; memory fallback |
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
- `GET /healthz` db ping
- `GET /readyz` **503 in memory mode**
- `GET /api/stats?window=60` window max 1440 min; includes synthetic provider `__all__`; `modelRankings` sorted by total tokens
- `GET /api/requests?limit=100` limit max 500

## CI / Docker

`.github/workflows/docker.yml` only: Blacksmith multi-arch build → `ghcr.io/<repo>`. PRs build, do not push. No test job. Do not swap runners/actions unless asked.

## Conventions

- Dashboard copy is Korean (`lang="ko"`).
- Keep model rankings ordered by total tokens (input+output), not request count or latency.
- Runtime is Bun. Deps are `elysia` + `mongodb` only.
- Favicon load in `src/index.ts` uses `new URL(...).pathname` with `Bun.file`. On Windows that path is often wrong — if touching it, pass the `URL` to `Bun.file` directly.
