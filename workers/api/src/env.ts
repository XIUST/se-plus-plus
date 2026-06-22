export type EmbeddingResponse = {
  data: number[][];
  shape?: number[];
  pooling?: "mean" | "cls";
};

export interface Env {
  AI: Ai;
  VECTORIZE: Vectorize;
  ALLOWED_ORIGIN?: string;
}

