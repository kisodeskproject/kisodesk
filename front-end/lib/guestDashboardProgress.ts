import type { PracticeDay, ProgressData } from '@/types/progress';
import type { WeakKey, WeakKeysResponse } from '@/types/weakKeys';

import type { GuestProgress } from './guestProgressStore';
import type { Locale } from './locales';

type GuestActivity = {
  completedAt: string;
  netWpm?: number;
  accuracy?: number;
  timeElapsed: number;
};

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function getActivities(progress: GuestProgress): GuestActivity[] {
  return [
    ...Object.values(progress.lessons).map((lesson) => ({
      completedAt: lesson.completedAt,
      netWpm: lesson.bestNetWpm,
      accuracy: lesson.bestAccuracy,
      timeElapsed: lesson.totalTimeElapsed,
    })),
    ...progress.practice,
  ].filter((activity) => !Number.isNaN(new Date(activity.completedAt).getTime()));
}

export function getGuestProgressForLanguage(
  progress: GuestProgress,
  locale: Locale,
): GuestProgress {
  return {
    version: progress.version ?? 2,
    lessons: Object.fromEntries(
      Object.entries(progress.lessons).filter(([, lesson]) => lesson.locale === locale),
    ),
    practice: progress.practice.filter((session) => session.locale === locale),
    lessonAdaptiveAttempts: (progress.lessonAdaptiveAttempts ?? []).filter(
      (attempt) => attempt.locale === locale,
    ),
    adaptiveProfiles: Object.fromEntries(
      Object.entries(progress.adaptiveProfiles ?? {}).filter(
        ([, profile]) => profile.locale === locale,
      ),
    ),
  };
}

export function getGuestRecentAverage(
  progress: GuestProgress,
  limit = 10,
): { score: number; wpm: number; grossWpm: number; accuracy: number } | null {
  const recent = [...progress.practice]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, limit);

  if (recent.length === 0) return null;

  const avgNetWpm = Math.round(recent.reduce((sum, s) => sum + s.netWpm, 0) / recent.length);
  const avgGrossWpm = Math.round(recent.reduce((sum, s) => sum + s.grossWpm, 0) / recent.length);
  const avgAccuracy = Math.round(recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length);

  return {
    score: avgNetWpm * 100,
    wpm: avgNetWpm,
    grossWpm: avgGrossWpm,
    accuracy: avgAccuracy,
  };
}

function getStreak(activities: GuestActivity[], today: Date): number {
  const activeDays = new Set(activities.map((activity) => dateKey(new Date(activity.completedAt))));
  let cursor = startOfDay(today);
  let streak = 0;

  while (activeDays.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getLongestStreak(activities: GuestActivity[]): number {
  const activeDays = [...new Set(activities.map((activity) => dateKey(new Date(activity.completedAt))))].sort();
  if (activeDays.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < activeDays.length; i++) {
    const previous = new Date(activeDays[i - 1]);
    const day = new Date(activeDays[i]);
    const diffDays = Math.round((day.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
    current = diffDays === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }

  return longest;
}

function getAverageWpmByPeriod(activities: GuestActivity[], days: Date[]): number[] {
  return days.map((day) => {
    const values = activities
      .filter((activity) => dateKey(new Date(activity.completedAt)) === dateKey(day))
      .map((activity) => activity.netWpm)
      .filter((value): value is number => typeof value === 'number');

    return values.length
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : 0;
  });
}

function getRecentDays(today: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (count - 1 - index));
    return day;
  });
}

export function getGuestPracticeDays(progress: GuestProgress): PracticeDay[] {
  const totals = new Map<string, number>();

  for (const activity of getActivities(progress)) {
    const key = dateKey(new Date(activity.completedAt));
    totals.set(key, (totals.get(key) ?? 0) + Math.ceil(activity.timeElapsed / 60));
  }

  return [...totals.entries()].map(([date, minutes]) => ({ date, minutes }));
}

export function getGuestWeakKeys(progress: GuestProgress): WeakKey[] {
  const totals = new Map<
    string,
    { key: string; totalAttempts: number; correctAttempts: number; mistakes: Map<string, number> }
  >();

  for (const session of progress.practice) {
    for (const summary of session.errorSummary?.keys ?? []) {
      const normalizedKey = summary.expected.toLocaleLowerCase();
      const current = totals.get(normalizedKey) ?? {
        key: summary.expected,
        totalAttempts: 0,
        correctAttempts: 0,
        mistakes: new Map<string, number>(),
      };

      current.totalAttempts += summary.totalPresses;
      current.correctAttempts += summary.totalPresses - summary.totalErrors;
      for (const mistake of summary.mistakes ?? []) {
        current.mistakes.set(
          mistake.typed,
          (current.mistakes.get(mistake.typed) ?? 0) + mistake.count,
        );
      }
      totals.set(normalizedKey, current);
    }
  }

  return [...totals.values()]
    .filter((item) => item.totalAttempts > 0)
    .map((item) => ({
      key: item.key,
      totalAttempts: item.totalAttempts,
      correctAttempts: item.correctAttempts,
      accuracy: (item.correctAttempts / item.totalAttempts) * 100,
      commonMistakes: [...item.mistakes.entries()]
        .sort(([, left], [, right]) => right - left)
        .map(([typed]) => typed),
    }))
    .sort((left, right) => left.accuracy - right.accuracy);
}

export function getGuestWeakKeysResponse(progress: GuestProgress): WeakKeysResponse {
  const weakKeys = getGuestWeakKeys(progress);

  if (weakKeys.length === 0) {
    return { weakKeys: [], summary: null, insufficientData: true };
  }

  const totalCorrect = weakKeys.reduce((sum, key) => sum + key.correctAttempts, 0);
  const totalAttempts = weakKeys.reduce((sum, key) => sum + key.totalAttempts, 0);
  const weakest = weakKeys[0];

  return {
    weakKeys,
    summary: {
      overallAccuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
      weakestKey: weakest.key,
      weakestAccuracy: weakest.accuracy,
    },
    insufficientData: false,
  };
}

export function getGuestDashboardProgress(progress: GuestProgress, now = new Date()): ProgressData {
  const activities = getActivities(progress);
  const wpmValues = activities
    .map((activity) => activity.netWpm)
    .filter((value): value is number => typeof value === 'number');
  const accuracyValues = activities
    .map((activity) => activity.accuracy)
    .filter((value): value is number => typeof value === 'number');
  const today = startOfDay(now);
  const weekDays = getRecentDays(today, 7);
  const monthDays = getRecentDays(today, 30);
  const totalPracticeTime = activities.reduce((sum, activity) => sum + activity.timeElapsed, 0);

  return {
    completedLessons: Object.keys(progress.lessons).length,
    averageWpm: wpmValues.length
      ? Math.round(wpmValues.reduce((sum, value) => sum + value, 0) / wpmValues.length)
      : 0,
    averageAccuracy: accuracyValues.length
      ? Math.round(accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length)
      : 0,
    streak: getStreak(activities, today),
    totalPracticeTime,
    formattedPracticeTime: formatTime(totalPracticeTime),
    weeklyProgress: {
      labels: weekDays.map((day) => dateKey(day).slice(-2)),
      values: getAverageWpmByPeriod(activities, weekDays),
    },
    monthlyProgress: {
      labels: monthDays.map((day) => dateKey(day).slice(-2)),
      values: getAverageWpmByPeriod(activities, monthDays),
    },
    bestWpm: wpmValues.length ? Math.max(...wpmValues) : 0,
    bestAccuracy: accuracyValues.length ? Math.max(...accuracyValues) : 0,
    longestStreak: getLongestStreak(activities),
  };
}
