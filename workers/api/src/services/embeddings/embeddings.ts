import type { EmbeddingResponse } from "../../env";

const embeddingModel = "@cf/baai/bge-m3";

export async function createEmbeddings(ai: Ai, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  // Передаем только текст
  const response = (await ai.run(embeddingModel, {
    text: texts,
  })) as EmbeddingResponse;

  if (!Array.isArray(response.data) || response.data.length !== texts.length) {
    throw new Error("Workers AI returned an unexpected embedding response.");
  }

  return response.data;
}