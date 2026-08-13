// components/dashboard/TodayTrainingCard.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useTodayTraining } from '@/hooks/useTodayTraining';
import { updateMyPreferences } from '@/lib/authClient';
import { writeGuestDailyGoalMinutes } from '@/lib/guestProgressStore';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
import type { TodayTrainingSummary } from '@/types/todayTraining';

const GOAL_OPTIONS_MINUTES = [5, 10, 15, 20, 30, 45, 60];

interface TodayTrainingCardProps {
  guestSummary?: TodayTrainingSummary | null;
  locale?: Locale;
}

export default function TodayTrainingCard({ guestSummary, locale }: TodayTrainingCardProps) {
  const { lang } = useParams<{ lang: string }>();
  const resolvedLocale = locale ?? toSupportedLocale(lang);
  const t = useTranslations(toSupportedLocale(lang));
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { summary, loading, fetchTodaySummary } = useTodayTraining(resolvedLocale);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchTodaySummary();
  }, [isAuthenticated, fetchTodaySummary]);

  const data = isAuthenticated ? summary : (guestSummary ?? null);

  useEffect(() => {
    if (data) setDailyGoal(data.dailyGoalMinutes);
  }, [data]);

  if (authLoading || (isAuthenticated && loading && !summary)) {
    return (
      <div className="animate-pulse rounded-lg border border-(--border-card) bg-(--bg-card) p-6">
        <div className="mb-4 h-5 w-48 rounded bg-(--bg-secondary)" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-6 rounded bg-(--bg-secondary)" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const goal = dailyGoal ?? data.dailyGoalMinutes;
  const progressPercent =
    goal > 0 ? Math.min(100, Math.round((data.minutesTrained / goal) * 100)) : 0;
  const remainingMinutes = Math.max(0, goal - data.minutesTrained);

  async function handleGoalChange(value: number) {
    setDailyGoal(value);
    setSavingGoal(true);
    try {
      if (isAuthenticated) {
        await updateMyPreferences({ dailyGoalMinutes: value });
        await fetchTodaySummary();
      } else {
        writeGuestDailyGoalMinutes(value);
      }
    } finally {
      setSavingGoal(false);
    }
  }

  return (
    <div className="rounded-lg border border-(--border-card) bg-(--bg-card) p-6">
      <h2 className="text-lg font-semibold text-(--text-primary)">
        {t('components.dashboard.todayTrainingCard.general.title')}
      </h2>

      <p className="mt-1 text-sm text-(--text-secondary)">
        {t('components.dashboard.todayTrainingCard.general.minutesTrained', {
          minutes: String(data.minutesTrained),
        })}
      </p>

      {data.sessionsToday > 0 ? (
        <div className="mt-4 space-y-2">
          <MetricRow
            label={t('components.dashboard.todayTrainingCard.general.wpmLabel')}
            start={data.wpm.start}
            end={data.wpm.end}
            delta={data.wpm.delta}
            suffix=""
          />
          <MetricRow
            label={t('components.dashboard.todayTrainingCard.general.accuracyLabel')}
            start={data.accuracy.start}
            end={data.accuracy.end}
            delta={data.accuracy.delta}
            suffix="%"
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-(--text-tertiary)">
          {t('components.dashboard.todayTrainingCard.general.noSessionsToday')}
        </p>
      )}

      {data.weakPoints.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-(--text-primary)">
            {t('components.dashboard.todayTrainingCard.general.weakPointsTitle')}
          </h3>
          <ol className="mt-2 space-y-1">
            {data.weakPoints.map((point, index) => (
              <li
                key={`${point.type}-${point.value}`}
                className="flex items-center justify-between text-sm text-(--text-secondary)"
              >
                <span>
                  {index + 1}.{' '}
                  {point.type === 'bigram'
                    ? `"${point.value}"`
                    : t('components.dashboard.todayTrainingCard.general.keyLabel', { key: point.value })}
                </span>
                <span className="font-medium text-(--text-primary)">{point.accuracy}%</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-(--text-primary)">
            {t('components.dashboard.todayTrainingCard.general.recommendedTitle')}
          </h3>
          <label className="flex items-center gap-2 text-xs text-(--text-tertiary)">
            {t('components.dashboard.todayTrainingCard.general.dailyGoalLabel')}
            <select
              value={goal}
              disabled={savingGoal}
              onChange={(event) => handleGoalChange(Number(event.target.value))}
              className="rounded border border-(--border-card) bg-(--bg-secondary) px-2 py-1 text-xs text-(--text-primary)"
            >
              {GOAL_OPTIONS_MINUTES.map((option) => (
                <option key={option} value={option}>
                  {t('components.dashboard.todayTrainingCard.general.goalOption', { minutes: String(option) })}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-(--bg-secondary)">
          <div
            className="h-full rounded-full bg-(--accent-blue) transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="mt-1 text-xs text-(--text-tertiary)">
          {remainingMinutes > 0
            ? t('components.dashboard.todayTrainingCard.general.minutesRemaining', {
                completed: String(data.minutesTrained),
                goal: String(goal),
              })
            : t('components.dashboard.todayTrainingCard.general.goalCompleted')}
        </p>
      </div>

      <a
        href={`/${resolvedLocale}/dashboard/practice?mode=adaptive`}
        className="mt-6 inline-flex rounded-lg bg-(--accent-blue) px-4 py-2 text-sm font-semibold text-(--text-inverse) transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-blue)"
      >
        {t('components.dashboard.todayTrainingCard.general.startTrainingCta')}
      </a>
    </div>
  );
}

function MetricRow({
  label,
  start,
  end,
  delta,
  suffix,
}: {
  label: string;
  start: number | null;
  end: number | null;
  delta: number;
  suffix: string;
}) {
  if (start === null || end === null) return null;

  const sign = delta > 0 ? '+' : '';
  const deltaColor =
    delta > 0
      ? 'text-(--accent-green)'
      : delta < 0
        ? 'text-(--accent-red)'
        : 'text-(--text-tertiary)';

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-(--text-secondary)">{label}</span>
      <span className="text-(--text-primary)">
        {start}
        {suffix} → {end}
        {suffix} <span className={deltaColor}>({sign}{delta}{suffix})</span>
      </span>
    </div>
  );
}
