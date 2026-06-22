import type { Flashcard } from "@se-plus/shared";

export async function generateFlashcardsFromContext(
  ai: Ai,
  contextChunks: { content: string; id: string }[],
  topic: string,
  count: number,
): Promise<Flashcard[]> {
  const systemPrompt = `You are an expert study assistant. Generate exactly ${count} flashcard questions and answers based ONLY on the provided study material. 
Return valid JSON only, in this format:
[
  { "question": "...", "expectedAnswer": "...", "difficulty": "easy|medium|hard" }
]`;

  const contextText = contextChunks.map((c, i) => `[Chunk ${i+1}]\n${c.content}`).join("\n\n");
  const userPrompt = `Study Material:\n${contextText}\n\nGenerate ${count} flashcards as a JSON array.`;

  try {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4096
    }) as { response: string };

    let jsonStr = response.response.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.substring(7);
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.substring(3);
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      throw new Error("LLM did not return an array");
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

  } catch (error: any) {
    console.error("Flashcard generation failed:", error);
    // Fallback
    return [{
      id: crypto.randomUUID(),
      question: `What are the key concepts of ${topic}?`,
      expectedAnswer: `Explain the main ideas related to ${topic} based on your study material.`,
      difficulty: "medium",
      topic,
      sourceChunkIds: [],
    }];
  }
}
