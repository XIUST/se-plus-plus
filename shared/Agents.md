# Shared Module

Purpose: Portable TypeScript contracts and validation helpers used by both the React frontend and Cloudflare Worker API.

Exports:
- API request and response types.
- Study source, chunk, and ingestion result types.
- Lightweight runtime validation for ingestion requests.

Rules:
- Do not import frontend or Worker-only packages here.
- Keep this package runtime-portable.
- Prefer explicit data contracts over loosely typed objects.

