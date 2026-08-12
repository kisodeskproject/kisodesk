// components/dashboard/ErrorTrends.tsx

'use client';

import { useParams } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useWeakKeys } from '@/hooks/useWeakKeys';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import type { WeakKey } from '@/types/weakKeys';
import type { Locale } from '@/lib/locales';

function displayCharacter(character: string): string {
  if (character === ' ') return '␠';
  if (character === '\t') return '⇥';
  if (character === '\n') return '↵';
  return character;
}

export default function ErrorTrends({
  guestWeakKeys = [],
  locale,
}: {
  guestWeakKeys?: WeakKey[];
  locale?: Locale;
}) {
  const { lang } = useParams<{ lang: string }>();
  const t = useTranslations(toSupportedLocale(lang));
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data, loading: weakKeysLoading } = useWeakKeys({ limit: 100, locale });

  if (authLoading || (isAuthenticated && weakKeysLoading)) {
    return (
      <div className="animate-pulse rounded-lg border border-(--border-card) bg-(--bg-card) p-6">
        <div className="mb-4 h-5 w-40 rounded bg-(--bg-secondary)" />

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-8 rounded bg-(--bg-secondary)" />
          ))}
        </div>
      </div>
    );
  }

  const weakKeys = isAuthenticated ? (data?.weakKeys ?? []) : guestWeakKeys;
  const isGuest = !isAuthenticated;
  const hasData = weakKeys.length > 0 && (isGuest || Boolean(data && !data.insufficientData));

  const topKeys =
    weakKeys.length > 0
      ? Object.values(
          weakKeys.reduce<Record<string, (typeof weakKeys)[number]>>((accumulator, item) => {
            const current = accumulator[item.key];

            if (!current || item.accuracy < current.accuracy) {
              accumulator[item.key] = item;
            }

            return accumulator;
          }, {}),
        )
          .sort((a, b) => a.accuracy - b.accuracy)
          .slice(0, 8)
      : [];

  return (
    <div className="rounded-lg border border-(--border-card) bg-(--bg-card)">
      <div className="flex items-center justify-between rounded-t-lg bg-(--bg-primary) px-6 py-3 light:bg-(--bg-secondary)">
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {t('components.dashboard.errorTrends.general.title')}
        </h2>

        {isGuest && !hasData ? (
          <span className="rounded bg-(--dashboard-sign-in-badge-background) px-2 py-1 text-xs text-(--dashboard-sign-in-badge-text)">
            {t('components.dashboard.errorTrends.general.noData')}
          </span>
        ) : (
          !hasData && (
            <span className="rounded bg-(--bg-secondary) px-2 py-1 text-xs text-(--text-tertiary)">
              {t('components.dashboard.errorTrends.general.noData')}
            </span>
          )
        )}
      </div>

      <div className="p-6">
      {!hasData ? (
        <div
          className="space-y-3"
          aria-label={t('components.dashboard.errorTrends.general.insufficientData')}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded border border-(--border-card) bg-(--bg-secondary)" />

              <div className="flex-1">
                <div className="mb-1 h-3 w-24 rounded bg-(--bg-secondary)" />
                <div className="h-2 w-full rounded-full bg-slate-600" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-(--text-secondary)">
            {t('components.dashboard.errorTrends.general.highestErrorRate')}
          </p>

          {topKeys.map((key) => {
            const errorRate = 100 - key.accuracy;

            return (
              <div key={key.key} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded border border-(--border-card) bg-(--bg-secondary)"
                  aria-label={key.key}
                >
                  <span className="font-mono text-sm font-bold text-(--accent-red)">
                    {displayCharacter(key.key)}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-(--text-secondary)">
                      {t('components.dashboard.errorTrends.general.correctAttempts', {
                        correctAttempts: key.correctAttempts,
                        totalAttempts: key.totalAttempts,
                      })}
                    </span>

                    <span className="text-xs text-(--accent-red)">{errorRate.toFixed(1)}%</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-600">
                    <div
                      className="h-full rounded-full bg-(--accent-red) transition-all"
                      style={{ width: `${Math.max(errorRate, 2)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
