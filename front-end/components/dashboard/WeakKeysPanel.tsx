// components/dashboard/WeakKeysPanel.tsx

'use client';

import { useParams } from 'next/navigation';

import type { WeakKey, WeakKeysResponse } from '@/types/weakKeys';
import { TranslationKey, toSupportedLocale, useTranslations } from '@/lib/i18n';

interface WeakKeysPanelProps {
  data: WeakKeysResponse;
}

export default function WeakKeysPanel({ data }: WeakKeysPanelProps) {
  const { lang } = useParams<{ lang: string }>();
  const t = useTranslations(toSupportedLocale(lang));
  const { weakKeys, summary } = data;

  if (!weakKeys.length) return null;

  const maxAccuracy = 100;

  return (
    <div className="rounded-lg border border-(--border-card) bg-(--bg-card) p-6">
      <h2 className="mb-4 text-lg font-semibold text-(--text-primary)">
        {t('components.dashboard.weakKeysPanel.general.title' as TranslationKey)}
      </h2>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-(--bg-secondary) p-4">
            <p className="text-sm text-(--text-secondary)">
              {t('components.dashboard.weakKeysPanel.general.overallAccuracy' as TranslationKey)}
            </p>

            <p className="text-2xl font-bold text-(--text-primary)">
              {summary.overallAccuracy.toFixed(1)}%
            </p>
          </div>

          <div className="rounded-lg bg-(--bg-secondary) p-4">
            <p className="text-sm text-(--text-secondary)">
              {t('components.dashboard.weakKeysPanel.general.weakestKey' as TranslationKey)}
            </p>

            <p className="text-2xl font-bold text-(--accent-red)">{summary.weakestKey}</p>
          </div>

          <div className="rounded-lg bg-(--bg-secondary) p-4">
            <p className="text-sm text-(--text-secondary)">
              {t('components.dashboard.weakKeysPanel.general.lowestAccuracy' as TranslationKey)}
            </p>

            <p className="text-2xl font-bold text-(--accent-red)">
              {summary.weakestAccuracy.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {weakKeys.map((weakKey) => (
          <WeakKeyRow key={weakKey.key} weakKey={weakKey} maxAccuracy={maxAccuracy} />
        ))}
      </div>
    </div>
  );
}

function WeakKeyRow({ weakKey, maxAccuracy }: { weakKey: WeakKey; maxAccuracy: number }) {
  const percentage = (weakKey.accuracy / maxAccuracy) * 100;

  const barColor =
    weakKey.accuracy >= 80
      ? 'bg-(--accent-green)'
      : weakKey.accuracy >= 60
        ? 'bg-(--accent-yellow)'
        : 'bg-(--accent-red)';

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-(--border-card) bg-(--bg-secondary)">
        <span className="font-mono text-lg font-bold text-(--text-primary)">{weakKey.key}</span>
      </div>

      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm text-(--text-primary)">{weakKey.accuracy.toFixed(1)}%</span>

          <span className="text-xs text-(--text-tertiary)">
            {weakKey.correctAttempts}/{weakKey.totalAttempts}
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-(--bg-secondary)">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {weakKey.commonMistakes.length > 0 && (
          <div className="mt-1 flex gap-1">
            {weakKey.commonMistakes.map((mistake) => (
              <span
                key={mistake}
                className="rounded bg-(--bg-secondary) px-2 py-0.5 text-xs text-(--text-secondary)"
              >
                {mistake}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
