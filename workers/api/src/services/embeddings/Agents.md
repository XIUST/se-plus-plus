# Embeddings Service

Purpose: Generate vector embeddings from chunk text using Cloudflare Workers AI.

Exports:
- `createEmbeddings(ai, texts)` returns one embedding vector per submitted text.

Rules:
- Use `@cf/baai/bge-base-en-v1.5` unless the shared architecture changes.
- Keep output order aligned with input text order.
- Throw clear errors when the model response cannot be used.

