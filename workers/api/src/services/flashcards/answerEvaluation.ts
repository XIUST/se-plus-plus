import type { AnswerEvaluationResult } from "@se-plus/shared";

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

Return JSON only, in this format:
{ "verdict": "correct|partial|incorrect", "score": 85, "explanation": "...", "keyMissed": ["..."] }`;

  const contextText = contextChunks.map((c, i) => `[Chunk ${i+1}]\n${c.content}`).join("\n\n");
  
  const userPrompt = `Source Material:
${contextText}

Question: ${question}
Expected Answer: ${expectedAnswer}

Student Answer: ${userAnswer}

Evaluate the student answer and return the JSON.`;

  try {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1, // Low temperature for more deterministic evaluation
      max_tokens: 1024
    }) as { response: string };

    let jsonStr = response.response.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.substring(7);
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.substring(3);
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);

    return {
      verdict: ["correct", "partial", "incorrect"].includes(parsed.verdict) ? parsed.verdict : "incorrect",
      score: typeof parsed.score === "number" ? parsed.score : 0,
      explanation: parsed.explanation || "Evaluation failed to provide an explanation.",
      keyMissed: Array.isArray(parsed.keyMissed) ? parsed.keyMissed : [],
    };

  } catch (error: any) {
    console.error("Answer evaluation failed:", error);
    return {
      verdict: "incorrect",
      score: 0,
      explanation: "An error occurred while evaluating the answer.",
      keyMissed: [],
    };
  }
}
