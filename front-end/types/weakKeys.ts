import type { ContentLanguage } from '@/lib/locales';
import type { Locale } from '@/lib/locales';

// types/weakKeys.ts
export interface WeakKey {
  key: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  commonMistakes: string[];
}

export interface WeakKeysSummary {
  overallAccuracy: number;
  weakestKey: string;
  weakestAccuracy: number;
}

export interface WeakKeysResponse {
  weakKeys: WeakKey[];
  summary: WeakKeysSummary | null;
  insufficientData: boolean;
}

export interface WeakKeysParams {
  language?: ContentLanguage;
  locale?: Locale;
  limit?: number; // 1-20, default 5
  days?: number; // días hacia atrás, ejemplo 30
}
