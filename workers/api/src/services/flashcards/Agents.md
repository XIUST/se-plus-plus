# Flashcards Service

Purpose: Generate flashcards and evaluate student answers using Cloudflare Workers AI.

Exports:
- `generateFlashcardsFromContext(ai, chunks, topic, count)` returns generated flashcards.
- `evaluateAnswer(ai, question, expectedAnswer, userAnswer, chunks)` returns an evaluation score and verdict.
- `extractJson(text)` helper for parsing JSON from LLM responses that may contain markdown fences or trailing text.

Rules:
- Use `@cf/meta/llama-3.1-8b-instruct-fast` for language model tasks.
- Prefer Workers AI JSON mode with `response_format: { type: "json_schema", json_schema: ... }` to get structured output.
- Fall back to `extractJson` if the model returns plain text instead of a parsed schema result.
- Retry once with a lower temperature if parsing or schema validation fails.
- Throw on persistent failures so the route can return a typed error instead of silently falling back.
