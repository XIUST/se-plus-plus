import type { ApiResponse, ContextIngestionRequest, ContextIngestionResult } from "@se-plus/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? localApiBaseUrl();

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
        message: import.meta.env.VITE_API_BASE_URL
          ? "The API could not be reached. Check that the Worker is running."
          : "The API URL is not configured. Set VITE_API_BASE_URL in Cloudflare Pages and redeploy.",
        details: error instanceof Error ? error.message : error,
      },
    };
  }
}

function localApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return "http://localhost:8787";
  }

  return "";
}
