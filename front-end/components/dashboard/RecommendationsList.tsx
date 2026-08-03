// components/dashboard/RecommendationsList.tsx

'use client';

import { useParams } from 'next/navigation';

import type { Recommendation } from '@/types/recommendation';
import { TranslationKey, toSupportedLocale, useTranslations } from '@/lib/i18n';

interface RecommendationsListProps {
  recommendations: Recommendation[];
  showSignInBadge?: boolean;
}

export default function RecommendationsList({
  recommendations,
  showSignInBadge = false,
}: RecommendationsListProps) {
  const { lang } = useParams<{ lang: string }>();
  const t = useTranslations(toSupportedLocale(lang));

  return (
    <div className="rounded-lg border border-(--border-card) bg-(--bg-card) p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {t('components.dashboard.recommendationsList.general.title' as TranslationKey)}
        </h2>

        {showSignInBadge && (
          <span className="rounded bg-(--dashboard-sign-in-badge-background) px-2 py-1 text-xs text-(--dashboard-sign-in-badge-text)">
            {t('components.dashboard.recommendationsList.general.signIn' as TranslationKey)}
          </span>
        )}
      </div>

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
    </div>
  );
}
