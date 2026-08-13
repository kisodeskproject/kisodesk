// types/todayTraining.ts
export interface WeakPoint {
  type: 'key' | 'bigram';
  value: string;
  accuracy: number;
}

export interface TodayTrainingMetric {
  start: number | null;
  end: number | null;
  delta: number;
}

export interface TodayTrainingSummary {
  minutesTrained: number;
  dailyGoalMinutes: number;
  sessionsToday: number;
  wpm: TodayTrainingMetric;
  accuracy: TodayTrainingMetric;
  weakPoints: WeakPoint[];
}
