// components/dashboard/StatsGrid.tsx

'use client';

import { Clock, Flame, Target, Zap } from 'lucide-react';

import type { ProgressData } from '@/types/progress';

type GridStatus = 'guest' | 'error' | 'empty' | 'data';

interface StatsGridProps {
  status: GridStatus;
  data?: ProgressData;
  translations: {
    completedLessons: string;
    completedCourses: string;
    averageWpm: string;
    averageAccuracy: string;
    streak: string;
    totalPracticeTime: string;
    days: string;
    wordsPerMinute: string;
    accuracy: string;
    consecutivePractice: string;
    thisWeek: string;
    signIn: string;
  };
}

export default function StatsGrid({ status, data, translations }: StatsGridProps) {
  const t = translations;

  const wpmValue = status === 'data' ? (data?.averageWpm ?? '—') : '—';

  const accuracyValue = status === 'data' ? `${data?.averageAccuracy ?? '—'}%` : '—';

  const streakValue = status === 'data' ? `${data?.streak ?? '—'} ${t.days}` : '—';

  const timeValue = status === 'data' ? (data?.formattedPracticeTime ?? '—') : '—';

  const wpmDescription = status === 'data' ? t.wordsPerMinute : undefined;

  const accuracyDescription = status === 'data' ? t.accuracy : undefined;

  const streakDescription = status === 'data' ? t.consecutivePractice : undefined;

  return (
    <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5 backdrop-blur-sm light:backdrop-blur-none">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:flex lg:gap-0">
        <div className="flex flex-1 items-center justify-start border-b border-(--border-card) px-3 pb-4 lg:border-r lg:border-b-0 lg:pb-0">
          <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-(--dashboard-stat-wpm-border) bg-(--dashboard-stat-wpm-background)">
            <Zap className="h-5 w-5 text-(--dashboard-stat-wpm-icon)" />
          </div>

          <div>
            <p className="text-2xl font-bold text-(--text-primary)">{wpmValue}</p>

            <p className="text-sm text-(--text-secondary)">{t.averageWpm}</p>

            {wpmDescription && <p className="text-xs text-(--text-tertiary)">{wpmDescription}</p>}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-start border-b border-(--border-card) px-3 pb-4 lg:border-r lg:border-b-0 lg:pb-0">
          <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-(--dashboard-stat-accuracy-border) bg-(--dashboard-stat-accuracy-background)">
            <Target className="h-5 w-5 text-(--dashboard-stat-accuracy-icon)" />
          </div>

          <div>
            <p className="text-2xl font-bold text-(--text-primary)">{accuracyValue}</p>

            <p className="text-sm text-(--text-secondary)">{t.averageAccuracy}</p>

            {accuracyDescription && (
              <p className="text-xs text-(--text-tertiary)">{accuracyDescription}</p>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-start border-b border-(--border-card) px-3 pb-4 lg:border-r lg:border-b-0 lg:pb-0">
          <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-(--dashboard-stat-streak-border) bg-(--dashboard-stat-streak-background)">
            <Flame className="h-5 w-5 text-(--dashboard-stat-streak-icon)" />
          </div>

          <div>
            <p className="text-2xl font-bold text-(--text-primary)">{streakValue}</p>

            <p className="text-sm text-(--text-secondary)">{t.streak}</p>

            {streakDescription && (
              <p className="text-xs text-(--text-tertiary)">{streakDescription}</p>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-start px-3">
          <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-(--dashboard-stat-time-border) bg-(--dashboard-stat-time-background)">
            <Clock className="h-5 w-5 text-(--dashboard-stat-time-icon)" />
          </div>

          <div>
            <p className="text-2xl font-bold text-(--text-primary)">{timeValue}</p>

            <p className="text-sm text-(--text-secondary)">{t.totalPracticeTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
