import type { Flashcard } from "@se-plus/shared";
import { extractJson } from "./jsonExtraction";

const FLASHCARDS_JSON_SCHEMA = {
  type: "object",
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          expectedAnswer: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        },
        required: ["question", "expectedAnswer", "difficulty"],
      },
    },
  },
  required: ["cards"],
};

export async function generateFlashcardsFromContext(
  ai: Ai,
  modelName: string,
  contextChunks: { content: string; id: string }[],
  topic: string,
  count: number,
): Promise<Flashcard[]> {
  const systemPrompt = `You are an expert study assistant. Generate exactly ${count} flashcard questions and answers based ONLY on the provided study material.

Return a single valid JSON object and nothing else. Do not include markdown formatting, explanations, or trailing text.

Expected format:
{
  "cards": [
    { "question": "What is the role of mitochondria?", "expectedAnswer": "Mitochondria generate ATP, the cell's main energy currency.", "difficulty": "easy" }
  ]
}`;

  const contextText = contextChunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join("\n\n");
  const userPrompt = `Study Material:\n${contextText}\n\nGenerate ${count} flashcards inside a "cards" JSON array.`;

  async function attempt(temperature: number): Promise<Flashcard[] | undefined> {
    const response = (await ai.run(modelName, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: 4096,
      response_format: {
        type: "json_schema",
        json_schema: FLASHCARDS_JSON_SCHEMA,
      },
    })) as { response: unknown };

    const output = response.response;

    let parsedCards: unknown[] | undefined;
    if (isObject(output) && Array.isArray(output.cards)) {
      parsedCards = output.cards;
    } else {
      const raw = typeof output === "string" ? output : JSON.stringify(output);
      const extracted = extractJson<unknown[]>(raw);
      if (Array.isArray(extracted)) {
        parsedCards = extracted;
      }
    }

    if (!Array.isArray(parsedCards)) {
      console.error("Flashcard generation did not return a JSON array.", output);
      return undefined;
    }

    const chunkIds = contextChunks.map((c) => c.id);

    return parsedCards.slice(0, count).map((item: any) => ({
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
