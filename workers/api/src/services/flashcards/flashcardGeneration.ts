import type { Flashcard } from "@se-plus/shared";
import { extractJson } from "./jsonExtraction";

export async function generateFlashcardsFromContext(
  ai: Ai,
  contextChunks: { content: string; id: string }[],
  topic: string,
  count: number,
): Promise<Flashcard[]> {
  const systemPrompt = `You are an expert study assistant. Generate exactly ${count} flashcard questions and answers based ONLY on the provided study material.

Return a single valid JSON array and nothing else. Do not include markdown formatting, explanations, or trailing text.

Expected format:
[
  { "question": "What is the role of mitochondria?", "expectedAnswer": "Mitochondria generate ATP, the cell's main energy currency.", "difficulty": "easy" }
]`;

  const contextText = contextChunks.map((c, i) => `[Chunk ${i+1}]\n${c.content}`).join("\n\n");
  const userPrompt = `Study Material:\n${contextText}\n\nGenerate ${count} flashcards as a JSON array.`;

  async function attempt(temperature: number): Promise<Flashcard[] | undefined> {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature,
      max_tokens: 4096
    }) as { response: string };

    const raw = response.response;
    const parsed = extractJson<unknown[]>(raw);

    if (!Array.isArray(parsed)) {
      console.error("Flashcard generation did not return a JSON array.", raw);
      return undefined;
    }

    const chunkIds = contextChunks.map(c => c.id);

    return parsed.slice(0, count).map((item: any) => ({
      id: crypto.randomUUID(),
      question: item.question || "Unknown question",
      expectedAnswer: item.expectedAnswer || "Unknown answer",
      difficulty: ["easy", "medium", "hard"].includes(item.difficulty) ? item.difficulty : "medium",
      topic,
      sourceChunkIds: chunkIds,
    }));
  }

  const firstAttempt = await attempt(0.7);
  if (firstAttempt !== undefined) {
    return firstAttempt;
  }

  const retryAttempt = await attempt(0.2);
  if (retryAttempt !== undefined) {
    return retryAttempt;
  }

  throw new Error("Flashcard generation failed after retry.");
}
