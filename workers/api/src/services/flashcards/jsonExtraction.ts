/**
 * Extract a parseable JSON object or array from a string that may contain
 * markdown fences, explanatory text, trailing characters, or other noise.
 */
export function extractJson<T>(text: string): T | undefined {
  const cleaned = stripMarkdownFences(text).trim();

  const firstObject = cleaned.indexOf("{");
  const firstArray = cleaned.indexOf("[");

  let start = -1;
  if (firstObject === -1) {
    start = firstArray;
  } else if (firstArray === -1) {
    start = firstObject;
  } else {
    start = Math.min(firstObject, firstArray);
  }

  if (start === -1) {
    return undefined;
  }

  const candidate = cleaned.slice(start);

  // Try parsing the full remaining string first.
  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Find the last } or ] and try progressively shorter slices.
    const endObject = candidate.lastIndexOf("}");
    const endArray = candidate.lastIndexOf("]");
    const end = Math.max(endObject, endArray);

    if (end === -1) {
      return undefined;
    }

    let slice = candidate.slice(0, end + 1);
    while (slice.length > 0) {
      try {
        return JSON.parse(slice) as T;
      } catch {
        const nextEndObject = slice.slice(0, -1).lastIndexOf("}");
        const nextEndArray = slice.slice(0, -1).lastIndexOf("]");
        const nextEnd = Math.max(nextEndObject, nextEndArray);
        if (nextEnd === -1 || nextEnd === end) {
          return undefined;
        }
        slice = slice.slice(0, nextEnd + 1);
      }
    }
  }

  return undefined;
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("```json")) {
    return trimmed
      .slice(7)
      .replace(/\n?```\s*$/i, "")
      .trim();
  }

  if (trimmed.startsWith("```")) {
    return trimmed
      .slice(3)
      .replace(/\n?```\s*$/i, "")
      .trim();
  }

  return trimmed;
}
