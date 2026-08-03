export const LOW_TYPING_RESULT_LIMITS = {
  grossWpm: 15,
  accuracy: 80,
  score: 1600,
} as const;

export type TypingResultMetrics = {
  grossWpm: number;
  accuracy: number;
  score: number;
};

export function isLowTypingResult({ grossWpm, accuracy, score }: TypingResultMetrics) {
  return (
    grossWpm < LOW_TYPING_RESULT_LIMITS.grossWpm ||
    accuracy < LOW_TYPING_RESULT_LIMITS.accuracy ||
    score < LOW_TYPING_RESULT_LIMITS.score
  );
}
