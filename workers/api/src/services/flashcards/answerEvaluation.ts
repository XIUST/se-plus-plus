import type { AnswerEvaluationResult } from "@se-plus/shared";
import { extractJson } from "./jsonExtraction";

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

  const contextText = contextChunks.map((c, i) => `[Chunk ${i+1}]\n${c.content}`).join("\n\n");

  const userPrompt = `Source Material:\n${contextText}\n\nQuestion: ${question}\nExpected Answer: ${expectedAnswer}\n\nStudent Answer: ${userAnswer}\n\nEvaluate the student answer and return JSON only.`;

  async function attempt(temperature: number): Promise<AnswerEvaluationResult | undefined> {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature,
      max_tokens: 1024
    }) as { response: string };

    const raw = response.response;
    const parsed = extractJson<Record<string, unknown>>(raw);

    if (!parsed || typeof parsed !== "object") {
      console.error("Answer evaluation did not return a JSON object.", raw);
      return undefined;
    }

    return {
      verdict: ["correct", "partial", "incorrect"].includes(String(parsed.verdict)) ? String(parsed.verdict) as AnswerEvaluationResult["verdict"] : "incorrect",
      score: typeof parsed.score === "number" ? Math.round(parsed.score) : 0,
      explanation: typeof parsed.explanation === "string" ? parsed.explanation : "Evaluation did not provide an explanation.",
      keyMissed: Array.isArray(parsed.keyMissed) ? parsed.keyMissed.filter((m): m is string => typeof m === "string") : [],
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
