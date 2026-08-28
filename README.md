# Tachometer — AI API Tachometer

Elysia + Bun + MongoDB 기반 AI API 프록시 성능 계측기.

## 동작

- `https://tach.cometer/pass/<provider-host>/<path>` 형태로 요청 → 해당 프로바이더로 그대로 패스스루
  - 예: `https://tach.cometer/pass/api.openai.com/v1/responses`
  - 예: `https://tach.cometer/pass/api.anthropic.com/v1/messages`
  - 예: `https://tach.cometer/pass/api.some.provider/api/v1/chat/completions`
- 모든 헤더/바디를 그대로 전달하고, 응답도 그대로 스트리밍 반환
- 동시에 측정값 저장: latency, TTFT, P50/P95/P99/AVG, input/output/cached tokens, total tokens, RPM, TPM, tokens/sec, 성공률 등

로컬에서는 `http://localhost:3000/pass/api.openai.com/v1/responses` 처럼 호출.

## 실행

```bash
bun install
# MongoDB 없으면 메모리 저장소로 자동 폴백
MONGO_URL=mongodb://localhost:27017 bun run src/index.ts
# 또는
bun run dev
```

## 엔드포인트

- `GET /` 대시보드
- `GET /health`
- `GET /api/stats?window=60` 집계 (window 분)
- `GET /api/requests?limit=100` 최근 요청
- `ALL /pass/<target-host>/<rest>` 프록시

## 측정 항목

- `latencyMs`, `ttftMs` (첫 바이트까지), `isStreaming`
- `inputTokens`, `outputTokens`, `cachedTokens`, `totalTokens`, `model`
- 파생: RPM, TPM(in/out/total), tokens/sec, P50/P95/P99/AVG, 성공률/에러율
- OpenAI / Anthropic / Gemini / 일반 OpenAI-호환 usage 스키마 자동 파싱 (SSE 포함)
