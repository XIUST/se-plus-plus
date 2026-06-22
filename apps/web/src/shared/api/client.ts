import type { ApiResponse, ContextIngestionRequest, ContextIngestionResult } from "@se-plus/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export async function ingestContext(
  request: ContextIngestionRequest,
): Promise<ApiResponse<ContextIngestionResult>> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/contexts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    return (await response.json()) as ApiResponse<ContextIngestionResult>;
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "network_error",
        message: "The API could not be reached. Check that the Worker is running.",
        details: error instanceof Error ? error.message : error,
      },
    };
  }
}

