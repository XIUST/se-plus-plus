import type { IngestedChunk } from "@se-plus/shared";

export type VectorMutationResult = {
  mutationId?: string;
};

export async function insertContextVectors(
  vectorize: Vectorize,
  chunks: IngestedChunk[],
  embeddings: number[][],
): Promise<VectorMutationResult> {
  if (chunks.length !== embeddings.length) {
    throw new Error("Chunk and embedding counts must match before inserting vectors.");
  }

  const vectors: VectorizeVector[] = chunks.map((chunk, index) => ({
    id: chunk.id,
    values: embeddings[index]!,
    metadata: {
      sourceId: chunk.sourceId,
      topic: chunk.topic,
      title: chunk.title,
      chunkIndex: chunk.index,
      content: chunk.content,
      tokenEstimate: chunk.tokenEstimate,
      createdAt: chunk.createdAt,
    },
  }));

  const mutation = await vectorize.insert(vectors);

  const mutationId = readMutationId(mutation);
  return mutationId ? { mutationId } : {};
}

function readMutationId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  return typeof record.mutationId === "string" ? record.mutationId : undefined;
}

export async function queryContextVectors(
  vectorize: Vectorize,
  queryEmbedding: number[],
  topic: string,
  topK: number = 5,
): Promise<{ id: string; content: string; score: number }[]> {
  const queryResult = await vectorize.query(queryEmbedding, { topK, filter: { topic }, returnMetadata: 'all' });
  const results: { id: string; content: string; score: number }[] = [];

  for (const match of queryResult.matches) {
    const content = typeof match.metadata?.content === "string" ? match.metadata.content : "";
    if (content) {
      results.push({ id: match.id, content, score: match.score });
    }
  }

  return results;
}

export async function deleteContextVectors(
  vectorize: Vectorize,
  topic: string,
): Promise<{ deletedCount: number }> {
  // Use a unit vector to avoid divide-by-zero in cosine similarity
  const dummyEmbedding = new Array(768).fill(0);
  dummyEmbedding[0] = 1;
  const queryResult = await vectorize.query(dummyEmbedding, { topK: 100, filter: { topic }, returnMetadata: 'none' });

  const idsToDelete = queryResult.matches.map((match) => match.id);

  if (idsToDelete.length === 0) {
    return { deletedCount: 0 };
  }

  await vectorize.deleteByIds(idsToDelete);
  return { deletedCount: idsToDelete.length };
}
