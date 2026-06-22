# Flashcards Service
Purpose: Generate flashcards and evaluate student answers using Cloudflare Workers AI.
Exports:
- `generateFlashcardsFromContext(ai, chunks, topic, count)` returns generated flashcards.
- `evaluateAnswer(ai, question, expectedAnswer, userAnswer, chunks)` returns an evaluation score and verdict.
Rules:
- Use `@cf/meta/llama-3.1-8b-instruct` for language model tasks.
- Return structured JSON and parse it carefully (handling markdown fences).
- Fallback gracefully when AI generation fails.
