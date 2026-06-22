import type { ContextIngestionRequest, StudySourceKind } from "../types/context";

const studySourceKinds = new Set<StudySourceKind>(["topic", "text", "markdown"]);

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

export function validateContextIngestionRequest(value: unknown): ValidationResult<ContextIngestionRequest> {
  if (!isRecord(value)) {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }

  const errors: string[] = [];
  const topic = readString(value.topic);
  const title = readOptionalString(value.title);
  const kind = readString(value.kind);
  const content = readString(value.content);

  if (!topic || topic.length > 120) {
    errors.push("Topic is required and must be 120 characters or fewer.");
  }

  if (title !== undefined && title.length > 160) {
    errors.push("Title must be 160 characters or fewer.");
  }

  if (!kind || !studySourceKinds.has(kind as StudySourceKind)) {
    errors.push("Kind must be one of: topic, text, markdown.");
  }

  if (!content || content.length < 20) {
    errors.push("Content must be at least 20 characters.");
  }

  if (content && content.length > 120_000) {
    errors.push("Content must be 120,000 characters or fewer.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      topic: topic!,
      ...(title ? { title } : {}),
      kind: kind as StudySourceKind,
      content: content!,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function readOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return readString(value);
}
