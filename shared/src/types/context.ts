export type StudySourceKind = "topic" | "text" | "markdown";

export type ContextIngestionRequest = {
  topic: string;
  title?: string;
  kind: StudySourceKind;
  content: string;
};

export type IngestedChunk = {
  id: string;
  sourceId: string;
  topic: string;
  title: string;
  index: number;
  content: string;
  tokenEstimate: number;
  createdAt: string;
};

export type ContextIngestionResult = {
  sourceId: string;
  topic: string;
  title: string;
  chunkCount: number;
  vectorMutationId?: string;
};

