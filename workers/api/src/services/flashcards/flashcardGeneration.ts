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
  const jsonFormatExample = `{ "cards": [ { "question": "What is the role of mitochondria?", "expectedAnswer": "Mitochondria generate ATP, the cell's main energy currency.", "difficulty": "easy" } ] }`;

  const systemPrompt = `You are an expert study assistant. Generate exactly ${count} flashcard questions and answers based ONLY on the provided study material.

You must return a single valid JSON object and nothing else. Do not include markdown code fences, explanations, or any other text. Begin the response with '{' and end with '}'.

Expected format:
${jsonFormatExample}`;

  const contextText = contextChunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join("\n\n");
  const userPrompt = `Study Material:\n${contextText}\n\nGenerate ${count} flashcards inside a "cards" JSON array.`;

  async function attempt(temperature: number, useJsonSchema: boolean): Promise<Flashcard[] | undefined> {
    const options: Record<string, unknown> = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: 4096,
    };

    if (useJsonSchema) {
      options.response_format = {
        type: "json_schema",
        json_schema: FLASHCARDS_JSON_SCHEMA,
      };
    }

    let output: unknown;
    try {
      const response = (await ai.run(modelName, options)) as { response: unknown };
      output = response.response;
    } catch (error: any) {
      console.error(`Flashcard generation failed with ${useJsonSchema ? "JSON schema" : "plain prompt"}.`, error?.message ?? error);
      return undefined;
    }

    let parsedCards: unknown[] | undefined;
    if (isObject(output) && Array.isArray(output.cards)) {
      parsedCards = output.cards;
    } else {
      const raw = typeof output === "string" ? output : JSON.stringify(output);
      const extracted = extractJson<unknown[]>(raw);
      if (isObject(extracted) && Array.isArray(extracted.cards)) {
        parsedCards = extracted.cards;
      } else if (Array.isArray(extracted)) {
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

  const firstAttempt = await attempt(0.7, true);
  if (firstAttempt !== undefined) {
    return firstAttempt;
  }

  const retryAttempt = await attempt(0.2, false);
  if (retryAttempt !== undefined) {
    return retryAttempt;
  }

  throw new Error("Flashcard generation failed after retry.");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
