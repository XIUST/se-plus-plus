# Flashcards Service

Purpose: Generate flashcards and evaluate student answers using Cloudflare Workers AI.

Exports:
- `generateFlashcardsFromContext(ai, chunks, topic, count)` returns generated flashcards.
- `evaluateAnswer(ai, question, expectedAnswer, userAnswer, chunks)` returns an evaluation score and verdict.
- `extractJson(text)` helper for parsing JSON from LLM responses that may contain markdown fences or trailing text.

Rules:
- Use `@cf/meta/llama-3.1-8b-instruct` for language model tasks.
- Return structured JSON and parse it carefully using `extractJson`.
- Retry once with a lower temperature if parsing fails.
- Throw on persistent failures so the route can return a typed error instead of silently falling back.
