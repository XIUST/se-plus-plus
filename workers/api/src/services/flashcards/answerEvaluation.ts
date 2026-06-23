import type { AnswerEvaluationResult } from "@se-plus/shared";
import { extractJson } from "./jsonExtraction";

const EVALUATION_JSON_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["correct", "partial", "incorrect"] },
    score: { type: "number" },
    explanation: { type: "string" },
    keyMissed: { type: "array", items: { type: "string" } },
  },
  required: ["verdict", "score", "explanation", "keyMissed"],
};

export async function evaluateAnswer(
  ai: Ai,
  question: string,
  expectedAnswer: string,
  userAnswer: string,
  contextChunks: { content: string }[],
): Promise<AnswerEvaluationResult> {
  const systemPrompt = `You are a strict but fair exam evaluator. Compare the student's answer against the expected answer and the source material.
Score the answer from 0 to 100.
Rubric:
- 80-100: correct
- 40-79: partial
- 0-39: incorrect

Return a single valid JSON object and nothing else. Do not include markdown formatting, explanations, or trailing text.

Expected format:
{ "verdict": "correct", "score": 85, "explanation": "The answer covers the key points accurately.", "keyMissed": [] }`;

  const contextText = contextChunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join("\n\n");

  const userPrompt = `Source Material:\n${contextText}\n\nQuestion: ${question}\nExpected Answer: ${expectedAnswer}\n\nStudent Answer: ${userAnswer}\n\nEvaluate the student answer and return JSON only.`;

  async function attempt(temperature: number): Promise<AnswerEvaluationResult | undefined> {
    const response = (await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: 1024,
      response_format: {
        type: "json_schema",
        json_schema: EVALUATION_JSON_SCHEMA,
      },
    })) as { response: unknown };

    const output = response.response;

    let parsed: Record<string, unknown> | undefined;
    if (isObject(output)) {
      parsed = output;
    } else {
      const raw = typeof output === "string" ? output : JSON.stringify(output);
      const extracted = extractJson<Record<string, unknown>>(raw);
      if (extracted && typeof extracted === "object") {
        parsed = extracted;
      }
    }

    if (!parsed || typeof parsed !== "object") {
      console.error("Answer evaluation did not return a JSON object.", output);
      return undefined;
    }

    return {
      verdict: ["correct", "partial", "incorrect"].includes(String(parsed.verdict))
        ? (String(parsed.verdict) as AnswerEvaluationResult["verdict"])
        : "incorrect",
      score: typeof parsed.score === "number" ? Math.round(parsed.score) : 0,
      explanation:
        typeof parsed.explanation === "string"
          ? parsed.explanation
          : "Evaluation did not provide an explanation.",
      keyMissed: Array.isArray(parsed.keyMissed)
        ? parsed.keyMissed.filter((m): m is string => typeof m === "string")
        : [],
    };
  }

  const firstAttempt = await attempt(0.1);
  if (firstAttempt !== undefined) {
    return firstAttempt;
  }

  const retryAttempt = await attempt(0.1);
  if (retryAttempt !== undefined) {
    return retryAttempt;
  }

  throw new Error("Answer evaluation failed after retry.");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
