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
