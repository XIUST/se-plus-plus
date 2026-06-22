# Web Shared Module

Purpose: Frontend-only shared utilities such as API clients, formatting helpers, and browser adapters.

Exports:
- API client functions from `api/client.ts`.

Rules:
- Keep React components out of this folder.
- Import shared domain contracts from `@se-plus/shared`.
- Do not read Cloudflare bindings here; this module runs in the browser.

