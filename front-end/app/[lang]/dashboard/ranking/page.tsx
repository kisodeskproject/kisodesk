// app/[lang]/dashboard/ranking/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { apiGet } from '@/lib/apiClient';
import type { RankUser, UserStatsResponse, RankingResponse, RankingScope } from '@/types/ranking';
import LanguageFilter from '@/components/ranking/LanguageFilter';
import UserStatsCard from '@/components/ranking/UserStatsCard';
import RankingTable from '@/components/ranking/RankingTable';
import DistributionCharts from '@/components/ranking/DistributionCharts';
import Button from '@/components/ui/Button';
import DashboardBackground from '@/components/layout/DashboardBackground';
import AuthBanner from '@/components/dashboard/AuthBanner';
import { readGuestProgress } from '@/lib/guestProgressStore';
import { getGuestProgressForLanguage, getGuestRecentAverage } from '@/lib/guestDashboardProgress';

const RANKING_LIMIT = 20;

export default function RankingPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const t = useTranslations(lang as never);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [ranking, setRanking] = useState<RankUser[]>([]);
  const [distribution, setDistribution] = useState<Array<{ wpm: number; accuracy: number }>>([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [userStatsError, setUserStatsError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<RankingScope>('global');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / RANKING_LIMIT);

  const fetchRanking = useCallback(
    async (language: RankingScope, pageNum: number) => {
      setRankingLoading(true);
      setRankingError(null);
      try {
        const offset = (pageNum - 1) * RANKING_LIMIT;
        const query = `language=${language}&limit=${RANKING_LIMIT}&offset=${offset}`;
        const endpoint = `/ranking?${query}`;
        const data = await apiGet<RankingResponse>(endpoint);
        setRanking(data.ranking ?? []);
        setDistribution(data.distribution ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        setRankingError(
          err instanceof Error ? err.message : t('ranking.general.errorFetchingRanking'),
        );
      } finally {
        setRankingLoading(false);
      }
    },
    [t],
  );

  const fetchUserStats = useCallback(
    async (language: RankingScope) => {
      if (authLoading) return;

      if (!isAuthenticated) {
        setUserStats(null);
        setUserStatsError(null);
        setUserStatsLoading(false);
        return;
      }
      setUserStatsLoading(true);
      setUserStatsError(null);
      try {
        const endpoint =
          language !== 'global'
            ? `/ranking/user-stats?language=${language}`
            : '/ranking/user-stats';
        const data = await apiGet<UserStatsResponse>(endpoint);
        setUserStats(data);
      } catch (err) {
        setUserStatsError(
          err instanceof Error ? err.message : t('ranking.general.errorFetchingStats'),
        );
      } finally {
        setUserStatsLoading(false);
      }
    },
    [authLoading, isAuthenticated, t],
  );

  useEffect(() => {
    fetchRanking(selectedLanguage, page);
  }, [selectedLanguage, page, fetchRanking]);
  useEffect(() => {
    fetchUserStats(selectedLanguage);
  }, [selectedLanguage, fetchUserStats]);
  useEffect(() => {
    setPage(1);
  }, [selectedLanguage]);

  const [recentAverage, setRecentAverage] = useState<{
    score: number;
    wpm: number;
    grossWpm: number;
    accuracy: number;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      setRecentAverage(userStats?.recentAverage ?? null);
      return;
    }

    const guestProgress = readGuestProgress();
    const scopedProgress =
      selectedLanguage === 'global'
        ? guestProgress
        : getGuestProgressForLanguage(guestProgress, selectedLanguage);
    setRecentAverage(getGuestRecentAverage(scopedProgress));
  }, [authLoading, isAuthenticated, userStats, selectedLanguage]);

  const scatterData = useMemo(() => distribution, [distribution]);
  const currentUserPoint = useMemo(() => {
    if (!recentAverage) return undefined;
    return { wpm: recentAverage.wpm, accuracy: recentAverage.accuracy };
  }, [recentAverage]);

  const getMedal = (index: number) => {
    if (page === 1 && index === 0) return '🥇';
    if (page === 1 && index === 1) return '🥈';
    if (page === 1 && index === 2) return '🥉';
    return `#${(page - 1) * RANKING_LIMIT + index + 1}`;
  };

  const headingClasses =
    'text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 light:from-(--page-title-primary-color) light:to-(--page-title-secondary-color) bg-clip-text text-transparent';
  const cardClasses =
    'bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none rounded-xl border border-(--border-card)';

  return (
    <DashboardBackground>
      <div className="space-y-6 p-6">
        <div>
          <h1 className={headingClasses}>{t('ranking.general.title')}</h1>
        </div>

        {!authLoading && !isAuthenticated && (
          <AuthBanner
            message={t('ranking.general.signInToParticipate')}
            buttonText={t('components.dashboard.authBanner.general.signIn')}
            onSignIn={() => router.push(`/${lang}/login`)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <div className="lg:col-span-1 h-full flex flex-col gap-2">
            <div className="relative z-20 *:py-1">
              <LanguageFilter
                selectedLanguage={selectedLanguage}
                onChange={setSelectedLanguage}
                t={t}
              />
            </div>
            <div className={`flex-1 ${cardClasses} p-6`}>
              <div className="-mx-6 -mt-6 mb-4 flex items-center justify-between rounded-t-xl bg-(--bg-primary) px-6 py-3 light:bg-(--bg-secondary)">
                <h2 className="text-lg font-semibold text-(--text-primary)">
                  {t('ranking.general.yourStats')}
                </h2>
                {!recentAverage && (
                  <span className="text-xs px-2 py-1 bg-(--dashboard-sign-in-badge-background) text-(--dashboard-sign-in-badge-text) rounded">
                    {t('ranking.general.noData')}
                  </span>
                )}
              </div>
              <p className="text-sm text-(--text-secondary) mb-1">
                {t('ranking.general.basedOnLast10')}
              </p>
              <UserStatsCard
                stats={
                  userStats ? { ...userStats, topPercent: Math.round(userStats.topPercent) } : null
                }
                recentAverage={recentAverage}
                loading={userStatsLoading}
                error={userStatsError}
                isAuthenticated={isAuthenticated}
                onRetry={() => fetchUserStats(selectedLanguage)}
                t={t}
              />
            </div>
          </div>
          <div className="lg:col-span-2 h-full">
            <DistributionCharts userData={scatterData} currentUser={currentUserPoint} t={t} />
          </div>
        </div>

        <div className={`${cardClasses} overflow-x-auto`}>
          <RankingTable
            users={ranking}
            loading={rankingLoading}
            error={rankingError}
            onRetry={() => fetchRanking(selectedLanguage, page)}
            t={t}
            getMedal={getMedal}
          />
          {!rankingLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-(--border-card)">
              <span className="text-sm text-(--text-secondary)">
                {t('ranking.general.showing')} {(page - 1) * RANKING_LIMIT + 1}-
                {Math.min(page * RANKING_LIMIT, total)} {t('ranking.general.of')} {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('ranking.general.previous')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                >
                  {t('ranking.general.next')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardBackground>
  );
}
