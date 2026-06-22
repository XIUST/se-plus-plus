import type { ApiResponse, DeleteTopicResult, TopicListResponse, TopicSummary } from "@se-plus/shared";
import type { Env } from "../env";
import { deleteContextVectors } from "../services/rag/vectorStore";

export async function routeTopicList(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    // Use a unit vector (length 1) to avoid divide-by-zero errors in cosine similarity
    const dummyEmbedding = new Array(768).fill(0);
    dummyEmbedding[0] = 1;
    // Vectorize limits topK to 50 when returnMetadata is "all".
    const queryResult = await env.VECTORIZE.query(dummyEmbedding, { topK: 50, returnMetadata: 'all' });

    const topicMap = new Map<string, { sourceIds: Set<string>, chunkCount: number, latestDate: string }>();

    for (const match of queryResult.matches) {
      const metadata = match.metadata;
      if (!metadata || typeof metadata.topic !== 'string') continue;

      const topic = metadata.topic;
      const sourceId = typeof metadata.sourceId === 'string' ? metadata.sourceId : 'unknown';
      const createdAt = typeof metadata.createdAt === 'string' ? metadata.createdAt : new Date(0).toISOString();

      if (!topicMap.has(topic)) {
        topicMap.set(topic, { sourceIds: new Set([sourceId]), chunkCount: 1, latestDate: createdAt });
      } else {
        const stats = topicMap.get(topic)!;
        stats.sourceIds.add(sourceId);
        stats.chunkCount++;
        if (createdAt > stats.latestDate) {
          stats.latestDate = createdAt;
        }
      }
    }

    const topics: TopicSummary[] = Array.from(topicMap.entries()).map(([topic, stats]) => ({
      topic,
      sourceCount: stats.sourceIds.size,
      chunkCount: stats.chunkCount,
      lastIngestedAt: stats.latestDate,
    }));

    return json<ApiResponse<TopicListResponse>>({ ok: true, data: { topics } });
  } catch (error: any) {
    return json<ApiResponse<never>>({
      ok: false,
      error: {
        code: "internal_error",
        message: "Failed to list topics",
        details: error.message
      }
    }, 500);
  }
}

export async function routeTopicDelete(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body = await readJson<{ topic: string }>(request);
    if (!body || !body.topic || typeof body.topic !== 'string') {
      return json<ApiResponse<never>>({
        ok: false,
        error: { code: "invalid_request", message: "Topic is required" }
      }, 400);
    }

    const result = await deleteContextVectors(env.VECTORIZE, body.topic);
    return json<ApiResponse<DeleteTopicResult>>({ ok: true, data: { topic: body.topic, deletedChunks: result.deletedCount } });
  } catch (error: any) {
    return json<ApiResponse<never>>({
      ok: false,
      error: { code: "internal_error", message: "Failed to delete topic", details: error.message }
    }, 500);
  }
}

async function readJson<T>(request: Request): Promise<T | undefined> {
  try {
    return (await request.json()) as T;
  } catch {
    return undefined;
  }
}

function json<T>(payload: T, status = 200): Response {
  return Response.json(payload, { status });
}
