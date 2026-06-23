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
}

