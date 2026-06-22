# Worker API Module

Purpose: Cloudflare Worker backend for Se++ API routes.

Exports:
- `src/index.ts` as the Worker entrypoint.
- Context ingestion route under `/api/contexts`.

Rules:
- Keep routing thin; move domain behavior into `src/services`.
- Use Cloudflare bindings through the `Env` type only.
- Return typed JSON envelopes that match `@se-plus/shared`.

