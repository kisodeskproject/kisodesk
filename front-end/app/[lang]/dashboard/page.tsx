// app/[lang]/dashboard/page.tsx
'use client';

import { useEffect, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { useNormalizedProgress, usePracticeCalendar } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import StatsGrid from '@/components/dashboard/StatsGrid';
import DashboardTitle from '@/components/dashboard/DashboardTitle';
import ErrorBanner from '@/components/dashboard/ErrorBanner';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import DashboardBackground from '@/components/layout/DashboardBackground';
import { readGuestProgress } from '@/lib/guestProgressStore';
import {
  getGuestDashboardProgress,
  getGuestPracticeDays,
  getGuestProgressForLanguage,
  getGuestWeakKeys,
} from '@/lib/guestDashboardProgress';
import type { PracticeDay, ProgressData } from '@/types/progress';
import type { WeakKey } from '@/types/weakKeys';

const ProgressChart = dynamic(() => import('@/components/dashboard/ProgressChart'), { ssr: false });
const ErrorTrends = dynamic(() => import('@/components/dashboard/ErrorTrends'), { ssr: false });
const FingerDistribution = dynamic(() => import('@/components/dashboard/FingerDistribution'), {
  ssr: false,
});
const PracticeCalendar = dynamic(() => import('@/components/dashboard/PracticeCalendar'), {
  ssr: false,
});

export default function ProgressPage() {
  const params = useParams();
  const lang = params.lang as string;
  const locale = toSupportedLocale(lang);
  const t = useTranslations(lang as never);

  const {
    normalized,
    loading: progressLoading,
    error,
    fetchProgress,
  } = useNormalizedProgress(locale);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    days: practiceDays,
    fetchDates: fetchPracticeDates,
    loading: calendarLoading,
  } = usePracticeCalendar(locale);
  const [guestProgress, setGuestProgress] = useState<ProgressData | null>(null);
  const [guestPracticeDays, setGuestPracticeDays] = useState<PracticeDay[]>([]);
  const [guestWeakKeys, setGuestWeakKeys] = useState<WeakKey[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgress();
      fetchPracticeDates();
    }
  }, [isAuthenticated, fetchProgress, fetchPracticeDates]);

  useEffect(() => {
    if (isAuthenticated) {
      setGuestProgress(null);
      setGuestPracticeDays([]);
      setGuestWeakKeys([]);
      return;
    }

    const localProgress = getGuestProgressForLanguage(readGuestProgress(), locale);
    const hasLocalData =
      Object.keys(localProgress.lessons).length > 0 || localProgress.practice.length > 0;
    setGuestProgress(hasLocalData ? getGuestDashboardProgress(localProgress) : null);
    setGuestPracticeDays(getGuestPracticeDays(localProgress));
    setGuestWeakKeys(getGuestWeakKeys(localProgress));
  }, [isAuthenticated, locale]);

  const handleRetry = useCallback(() => {
    fetchProgress();
    fetchPracticeDates();
  }, [fetchProgress, fetchPracticeDates]);

  const emptyWeeklyData = {
    labels: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
    values: [0, 0, 0, 0, 0, 0, 0],
  };
  const emptyMonthlyData = { labels: ['S1', 'S2', 'S3', 'S4'], values: [0, 0, 0, 0] };

  const translations = {
    completedLessons: t('dashboard.general.completedLessons'),
    completedCourses: t('dashboard.general.completedCourses'),
    averageWpm: t('dashboard.general.averageWpm'),
    averageAccuracy: t('dashboard.general.averageAccuracy'),
    streak: t('dashboard.general.streak'),
    totalPracticeTime: t('dashboard.general.totalPracticeTime'),
    days: t('dashboard.general.days'),
    wordsPerMinute: t('dashboard.general.wordsPerMinute'),
    accuracy: t('dashboard.general.accuracy'),
    consecutivePractice: t('dashboard.general.consecutivePractice'),
    thisWeek: t('dashboard.general.thisWeek'),
    signIn: t('dashboard.general.signIn'),
  };

  const isLoading =
    authLoading || (isAuthenticated && progressLoading) || (isAuthenticated && calendarLoading);

  if (isLoading) {
    return (
      <DashboardBackground>
        <DashboardSkeleton
          title={t('dashboard.general.title')}
          translations={translations}
        />
      </DashboardBackground>
    );
  }

  if (error && !normalized && isAuthenticated) {
    return (
      <DashboardBackground>
        <div className="relative z-1 space-y-6 p-6">
          <DashboardTitle
            title={t('dashboard.general.title')}
          />
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <p className="text-(--text-primary) mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              {t('dashboard.general.retry')}
            </button>
          </div>
        </div>
      </DashboardBackground>
    );
  }

  return (
    <DashboardBackground>
      <div className="relative z-1 space-y-6 p-6">
        <DashboardTitle
          title={t('dashboard.general.title')}
        />

        {error && (
          <ErrorBanner
            message={error}
            buttonText={t('dashboard.general.retry')}
            onRetry={handleRetry}
          />
        )}

        <StatsGrid
          status={
            isAuthenticated && normalized
              ? 'data'
              : isAuthenticated
                ? 'empty'
                : guestProgress
                  ? 'data'
                  : 'guest'
          }
          data={normalized ?? guestProgress ?? undefined}
          translations={translations}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProgressChart
            data={normalized?.weeklyProgress ?? guestProgress?.weeklyProgress ?? emptyWeeklyData}
            title={t('dashboard.general.weeklyWpmProgress')}
            showStatusBadge={!isAuthenticated && !guestProgress}
          />
          <ProgressChart
            data={normalized?.monthlyProgress ?? guestProgress?.monthlyProgress ?? emptyMonthlyData}
            title={t('dashboard.general.monthlyWpmProgress')}
            showStatusBadge={!isAuthenticated && !guestProgress}
          />
          <PracticeCalendar
            data={isAuthenticated ? practiceDays : guestPracticeDays}
            showStatusBadge={!isAuthenticated && !guestProgress}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorTrends guestWeakKeys={guestWeakKeys} locale={locale} />
          <FingerDistribution guestWeakKeys={guestWeakKeys} locale={locale} />
        </div>

        <Link
          href={`/${locale}/dashboard/practice?mode=adaptive`}
          className="block rounded-lg border border-(--accent-blue-border) bg-(--bg-card) p-6 transition-colors hover:bg-(--bg-card-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-blue)"
        >
          <h2 className="text-lg font-semibold text-(--text-primary)">
            {t('practice.general.modeWords')}
          </h2>
        </Link>
      </div>
    </DashboardBackground>
  );
}
