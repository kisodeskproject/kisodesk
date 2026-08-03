import type { PracticeDay, ProgressData } from '@/types/progress';
import type { WeakKey } from '@/types/weakKeys';

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
    lessons: Object.fromEntries(
      Object.entries(progress.lessons).filter(([, lesson]) => lesson.locale === locale),
    ),
    practice: progress.practice.filter((session) => session.locale === locale),
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
  };
}
