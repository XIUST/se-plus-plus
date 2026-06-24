import type { AnswerEvaluationRequest, AnswerEvaluationResult, ApiResponse, GenerateFlashcardsRequest, GenerateFlashcardsResponse } from "@se-plus/shared";
import type { Env } from "../env";
import { createEmbeddings } from "../services/embeddings/embeddings";
import { queryContextVectors } from "../services/rag/vectorStore";
import { generateFlashcardsFromContext } from "../services/flashcards/flashcardGeneration";
import { evaluateAnswer } from "../services/flashcards/answerEvaluation";

export async function routeFlashcardGeneration(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body = await readJson<GenerateFlashcardsRequest>(request);
    if (!body || !body.topic || typeof body.topic !== 'string') {
      return json<ApiResponse<never>>({
        ok: false,
        error: { code: "invalid_request", message: "Topic is required" }
      }, 400);
    }

    const count = body.count || 10;
    if (count > 20) {
      return json<ApiResponse<never>>({
        ok: false,
        error: { code: "invalid_request", message: "Max count is 20" }
      }, 400);
    }

    const embeddings = await createEmbeddings(env.AI, [body.topic]);
    if (embeddings.length === 0) {
      throw new Error("Failed to generate embedding for topic");
    }

    const chunks = await queryContextVectors(env.VECTORIZE, embeddings[0]!, body.topic, 10);
    console.log("DEBUG:", chunks);
    if (chunks.length === 0) {
      return json<ApiResponse<never>>({
        ok: false,
        error: { code: "no_content", message: "No study material found for this topic" }
      }, 404);
    }

    const flashcards = await generateFlashcardsFromContext(
      env.AI,
      env.GENERATION_MODEL ?? "@cf/google/gemma-4-26b-a4b-it",
      chunks,
      body.topic,
      count,
    );

    return json<ApiResponse<GenerateFlashcardsResponse>>({ ok: true, data: { cards: flashcards } });

  } catch (error: any) {
    const code = error?.message?.toLowerCase().includes("flashcard generation") ? "generation_failed" : "internal_error";
    return json<ApiResponse<never>>({
      ok: false,
      error: { code, message: "Failed to generate flashcards", details: error.message }
    }, 500);
  }
}

export async function routeFlashcardEvaluation(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body = await readJson<AnswerEvaluationRequest>(request);
    if (!body || !body.question || !body.expectedAnswer || !body.userAnswer || !body.topic) {
      return json<ApiResponse<never>>({
        ok: false,
        error: { code: "invalid_request", message: "Missing required fields for evaluation" }
      }, 400);
    }

    const embeddings = await createEmbeddings(env.AI, [body.question]);
    if (embeddings.length === 0) {
      throw new Error("Failed to generate embedding for question");
    }

    const chunks = await queryContextVectors(env.VECTORIZE, embeddings[0]!, body.topic, 5);

    const evaluation = await evaluateAnswer(
      env.AI,
      env.EVALUATION_MODEL ?? "@cf/google/gemma-4-26b-a4b-it",
      body.question,
      body.expectedAnswer,
      body.userAnswer,
      chunks,
    );

    return json<ApiResponse<AnswerEvaluationResult>>({ ok: true, data: evaluation });

  } catch (error: any) {
    const code = error?.message?.toLowerCase().includes("answer evaluation") ? "evaluation_failed" : "internal_error";
    return json<ApiResponse<never>>({
      ok: false,
      error: { code, message: "Failed to evaluate answer", details: error.message }
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
