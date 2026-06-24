# Flashcards Service

Purpose: Generate flashcards and evaluate student answers using Cloudflare Workers AI.

Exports:
- `generateFlashcardsFromContext(ai, modelName, chunks, topic, count)` returns generated flashcards.
- `evaluateAnswer(ai, modelName, question, expectedAnswer, userAnswer, chunks)` returns an evaluation score and verdict.
- `extractJson(text)` helper for parsing JSON from LLM responses that may contain markdown fences or trailing text.

Rules:
- The caller chooses the Workers AI text generation model via the `modelName` argument.
- Default to `@cf/google/gemma-4-26b-a4b-it` if no model is supplied at the route/service boundary.
- Prefer Workers AI JSON mode with `response_format: { type: "json_schema", json_schema: ... }` to get structured output.
- Fall back to `extractJson` if the model returns plain text instead of a parsed schema result.
- Retry once with a lower temperature if parsing or schema validation fails.
- Throw on persistent failures so the route can return a typed error instead of silently falling back.

Configuration:
- `wrangler.jsonc` exposes `GENERATION_MODEL` and `EVALUATION_MODEL` as `vars` so the same Worker can use different models for each task.
- Keep the two model parameters separate even if they currently point to the same model, so they can diverge later without code changes.
