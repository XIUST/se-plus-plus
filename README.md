# Se++ (Session++)

Se++ is an AI-powered exam and study trainer. It provides a React frontend for submitting study material and a Cloudflare Worker API that converts that material into searchable vector chunks, generates flashcards, and evaluates student answers.

## Repository Layout

- `apps/web` — React frontend built with Vite.
- `workers/api` — Cloudflare Worker API backend.
- `shared` — Portable TypeScript contracts, types, and validation used by both `apps/web` and `workers/api`.

## Prerequisites

- Node.js and pnpm. This repository uses `pnpm@11.5.3`.
- A Cloudflare account.
- Wrangler authenticated against the target Cloudflare account:

  ```powershell
  npx wrangler login
  ```

## Local Development

Install dependencies:

```powershell
pnpm install
```

Run the frontend:

```powershell
pnpm dev:web
```

Run the Worker API locally:

```powershell
pnpm dev:api
```

Typecheck the whole workspace:

```powershell
pnpm typecheck
```

The API client in `apps/web/src/shared/api/client.ts` uses `http://localhost:8787` during development. Set `VITE_API_BASE_URL` at build time to override the production API URL.

## Cloudflare Resources

The `workers/api` Worker expects the following bindings, configured in `workers/api/wrangler.jsonc`:

- `AI` — Workers AI binding for embeddings and text generation.
- `VECTORIZE` — binding to the `se-plus-study-context-v2` Vectorize index.
- `TOPICS_KV` — KV namespace that stores the topic catalog.

### Vectorize index

Vectorize index settings:

- Index name: `se-plus-study-context-v2`
- Dimensions: `1024`
- Metric: `cosine`
- Metadata indexes: `topic` (string), `sourceId` (string)

Create the index and its metadata indexes before deploying:

```powershell
npx wrangler vectorize create se-plus-study-context-v2 --dimensions=1024 --metric=cosine
npx wrangler vectorize create-metadata-index se-plus-study-context-v2 --property-name=topic --type=string
npx wrangler vectorize create-metadata-index se-plus-study-context-v2 --property-name=sourceId --type=string
```

### KV namespace

Create a KV namespace for the topic catalog and update `workers/api/wrangler.jsonc` with the returned ID:

```powershell
npx wrangler kv namespace create "TOPICS_KV"
```

## Deployment

Deploy the API Worker:

```powershell
pnpm --filter @se-plus/api deploy
```

This runs `wrangler deploy` inside `workers/api`.

Deploy the web frontend to Cloudflare Pages from `apps/web` after building:

```powershell
pnpm --filter @se-plus/web build
npx wrangler pages deploy dist
```

## API Endpoints

- `GET /health` — Health check.
- `POST /api/contexts` — Ingest study context, chunk it, and store embeddings.
- `GET /api/topics` — List ingested topics.
- `DELETE /api/topics` — Delete a topic and its vectors.
- `POST /api/flashcards/generate` — Generate flashcards for a topic.
- `POST /api/flashcards/evaluate` — Evaluate a student answer against an expected answer.

All JSON responses follow the shared `{ ok, data } | { ok, error }` envelope defined in `@se-plus/shared`.

## Notes

- The embedding model used for retrieval is `@cf/baai/bge-m3`, which produces 1024-dimensional vectors.
- The generation and evaluation models default to `@cf/meta/llama-3.3-70b-instruct-fp8-fast` and are configurable through `wrangler.jsonc` vars.
- All UI copy is in English.
