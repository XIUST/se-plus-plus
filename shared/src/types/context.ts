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
  /**
   * True when the vectors were accepted by the index but are not yet
   * queryable. The route will finish preparing them in the background.
   */
  indexing?: boolean;
};

/** Summary of a single ingested topic for the dashboard. */
export type TopicSummary = {
  topic: string;
  sourceCount: number;
  chunkCount: number;
  /** ISO date string of the most recent ingestion. */
  lastIngestedAt: string;
};

/** Response from `GET /api/topics`. */
export type TopicListResponse = {
  topics: TopicSummary[];
};

/** Request body for `DELETE /api/topics`. */
export type DeleteTopicRequest = {
  topic: string;
};

/** Response from `DELETE /api/topics`. */
export type DeleteTopicResult = {
  topic: string;
  deletedChunks: number;
};

