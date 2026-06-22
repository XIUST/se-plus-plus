# Web API Client

Purpose: Typed browser client for Se++ Worker API routes.

Exports:
- `ingestContext(request)` posts study context to the Worker.

Rules:
- Return shared API response envelopes unchanged when possible.
- Keep base URL configuration centralized.
- Surface network failures as typed API errors.

