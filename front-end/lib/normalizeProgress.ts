// lib/normalizeProgress.ts
import { ProgressStats, UserStats } from '@/types/progress';
import { ProgressData, ProgressTrend } from '@/types/progress';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function calculateTrend(values: number[]): ProgressTrend | undefined {
  if (values.length < 2) return undefined;
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  if (prev === 0) return { value: 0, isPositive: true };
  const change = Math.round(((last - prev) / prev) * 100);
  return {
    value: Math.abs(change),
    isPositive: change >= 0,
  };
}

export function normalizeProgress(stats: ProgressStats, userStats: UserStats): ProgressData {
  const wpmTrend = calculateTrend(stats.weeklyProgress.values);
  const accuracyTrend = stats.weeklyAccuracy
    ? calculateTrend(stats.weeklyAccuracy.values)
    : undefined;

  return {
    completedLessons: stats.completedLessons,
    completedCourses: stats.completedCourses,
    averageWpm: stats.averageWpm,
    averageAccuracy: stats.averageAccuracy,
    streak: userStats.streak,
    totalPracticeTime: stats.totalPracticeTime,
    formattedPracticeTime: formatTime(stats.totalPracticeTime),
    weeklyProgress: stats.weeklyProgress,
    monthlyProgress: stats.monthlyProgress,
    wpmTrend,
    accuracyTrend,
  };
}
