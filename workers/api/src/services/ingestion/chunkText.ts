import type { ContextIngestionRequest, IngestedChunk } from "@se-plus/shared";

const maxChunkCharacters = 1_800;
const overlapCharacters = 220;

export function chunkStudySource(request: ContextIngestionRequest): IngestedChunk[] {
  const sourceId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const title = request.title?.trim() || request.topic;
  const normalized = normalizeContent(request.content);
  const sections = splitIntoSections(normalized);
  const chunks = createChunkTexts(sections);

  return chunks.map((content, index) => ({
    id: `${sourceId}:${index}`,
    sourceId,
    topic: request.topic,
    title,
    index,
    content,
    tokenEstimate: estimateTokens(content),
    createdAt,
  }));
}

function normalizeContent(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoSections(content: string): string[] {
  return content
    .split(/\n(?=#{1,6}\s)|\n\n+/g)
    .map((section) => section.trim())
    .filter(Boolean);
}

function createChunkTexts(sections: string[]): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const section of sections) {
    if (!current) {
      current = section;
      continue;
    }

    if (current.length + section.length + 2 <= maxChunkCharacters) {
      current = `${current}\n\n${section}`;
      continue;
    }

    chunks.push(...splitOversizedChunk(current));
    current = section;
  }

  if (current) {
    chunks.push(...splitOversizedChunk(current));
  }

  return chunks;
}

function splitOversizedChunk(text: string): string[] {
  if (text.length <= maxChunkCharacters) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChunkCharacters, text.length);
    const slice = text.slice(start, end).trim();

    if (slice) {
      chunks.push(slice);
    }

    if (end === text.length) {
      break;
    }

    start = Math.max(0, end - overlapCharacters);
  }

  return chunks;
}

function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

