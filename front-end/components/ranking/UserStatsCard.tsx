'use client';

import { AlertTriangle } from 'lucide-react';
import { UserStatsResponse } from '@/types/ranking';

interface UserStatsCardProps {
  stats: UserStatsResponse | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  onRetry: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  getLevelIcon: (level: string) => string;
  getLevelColor: (level: string) => string;
}

export default function UserStatsCard({
  stats,
  loading,
  error,
  isAuthenticated,
  onRetry,
  t,
  getLevelIcon,
  getLevelColor,
}: UserStatsCardProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-(--bg-secondary) rounded w-3/4" />
        <div className="h-4 bg-(--bg-secondary) rounded w-1/2" />
        <div className="h-4 bg-(--bg-secondary) rounded w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <AlertTriangle className="w-8 h-8 text-(--accent-red) mx-auto mb-2" />
        <p className="text-(--accent-red) text-sm mb-3">{error}</p>
        <button
          onClick={onRetry}
          className="text-xs text-(--accent-blue) hover:underline focus:outline-none"
          aria-label={t('ranking.general.retry')}
        >
          {t('ranking.general.retry')}
        </button>
      </div>
    );
  }

  if (isAuthenticated && stats && !stats.insufficientData) {
    if (stats.rankingVisible === false) {
      return (
        <div className="text-center py-6">
          <p className="text-(--text-secondary) text-sm">{t('ranking.general.privateProfile')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-(--border-card) pb-2">
          <span className="text-(--text-secondary)">{t('ranking.general.score')}</span>
          <span className="text-2xl font-bold text-(--accent-purple)">{stats.score}</span>
        </div>
        <div className="flex justify-between items-center border-b border-(--border-card) pb-2">
          <span className="text-(--text-secondary)">{t('ranking.general.grossWpm')}</span>
          <span className="text-2xl font-bold text-(--accent-blue)">
            {stats.bestGrossWpm ?? '—'}
          </span>
        </div>
        <div className="flex justify-between items-center border-b border-(--border-card) pb-2">
          <span className="text-(--text-secondary)">{t('ranking.general.accuracy')}</span>
          <span className="text-2xl font-bold text-(--accent-green)">{stats.bestAccuracy}%</span>
        </div>
        <div className="flex justify-between items-center border-b border-(--border-card) pb-2">
          <span className="text-(--text-secondary)">{t('ranking.general.currentRank')}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-(--text-tertiary)">
              {t('ranking.general.topPercent', { percent: stats.topPercent })}
            </span>
            <span className="text-2xl font-bold text-(--accent-yellow)">#{stats.rank}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-(--text-secondary)">{t('ranking.general.level')}</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getLevelIcon(stats.level)}</span>
            <span className={`font-semibold ${getLevelColor(stats.level)}`}>
              {t(`ranking.userStatsCard.general.levels.${stats.level}`)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 opacity-70">
      <div className="flex justify-between items-center border-b border-(--border-card) pb-2">
        <span className="text-(--text-secondary)">{t('ranking.general.score')}</span>
        <span className="text-2xl font-bold text-(--accent-purple)">—</span>
      </div>
      <div className="flex justify-between items-center border-b border-(--border-card) pb-2">
        <span className="text-(--text-secondary)">{t('ranking.general.grossWpm')}</span>
        <span className="text-2xl font-bold text-(--accent-blue)">—</span>
      </div>
      <div className="flex justify-between items-center border-b border-(--border-card) pb-2">
        <span className="text-(--text-secondary)">{t('ranking.general.accuracy')}</span>
        <span className="text-2xl font-bold text-(--accent-green)">—</span>
      </div>
      <div className="flex justify-between items-center border-b border-(--border-card) pb-2">
        <span className="text-(--text-secondary)">{t('ranking.general.currentRank')}</span>
        <span className="text-2xl font-bold text-(--accent-yellow)">—</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-(--text-secondary)">{t('ranking.general.level')}</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl">—</span>
          <span className="font-semibold text-(--text-secondary)">—</span>
        </div>
      </div>
    </div>
  );
}
