export type EmbeddingResponse = {
  data: number[][];
  shape?: number[];
  pooling?: "mean" | "cls";
};

export interface Env {
  AI: Ai;
  VECTORIZE: Vectorize;
  TOPICS_KV: KVNamespace;
  ALLOWED_ORIGIN?: string;
  /** Workers AI text generation model used for flashcard generation. */
  GENERATION_MODEL?: string;
  /** Workers AI text generation model used for answer evaluation. */
  EVALUATION_MODEL?: string;
}

