// components/dashboard/RankingPositionCard.tsx

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

import { useRankingUserStats } from '@/hooks/useRankingUserStats';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';

export default function RankingPositionCard() {
  const { lang } = useParams<{ lang: string }>();
  const locale = toSupportedLocale(lang);
  const t = useTranslations(locale);
  const { stats, loading } = useRankingUserStats(locale, locale);

  if (loading) {
    return (
      <div className="animate-pulse overflow-hidden rounded-2xl border border-(--border-card) bg-(--bg-card)">
        <div className="h-11 bg-(--bg-primary) light:bg-(--bg-secondary)" />
        <div className="p-5">
          <div className="h-8 w-24 rounded bg-(--bg-secondary)" />
        </div>
      </div>
    );
  }

  const showRank = Boolean(stats) && !stats!.insufficientData && stats!.rankingVisible !== false;

  return (
    <Link
      href={`/${locale}/dashboard/ranking`}
      className="block overflow-hidden rounded-2xl border border-(--border-card) bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none transition-colors hover:bg-(--bg-card-hover)"
    >
      <div className="flex items-center gap-2 bg-(--bg-primary) px-6 py-3 light:bg-(--bg-secondary)">
        <Trophy className="h-5 w-5 text-(--accent-amber)" />
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {t('ranking.general.title')}
        </h2>
      </div>

      <div className="p-5">
        {showRank ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-(--text-secondary)">{t('ranking.general.currentRank')}</p>
              <p className="text-2xl font-bold text-(--text-primary)">#{stats!.rank}</p>
            </div>

            <span className="rounded-full bg-(--accent-amber-bg) px-3 py-1 text-sm font-medium text-(--accent-amber)">
              {t('ranking.general.topPercent', { percent: stats!.topPercent })}
            </span>
          </div>
        ) : (
          <p className="text-sm text-(--text-secondary)">{t('ranking.general.insufficientData')}</p>
        )}
      </div>
    </Link>
  );
}
