# Ingestion Service

Purpose: Convert user-submitted study material into deterministic chunks ready for embedding.

Exports:
- `chunkStudySource(request)` returns normalized chunk records.

Rules:
- Do not call AI services from this module.
- Preserve topic and source metadata on every chunk.
- Keep chunking deterministic so failures can be retried safely.

