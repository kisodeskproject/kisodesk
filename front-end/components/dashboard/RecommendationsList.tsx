// components/dashboard/RecommendationsList.tsx

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

import type { Recommendation } from '@/types/recommendation';
import { TranslationKey, toSupportedLocale, useTranslations } from '@/lib/i18n';

interface RecommendationsListProps {
  recommendations: Recommendation[];
  showStatusBadge?: boolean;
  practiceHref: string;
}

export default function RecommendationsList({
  recommendations,
  showStatusBadge = false,
  practiceHref,
}: RecommendationsListProps) {
  const { lang } = useParams<{ lang: string }>();
  const t = useTranslations(toSupportedLocale(lang));

  return (
    <div className="overflow-hidden rounded-lg border border-(--border-card) bg-(--bg-card)">
      <div className="flex items-center justify-between rounded-t-lg bg-(--bg-primary) px-6 py-3 light:bg-(--bg-secondary)">
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {t('components.dashboard.recommendationsList.general.title' as TranslationKey)}
        </h2>

        {showStatusBadge && (
          <span className="rounded bg-(--dashboard-sign-in-badge-background) px-2 py-1 text-xs text-(--dashboard-sign-in-badge-text)">
            {t('components.dashboard.recommendationsList.general.noData' as TranslationKey)}
          </span>
        )}
      </div>

      <div className="p-6">
        {recommendations.length === 0 ? (
          <p className="text-sm text-(--text-secondary)">
            {t(
              'components.dashboard.recommendationsList.general.noRecommendations' as TranslationKey,
            )}
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="rounded-lg border border-(--border-card) bg-(--bg-secondary) p-4"
              >
                <p className="text-sm text-(--text-primary)">{recommendation.message}</p>
              </div>
            ))}
          </div>
        )}

        <Link
          href={practiceHref}
          className="mt-4 block rounded-lg border border-(--accent-blue-border) bg-(--accent-blue-bg) px-4 py-2 text-center text-sm font-medium text-(--accent-blue) transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-blue)"
        >
          {t('practice.general.modeWords')}
        </Link>
      </div>
    </div>
  );
}
