import type { ApiResponse, ContextIngestionResult } from "@se-plus/shared";
import { validateContextIngestionRequest } from "@se-plus/shared";
import type { Env } from "../env";
import { createEmbeddings } from "../services/embeddings/embeddings";
import { chunkStudySource } from "../services/ingestion/chunkText";
import { insertContextVectors } from "../services/rag/vectorStore";
import { recordTopicIngestion } from "../services/topics/topicCatalog";

export async function routeContextRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (request.method !== "POST") {
    return json<ApiResponse<never>>(
      {
        ok: false,
        error: {
          code: "method_not_allowed",
          message: "Use POST to ingest study context.",
        },
      },
      405,
    );
  }

  const body = await readJson(request);
  const validation = validateContextIngestionRequest(body);

  if (!validation.ok) {
    return json<ApiResponse<never>>(
      {
        ok: false,
        error: {
          code: "invalid_context",
          message: "The submitted study context is invalid.",
          details: validation.errors,
        },
      },
      400,
    );
  }

  const chunks = chunkStudySource(validation.value);
  const embeddings = await createEmbeddings(env.AI, chunks.map((chunk) => chunk.content));
  const vectorMutation = await insertContextVectors(env.VECTORIZE, chunks, embeddings);

  const result: ContextIngestionResult = {
    sourceId: chunks[0]?.sourceId ?? crypto.randomUUID(),
    topic: validation.value.topic,
    title: validation.value.title ?? validation.value.topic,
    chunkCount: chunks.length,
    ...(vectorMutation.mutationId ? { vectorMutationId: vectorMutation.mutationId } : {}),
  };

  try {
    await recordTopicIngestion(env.TOPICS_KV, result.topic, result.sourceId, result.chunkCount);
  } catch (error) {
    console.error("Failed to update topic catalog", error);
  }

  return json<ApiResponse<ContextIngestionResult>>({ ok: true, data: result }, 201);
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

function json<T>(payload: T, status = 200): Response {
  return Response.json(payload, { status });
}
