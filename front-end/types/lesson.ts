// types/lesson.ts
import type { ErrorSummary } from '@/lib/errorSummary';
import type { Locale } from '@/lib/locales';

export interface FingerPositions {
  leftPinky?: string[];
  leftRing?: string[];
  leftMiddle?: string[];
  leftIndex?: string[];
  rightIndex?: string[];
  rightMiddle?: string[];
  rightRing?: string[];
  rightPinky?: string[];
}

export interface Lesson {
  id: string;
  slug: string;
  courseSlug?: string;
  title: string;
  type?: 'practice' | 'explanatory';
  description?: string;
  objective?: string;
  instructions?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  text: string;
  completed?: boolean;
  mastered?: boolean;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'MASTERED' | 'REVIEW_DUE';
  attemptsCount?: number;
  bestScore?: number;
  order?: number;
  moduleSlug?: string;
  moduleTitle?: string;
  moduleDescription?: string;
  moduleOrder?: number;
  required?: boolean;
  isLocked?: boolean;
  bestWpm?: number;
  bestAccuracy?: number;
  timeSpent?: number;
  fingerPositions?: FingerPositions | null;
  mediaUrl?: string | null;
  audioUrl?: string | null;
  targetKeys?: string[] | null;
  focusKeys?: string[];
  reviewKeys?: string[];
  allowedCharacters?: string[];
  minAccuracy?: number;
  maxTargetKeyErrors?: number | null;
  hideLiveWpm?: boolean;
}

export interface LessonResult {
  lessonId: string;
  grossWpm?: number;
  netWpm?: number;
  accuracy?: number;
  timeElapsed?: number;
  completed?: boolean;
  targetKeyErrors?: number;
  usedAssistance?: boolean;
  errorSummary?: ErrorSummary;
  locale?: Locale;
}

export interface LessonProgressResult {
  status: Lesson['status'];
  qualified: boolean;
  mastered: boolean;
  minAccuracy?: number;
  recommendation: 'continue' | 'review';
}
