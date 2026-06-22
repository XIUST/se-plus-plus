# Se++ (Session++)

Se++ is an AI-powered exam and study trainer. This first slice sets up the repository, shared API contracts, a Cloudflare Worker ingestion endpoint, and a React screen for submitting study notes.

## Local Commands

Install dependencies once Node/pnpm are available:

```powershell
pnpm install
```

Run the frontend:

```powershell
pnpm dev:web
```

Run the Worker API:

```powershell
pnpm dev:api
```

## Cloudflare Resources

The ingestion Worker expects:

- Workers AI binding: `AI`
- Vectorize binding: `VECTORIZE`
- Vectorize index dimensions: `768`
- Suggested metric: `cosine`

