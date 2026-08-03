// types/recommendation.ts
export type RecommendationType = 'tip' | 'warning' | 'achievement';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  message: string;
  priority: number;
}
