// components/dashboard/FingerDistribution.tsx

'use client';

import { useParams } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useKeyboardLayout } from '@/hooks/useKeyboardLayout';
import { useWeakKeys } from '@/hooks/useWeakKeys';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import type { KeyboardLayout } from '@/lib/keyboardLayouts';
import { getPhysicalKeyIdForCode } from '@/lib/keyboardPhysical';
import type { WeakKey } from '@/types/weakKeys';
import type { Locale } from '@/lib/locales';

interface FingerData {
  id: string;
  labelKey: string;
  hand: 'left' | 'right';
  assignedKeys: string[];
  activeKeys: string[];
  totalAttempts: number;
  correctAttempts: number;
  errorAttempts: number;
  accuracy: number;
  errorRate: number;
}

type FingerDefinition = Pick<FingerData, 'id' | 'labelKey' | 'hand' | 'assignedKeys'>;

const FINGER_CODES: Array<Omit<FingerDefinition, 'assignedKeys'> & { codes: string[] }> = [
  {
    id: 'left-pinky',
    labelKey: 'pinky',
    hand: 'left',
    codes: ['Backquote', 'Digit1', 'KeyQ', 'KeyA', 'KeyZ'],
  },
  { id: 'left-ring', labelKey: 'ring', hand: 'left', codes: ['Digit2', 'KeyW', 'KeyS', 'KeyX'] },
  {
    id: 'left-middle',
    labelKey: 'middle',
    hand: 'left',
    codes: ['Digit3', 'KeyE', 'KeyD', 'KeyC'],
  },
  {
    id: 'left-index',
    labelKey: 'index',
    hand: 'left',
    codes: ['Digit4', 'Digit5', 'KeyR', 'KeyT', 'KeyF', 'KeyG', 'KeyV', 'KeyB'],
  },
  {
    id: 'right-index',
    labelKey: 'index',
    hand: 'right',
    codes: ['Digit6', 'Digit7', 'KeyY', 'KeyU', 'KeyH', 'KeyJ', 'KeyN', 'KeyM'],
  },
  {
    id: 'right-middle',
    labelKey: 'middle',
    hand: 'right',
    codes: ['Digit8', 'KeyI', 'KeyK', 'Comma'],
  },
  {
    id: 'right-ring',
    labelKey: 'ring',
    hand: 'right',
    codes: ['Digit9', 'KeyO', 'KeyL', 'Period'],
  },
  {
    id: 'right-pinky',
    labelKey: 'pinky',
    hand: 'right',
    codes: [
      'Digit0',
      'KeyP',
      'Semicolon',
      'Quote',
      'BracketLeft',
      'BracketRight',
      'Backslash',
      'IntlBackslash',
      'Minus',
      'Equal',
      'Slash',
    ],
  },
];

function getFingerDefinitions(layout: KeyboardLayout): FingerDefinition[] {
  return FINGER_CODES.map(({ codes, ...finger }) => ({
    ...finger,
    assignedKeys: [
      ...new Set(
        codes
          .map((code) => getPhysicalKeyIdForCode(code))
          .filter((id): id is NonNullable<typeof id> => id !== null)
          .flatMap((id) => [
            layout.keys[id],
            layout.shiftedKeys?.[id],
            layout.altGrKeys?.[id],
            layout.shiftAltGrKeys?.[id],
          ])
          .filter((key): key is string => Boolean(key)),
      ),
    ],
  }));
}

function getEmptyFingerData(definitions: FingerDefinition[]): FingerData[] {
  return definitions.map((definition) => ({
    ...definition,
    activeKeys: [],
    totalAttempts: 0,
    correctAttempts: 0,
    errorAttempts: 0,
    accuracy: 0,
    errorRate: 0,
  }));
}

function aggregateByFinger(weakKeys: WeakKey[], definitions: FingerDefinition[]): FingerData[] {
  const result: Record<string, FingerData> = {};
  const keyToFinger = new Map<string, string>();

  for (const definition of definitions) {
    result[definition.id] = {
      ...definition,
      activeKeys: [],
      totalAttempts: 0,
      correctAttempts: 0,
      errorAttempts: 0,
      accuracy: 0,
      errorRate: 0,
    };

    for (const key of definition.assignedKeys) {
      keyToFinger.set(key.toLowerCase(), definition.id);
    }
  }

  for (const weakKey of weakKeys) {
    const normalizedKey = weakKey.key.toLowerCase();
    const fingerId = keyToFinger.get(normalizedKey);

    if (!fingerId) {
      continue;
    }

    result[fingerId].activeKeys.push(weakKey.key);
    result[fingerId].totalAttempts += weakKey.totalAttempts;
    result[fingerId].correctAttempts += weakKey.correctAttempts;
    result[fingerId].errorAttempts += weakKey.totalAttempts - weakKey.correctAttempts;
  }

  for (const item of Object.values(result)) {
    item.accuracy = item.totalAttempts > 0 ? (item.correctAttempts / item.totalAttempts) * 100 : 0;

    item.errorRate = item.totalAttempts > 0 ? (item.errorAttempts / item.totalAttempts) * 100 : 0;
  }

  return Object.values(result);
}

