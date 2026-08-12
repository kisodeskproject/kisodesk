// types/ranking.ts
import type { Locale } from '@/lib/locales';

export type RankingScope = Locale | 'global';

export interface RankUser {
  id: string;
  name: string;
  bestWpmNet: number;
  score: number;
  bestGrossWpm: number;
  bestAccuracy: number;
  bestAchievedAt: string;
  level: 'bronze' | 'silver' | 'gold';
  language: RankingScope;
  isCurrentUser?: boolean;
}

export interface UserStatsResponse {
  bestWpmNet: number;
  score: number;
  bestGrossWpm: number;
  bestAccuracy: number;
  bestAchievedAt: string | null;
  level: 'bronze' | 'silver' | 'gold';
  rank: number;
  topPercent: number;
  insufficientData?: boolean;
  rankingVisible?: boolean;
  recentAverage?: { score: number; wpm: number; grossWpm: number; accuracy: number } | null;
}

export interface RankingResponse {
  ranking: RankUser[];
  distribution: Array<{ wpm: number; accuracy: number }>;
  total?: number;
}
