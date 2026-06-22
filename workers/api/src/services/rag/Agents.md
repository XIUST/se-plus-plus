# RAG Storage Service

Purpose: Store and retrieve semantic study context for future retrieval-augmented generation.

Exports:
- `insertContextVectors(vectorize, chunks, embeddings)` inserts chunk vectors with metadata.

Rules:
- Store enough metadata to reconstruct topic, title, source, and chunk order.
- Do not generate embeddings here; this module only persists and queries vectors.
- Keep Vectorize operations isolated so retrieval can evolve without route rewrites.