function getBarWidth(percentage: number, hasData: boolean): string {
  if (!hasData) {
    return '0%';
  }

  return `${percentage}%`;
}

export default function FingerDistribution({
  guestWeakKeys = [],
  locale,
}: {
  guestWeakKeys?: WeakKey[];
  locale?: Locale;
}) {
  const { lang } = useParams<{ lang: string }>();
  const t = useTranslations(toSupportedLocale(lang));
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { selectedLayout } = useKeyboardLayout();
  const { data, loading: weakKeysLoading } = useWeakKeys({ limit: 100, locale });

  if (authLoading || (isAuthenticated && weakKeysLoading)) {
    return (
      <div className="animate-pulse rounded-lg border border-(--border-card) bg-(--bg-card) p-6">
        <div className="mb-4 h-5 w-40 rounded bg-(--bg-secondary)" />

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-4 rounded bg-(--bg-secondary)" />
            ))}
          </div>

          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-4 rounded bg-(--bg-secondary)" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const weakKeys = isAuthenticated ? (data?.weakKeys ?? []) : guestWeakKeys;
  const isGuest = !isAuthenticated;
  const hasData = weakKeys.length > 0 && (isGuest || Boolean(data && !data.insufficientData));

  const fingerDefinitions = getFingerDefinitions(selectedLayout);
  const fingerData = hasData
    ? aggregateByFinger(weakKeys, fingerDefinitions)
    : getEmptyFingerData(fingerDefinitions);

  const leftHand = fingerData.filter((finger) => finger.hand === 'left');
  const rightHand = fingerData.filter((finger) => finger.hand === 'right');

  return (
    <div className="rounded-lg border border-(--border-card) bg-(--bg-card)">
      <div className="flex items-center justify-between rounded-t-lg bg-(--bg-primary) px-6 py-3 light:bg-(--bg-secondary)">
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {t('components.dashboard.fingerDistribution.general.title')}
        </h2>

        {isGuest && !hasData && (
          <span className="rounded bg-(--dashboard-sign-in-badge-background) px-2 py-1 text-xs text-(--dashboard-sign-in-badge-text)">
            {t('components.dashboard.fingerDistribution.general.noData')}
          </span>
        )}

        {isAuthenticated && !hasData && (
          <span className="rounded bg-(--bg-secondary) px-2 py-1 text-xs text-(--text-tertiary)">
            {t('components.dashboard.fingerDistribution.general.noData')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 p-6">
        <FingerList
          fingers={leftHand}
          hand={t('components.dashboard.fingerDistribution.general.leftHand')}
          hasData={hasData}
        />

        <FingerList
          fingers={rightHand}
          hand={t('components.dashboard.fingerDistribution.general.rightHand')}
          hasData={hasData}
        />
      </div>
    </div>
  );
}

function FingerList({
  fingers,
  hand,
  hasData,
}: {
  fingers: FingerData[];
  hand: string;
  hasData: boolean;
}) {
  const { lang } = useParams<{ lang: string }>();
  const t = useTranslations(toSupportedLocale(lang));

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-(--text-secondary)">
        {t('components.dashboard.fingerDistribution.general.hand', {
          hand,
        })}
      </h3>

      <div className="space-y-2">
        {fingers.map((finger) => (
          <div key={finger.id}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-(--text-primary)">
                {t(`components.dashboard.fingerDistribution.general.${finger.labelKey}`)}
              </span>

              <div className="flex gap-2 text-xs text-(--text-tertiary)">
                <span>
                  {hasData
                    ? t('components.dashboard.fingerDistribution.general.correctPercentage', {
                        percentage: finger.accuracy.toFixed(0),
                      })
                    : t('components.dashboard.fingerDistribution.general.noCorrectPercentage')}
                </span>

                <span>
                  {hasData
                    ? t('components.dashboard.fingerDistribution.general.errorPercentage', {
                        percentage: finger.errorRate.toFixed(0),
                      })
                    : t('components.dashboard.fingerDistribution.general.errors')}
                </span>
              </div>
            </div>

            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-600">
              <div
                className="h-full bg-(--accent-green) transition-all"
                style={{
                  width: getBarWidth(finger.accuracy, hasData),
                }}
              />

              <div
                className="h-full bg-(--accent-red) transition-all"
                style={{
                  width: getBarWidth(finger.errorRate, hasData && finger.errorAttempts > 0),
                }}
              />
            </div>

            {finger.assignedKeys.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {finger.assignedKeys.map((key) => (
                  <span
                    key={key}
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      finger.activeKeys.some(
                        (activeKey) => activeKey.toLowerCase() === key.toLowerCase(),
                      )
                        ? 'bg-(--accent-blue-bg) text-(--accent-blue)'
                        : 'bg-slate-600 text-(--text-secondary)'
                    }`}
                  >
                    {key}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
