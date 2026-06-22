import type {
  AnswerEvaluationRequest,
  AnswerEvaluationResult,
  ApiErrorResponse,
  ApiResponse,
  ContextIngestionRequest,
  ContextIngestionResult,
  DeleteTopicResult,
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  TopicListResponse,
} from "@se-plus/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:8787" : "");

export async function ingestContext(request: ContextIngestionRequest): Promise<ApiResponse<ContextIngestionResult>> {
  return fetchApi("/api/contexts", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function fetchTopics(): Promise<ApiResponse<TopicListResponse>> {
  return fetchApi("/api/topics", { method: "GET" });
}

export async function deleteTopic(topic: string): Promise<ApiResponse<DeleteTopicResult>> {
  return fetchApi("/api/topics", {
    method: "DELETE",
    body: JSON.stringify({ topic }),
  });
}

export async function generateFlashcards(request: GenerateFlashcardsRequest): Promise<ApiResponse<GenerateFlashcardsResponse>> {
  return fetchApi("/api/flashcards/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function evaluateAnswer(request: AnswerEvaluationRequest): Promise<ApiResponse<AnswerEvaluationResult>> {
  return fetchApi("/api/flashcards/evaluate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

async function fetchApi<T>(path: string, options: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    try {
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch {
      return networkError("Invalid JSON response from server.");
    }
  } catch (error) {
    return networkError(error instanceof Error ? error.message : "Network request failed.");
  }
}

function networkError(message: string): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code: "network_error",
      message,
    },
  };
}
