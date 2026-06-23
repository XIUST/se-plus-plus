import type { ApiResponse, DeleteTopicResult, TopicListResponse } from "@se-plus/shared";
import type { Env } from "../env";
import { deleteContextVectors } from "../services/rag/vectorStore";
import { listTopics, removeTopic } from "../services/topics/topicCatalog";

export async function routeTopicList(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const topics = await listTopics(env.TOPICS_KV);

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

    await removeTopic(env.TOPICS_KV, body.topic);

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
