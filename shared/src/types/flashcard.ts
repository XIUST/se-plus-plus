/** Difficulty tier assigned during flashcard generation. */
export type FlashcardDifficulty = "easy" | "medium" | "hard";

/** A single generated flashcard. */
export type Flashcard = {
  id: string;
  question: string;
  expectedAnswer: string;
  topic: string;
  difficulty: FlashcardDifficulty;
  /** IDs of the source chunks used to generate this card. */
  sourceChunkIds: string[];
};

/** Request body for `POST /api/flashcards/generate`. */
export type GenerateFlashcardsRequest = {
  topic: string;
  /** Number of cards to generate (default: 10). */
  count?: number;
  /** Card IDs to exclude (e.g. already answered this session). */
  excludeIds?: string[];
};

/** Response from `POST /api/flashcards/generate`. */
export type GenerateFlashcardsResponse = {
  cards: Flashcard[];
};

/** Request body for `POST /api/flashcards/evaluate`. */
export type AnswerEvaluationRequest = {
  flashcardId: string;
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  topic: string;
};

/** Evaluation verdict. */
export type EvaluationVerdict = "correct" | "partial" | "incorrect";

/** Response from `POST /api/flashcards/evaluate`. */
export type AnswerEvaluationResult = {
  verdict: EvaluationVerdict;
  /** Numeric score 0–100. */
  score: number;
  /** AI-generated explanation of the evaluation. */
  explanation: string;
  /** Key points the user missed (empty if fully correct). */
  keyMissed: string[];
};

/** End-of-session summary, assembled client-side. */
export type SessionResult = {
  topic: string;
  totalCards: number;
  correct: number;
  partial: number;
  incorrect: number;
  /** Average score 0–100 across all cards. */
  averageScore: number;
  /** Topics/concepts the user struggled with. */
  weakSpots: string[];
  /** Session duration in seconds. */
  durationSeconds: number;
};
