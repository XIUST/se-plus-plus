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

export type VectorReadinessResult = {
  ready: boolean;
  checkedCount: number;
};

/**
 * Poll Vectorize until all chunks for a source are queryable.
 *
 * Vectorize inserts are accepted synchronously but applied asynchronously.
 * This helper uses a dummy embedding with a metadata filter on `sourceId` so
 * it does not need a semantic query embedding.
 */
export async function waitForContextVectorsReady(
  vectorize: Vectorize,
  chunks: IngestedChunk[],
  maxWaitMs: number,
  pollIntervalMs: number = 1_000,
): Promise<VectorReadinessResult> {
  if (chunks.length === 0) {
    return { ready: true, checkedCount: 0 };
  }

  const sourceId = chunks[0]?.sourceId;
  if (!sourceId) {
    return { ready: true, checkedCount: 0 };
  }

  const pending = new Set(chunks.map((chunk) => chunk.id));
  // Use a unit vector to avoid divide-by-zero in cosine similarity.
  const dummyEmbedding = new Array(768).fill(0);
  dummyEmbedding[0] = 1;

  const startTime = Date.now();
  let checkedCount = 0;

  while (pending.size > 0) {
    const elapsed = Date.now() - startTime;
    if (elapsed >= maxWaitMs) {
      break;
    }

    const result = await vectorize.query(dummyEmbedding, {
      topK: chunks.length,
      filter: { sourceId },
      returnMetadata: "none",
    });
    checkedCount++;

    for (const match of result.matches) {
      pending.delete(match.id);
    }

    if (pending.size === 0) {
      break;
    }

    const remainingMs = maxWaitMs - (Date.now() - startTime);
    const waitMs = Math.min(pollIntervalMs, remainingMs);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
  }

  return { ready: pending.size === 0, checkedCount };
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
  
  const safeTopic = topic.trim().toLowerCase();
  
  const queryResult = await vectorize.query(queryEmbedding, { topK, filter: { topic: safeTopic }, returnMetadata: 'all' });
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
): Promise<{ deletedCount: number; mutationId?: string }> {
  // Use a unit vector to avoid divide-by-zero in cosine similarity
  const dummyEmbedding = new Array(768).fill(0);
  dummyEmbedding[0] = 1;

  let deletedCount = 0;
  let mutationId: string | undefined;
  const seen = new Set<string>();
  const MAX_PAGES = 200;

  for (let page = 0; page < MAX_PAGES; page++) {
    const queryResult = await vectorize.query(dummyEmbedding, {
      topK: 100,
      filter: { topic },
      returnMetadata: 'none',
    });

    const idsToDelete = queryResult.matches
      .map((match) => match.id)
      .filter((id) => !seen.has(id));

    if (idsToDelete.length === 0) {
      break;
    }

    for (const id of idsToDelete) {
      seen.add(id);
    }

    const deletion = await vectorize.deleteByIds(idsToDelete);
    mutationId = readMutationId(deletion) ?? mutationId;
    deletedCount += idsToDelete.length;
  }

  return {
    deletedCount,
    ...(mutationId ? { mutationId } : {}),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
