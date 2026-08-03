// types/errorTracking.ts
export interface TypingError {
  id: string;
  lessonId: string;
  expectedChar: string;
  typedChar: string;
  position: number;
  timestamp: number;
}

export interface LessonKeystroke {
  key: string;
  position: number;
  correct: boolean;
  expected: string;
}

export interface LessonErrorBatch {
  lessonId: string;
  netWpm: number;
  grossWpm: number;
  accuracy: number;
  timeElapsed: number;
  keystrokes: LessonKeystroke[];
}

export interface ErrorTrackingState {
  buffer: TypingError[];
  lessonId: string | null;
}
