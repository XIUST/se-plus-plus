import { routeContextRequest } from "./routes/contextRoutes";
import { routeTopicList, routeTopicDelete } from "./routes/topicRoutes";
import { routeFlashcardGeneration, routeFlashcardEvaluation } from "./routes/flashcardRoutes";
import type { Env } from "./env";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), env);
    }

    if (url.pathname === "/health") {
      return withCors(Response.json({ ok: true, service: "se-plus-api" }), env);
    }

    if (url.pathname === "/api/contexts") {
      return withCors(await routeContextRequest(request, env, ctx), env);
    }

    if (url.pathname === "/api/topics" && request.method === "GET") {
      return withCors(await routeTopicList(request, env), env);
    }

    if (url.pathname === "/api/topics" && request.method === "DELETE") {
      return withCors(await routeTopicDelete(request, env), env);
    }

    if (url.pathname === "/api/flashcards/generate") {
      return withCors(await routeFlashcardGeneration(request, env), env);
    }

    if (url.pathname === "/api/flashcards/evaluate") {
      return withCors(await routeFlashcardEvaluation(request, env), env);
    }

    return withCors(
      Response.json(
        {
          ok: false,
          error: {
            code: "not_found",
            message: "No route matches this request.",
          },
        },
        { status: 404 },
      ),
      env,
    );
  },
} satisfies ExportedHandler<Env>;

function withCors(response: Response, env: Env): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN ?? "*");
  headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

