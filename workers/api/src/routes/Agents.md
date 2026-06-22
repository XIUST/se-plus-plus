# API Routes

Purpose: HTTP request handling for Worker endpoints.

Exports:
- `contextRoutes.ts` handles `/api/contexts`.

Rules:
- Validate input at the route boundary.
- Keep Cloudflare service calls inside service modules.
- Return shared API envelopes for all JSON responses.

