import type { ApiResponse, ContextIngestionResult } from "@se-plus/shared";
import { validateContextIngestionRequest } from "@se-plus/shared";
import type { Env } from "../env";
import { createEmbeddings } from "../services/embeddings/embeddings";
import { chunkStudySource } from "../services/ingestion/chunkText";
import { insertContextVectors, waitForContextVectorsReady } from "../services/rag/vectorStore";
import { markTopicReady, recordTopicIngestion } from "../services/topics/topicCatalog";

const FOREGROUND_READINESS_TIMEOUT_MS = 20_000;
const BACKGROUND_READINESS_TIMEOUT_MS = 120_000;

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

  validation.value.topic = validation.value.topic.trim().toUpperCase();

  const chunks = chunkStudySource(validation.value);
  const sourceId = chunks[0]?.sourceId ?? crypto.randomUUID();
  const embeddings = await createEmbeddings(env.AI, chunks.map((chunk) => chunk.content));
  const vectorMutation = await insertContextVectors(env.VECTORIZE, chunks, embeddings);

  let indexing = true;

  try {
    await recordTopicIngestion(env.TOPICS_KV, validation.value.topic, sourceId, chunks.length);
  } catch (error) {
    console.error("Failed to update topic catalog", error);
  }

  const readiness = await waitForContextVectorsReady(
    env.VECTORIZE,
    chunks,
    FOREGROUND_READINESS_TIMEOUT_MS,
  );

  if (readiness.ready) {
    indexing = false;
    try {
      await markTopicReady(env.TOPICS_KV, validation.value.topic);
    } catch (error) {
      console.error("Failed to mark topic as ready", error);
    }
  } else {
    ctx.waitUntil(
      waitForContextVectorsReady(env.VECTORIZE, chunks, BACKGROUND_READINESS_TIMEOUT_MS)
        .then(async (backgroundReadiness) => {
          if (backgroundReadiness.ready) {
            await markTopicReady(env.TOPICS_KV, validation.value.topic);
          } else {
            console.error("Vectors never became searchable within background timeout", {
              sourceId,
              topic: validation.value.topic,
              checks: backgroundReadiness.checkedCount,
            });
          }
        })
        .catch((error) => {
          console.error("Background vector readiness check failed", error);
        }),
    );
  }

  const result: ContextIngestionResult = {
    sourceId,
    topic: validation.value.topic,
    title: validation.value.title ?? validation.value.topic,
    chunkCount: chunks.length,
    ...(vectorMutation.mutationId ? { vectorMutationId: vectorMutation.mutationId } : {}),
    ...(indexing ? { indexing: true } : {}),
  };

  return json<ApiResponse<ContextIngestionResult>>(
    { ok: true, data: result },
    indexing ? 202 : 201,
  );
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
