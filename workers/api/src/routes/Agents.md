# API Routes

Purpose: HTTP request handling for Worker endpoints.

Exports:
- `contextRoutes.ts` handles `/api/contexts`.
- `topicRoutes.ts` handles `/api/topics` for listing and deleting study topics.

Rules:
- Validate input at the route boundary.
- Keep Cloudflare service calls inside service modules.
- Return shared API envelopes for all JSON responses.
- Topic lists are read from KV (`TOPICS_KV`); vector deletion is performed via `Vectorize`.

