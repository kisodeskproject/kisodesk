'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

import Button from '@/components/ui/Button';
import { useTranslations } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
import type { KeyboardPhysicalFamily } from '@/lib/keyboardLayouts';

type WizardStep = 'enter' | 'iso' | 'rectangular' | 'eastAsian' | 'complete';

const DETECTION_BUTTON_CLASS =
  'bg-(--keyboard-modifier-key-background) hover:bg-(--keyboard-modifier-key-background) hover:brightness-110 focus-visible:ring-(--keyboard-modifier-key-background) shadow-none hover:shadow-none';
const BACK_BUTTON_CLASS = 'border border-(--border-card) bg-(--bg-card-hover) hover:bg-(--bg-card-hover)';

const PHYSICAL_FAMILY_LABEL: Record<KeyboardPhysicalFamily, string> = {
  ANSI: 'ANSI',
  ISO: 'ISO',
  ABNT2: 'ABNT2',
  JIS: 'JIS',
  KS: 'KS',
  BIG_ASS: 'ISO BA',
};

interface KeyboardDetectionWizardProps {
  lang: Locale;
  embedded?: boolean;
  onSelectPhysicalFamily?: (family: KeyboardPhysicalFamily) => Promise<void> | void;
  onComplete?: () => void;
}

export default function KeyboardDetectionWizard({
  lang,
  embedded = false,
  onSelectPhysicalFamily,
  onComplete,
}: KeyboardDetectionWizardProps) {
  const t = useTranslations(lang);
  const [step, setStep] = useState<WizardStep>('enter');
  const [family, setFamily] = useState<KeyboardPhysicalFamily | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const Heading = embedded ? 'h3' : 'h2';

  const chooseFamily = async (nextFamily: KeyboardPhysicalFamily) => {
    setFamily(nextFamily);
    setIsSaving(true);
    setSaveError(false);
    try {
      await onSelectPhysicalFamily?.(nextFamily);
      setStep('complete');
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <header>
          <h1 className="text-balance text-2xl font-bold text-(--text-primary)">
            {t('components.lessons.keyboardDetectionWizard.general.physicalFamily.title')}
          </h1>
          <p className="mt-1 text-pretty text-(--text-secondary)">
            {t('components.lessons.keyboardDetectionWizard.general.physicalFamily.subtitle')}
          </p>
        </header>
      )}

      <section className="rounded-xl border border-(--border-card) bg-(--bg-card) p-6">
        {step === 'enter' && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <Heading className="text-xl font-semibold text-(--text-primary)">
                {t('components.lessons.keyboardDetectionWizard.general.physicalFamily.enterQuestion')}
              </Heading>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                aria-label={t('components.lessons.keyboardDetectionWizard.general.physicalFamily.enterHorizontal')}
                onClick={() => setStep('rectangular')}
                className="flex min-h-28 items-center justify-center rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4 text-(--text-primary) hover:bg-(--bg-card-hover)"
              >
                <svg viewBox="0 0 66 28" className="h-12 w-24" aria-hidden="true">
                  <rect x="1" y="1" width="64" height="26" rx="4" fill="var(--keyboard-modifier-key-background)" stroke="var(--border-card)" />
                  <text x="33" y="15" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="300" fill="var(--text-inverse)">←</text>
                </svg>
              </button>
              <button
                type="button"
                aria-label={t('components.lessons.keyboardDetectionWizard.general.physicalFamily.enterIso')}
                onClick={() => setStep('iso')}
                className="flex min-h-28 items-center justify-center rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4 text-(--text-primary) hover:bg-(--bg-card-hover)"
              >
                <svg viewBox="0 0 27 34" className="h-16 w-12" aria-hidden="true">
                  <path d="M 2 0 H 25 Q 27 0 27 2 V 32 Q 27 34 25 34 H 7 Q 5 34 5 32 V 19 Q 5 17 3 17 H 2 Q 0 17 0 15 V 2 Q 0 0 2 0 Z" fill="var(--keyboard-modifier-key-background)" stroke="var(--border-card)" strokeWidth="0.75" strokeLinejoin="round" />
                  <text x="13.5" y="10" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="300" fill="var(--text-inverse)">←</text>
                </svg>
              </button>
              <button
                type="button"
                aria-label={t('components.lessons.keyboardDetectionWizard.general.physicalFamily.enterBigAss')}
                onClick={() => void chooseFamily('BIG_ASS')}
                className="flex min-h-28 items-center justify-center rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4 text-(--text-primary) hover:bg-(--bg-card-hover)"
              >
                <svg viewBox="0 0 27 34" className="h-16 w-12" aria-hidden="true">
                  <path d="M 8 0 H 25 Q 27 0 27 2 V 32 Q 27 34 25 34 H 2 Q 0 34 0 32 V 19 Q 0 17 2 17 H 8 Z" fill="var(--keyboard-modifier-key-background)" stroke="var(--border-card)" strokeWidth="0.75" strokeLinejoin="round" />
                  <text x="13.5" y="25" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="300" fill="var(--text-inverse)">←</text>
                </svg>
              </button>
            </div>
          </div>
        )}

        {step === 'iso' && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <Heading className="text-xl font-semibold text-(--text-primary)">
                {t('components.lessons.keyboardDetectionWizard.general.physicalFamily.abntQuestion')}
              </Heading>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" aria-label="0" onClick={() => void chooseFamily('ISO')} disabled={isSaving} className="flex min-h-28 items-center justify-center rounded-xl border border-(--border-card) bg-(--keyboard-modifier-key-background) p-4 text-(--text-inverse) transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                <svg viewBox="0 0 150 32" className="h-12 w-full max-w-60" aria-hidden="true">
                  <rect x="39" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="48.5" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--text-primary)">/</text>
                  <rect x="63" y="4" width="48" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="87" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-primary)">Shift</text>
                </svg>
              </button>
              <button type="button" aria-label="1" onClick={() => void chooseFamily('ABNT2')} disabled={isSaving} className="flex min-h-28 items-center justify-center rounded-xl border border-(--border-card) bg-(--keyboard-modifier-key-background) p-4 text-(--text-inverse) transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                <svg viewBox="0 0 150 32" className="h-12 w-full max-w-60" aria-hidden="true">
                  <rect x="33" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="42.5" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--text-primary)">/</text>
                  <rect x="57" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <rect x="81" y="4" width="36" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="99" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-primary)">Shift</text>
                </svg>
              </button>
            </div>
            <Button variant="secondary" onClick={() => setStep('enter')} icon={<ArrowLeft aria-hidden="true" />} className={BACK_BUTTON_CLASS}>
              {t('components.lessons.keyboardDetectionWizard.general.back')}
            </Button>
          </div>
        )}

        {step === 'rectangular' && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <Heading className="text-xl font-semibold text-(--text-primary)">
                {t('components.lessons.keyboardDetectionWizard.general.physicalFamily.eastAsianQuestion')}
              </Heading>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-label="2"
                onClick={() => void chooseFamily('ANSI')}
                disabled={isSaving}
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-(--border-card) bg-(--keyboard-modifier-key-background) p-4 text-(--text-inverse) transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 150 32" className="h-12 w-full max-w-60" aria-hidden="true">
                  <rect x="1" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="10.5" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--text-primary)">0</text>
                  <rect x="24" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <rect x="47" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <rect x="70" y="4" width="48" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="94" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--text-primary)">←</text>
                </svg>
              </button>
              <button
                type="button"
                aria-label="3"
                onClick={() => setStep('eastAsian')}
                disabled={isSaving}
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-(--border-card) bg-(--keyboard-modifier-key-background) p-4 text-(--text-inverse) transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 150 32" className="h-12 w-full max-w-60" aria-hidden="true">
                  <rect x="1" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="10.5" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--text-primary)">0</text>
                  <rect x="24" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <rect x="47" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <rect x="70" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <rect x="93" y="4" width="48" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="117" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--text-primary)">←</text>
                </svg>
              </button>
            </div>
            <Button variant="secondary" onClick={() => setStep('enter')} icon={<ArrowLeft aria-hidden="true" />} className={BACK_BUTTON_CLASS}>
              {t('components.lessons.keyboardDetectionWizard.general.back')}
            </Button>
          </div>
        )}

        {step === 'eastAsian' && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <Heading className="text-xl font-semibold text-(--text-primary)">
                {t('components.lessons.keyboardDetectionWizard.general.physicalFamily.eastAsianCountQuestion')}
              </Heading>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-label="2"
                onClick={() => void chooseFamily('JIS')}
                disabled={isSaving}
                className="flex min-h-28 items-center justify-center rounded-xl border border-(--border-card) bg-(--keyboard-modifier-key-background) p-4 text-(--text-inverse) transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 150 32" className="h-12 w-full max-w-60" aria-hidden="true">
                  <rect x="1" y="4" width="54" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="28" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-primary)">Espacio</text>
                  <rect x="59" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <rect x="82" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <rect x="105" y="4" width="30" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="120" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-primary)">Alt</text>
                </svg>
              </button>
              <button
                type="button"
                aria-label="1"
                onClick={() => void chooseFamily('KS')}
                disabled={isSaving}
                className="flex min-h-28 items-center justify-center rounded-xl border border-(--border-card) bg-(--keyboard-modifier-key-background) p-4 text-(--text-inverse) transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 150 32" className="h-12 w-full max-w-60" aria-hidden="true">
                  <rect x="1" y="4" width="54" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="28" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-primary)">Espacio</text>
                  <rect x="59" y="4" width="19" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <rect x="82" y="4" width="30" height="24" rx="3" fill="var(--bg-secondary)" stroke="var(--border-card)" />
                  <text x="97" y="17" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-primary)">Alt</text>
                </svg>
              </button>
            </div>
            <Button variant="secondary" onClick={() => setStep('rectangular')} icon={<ArrowLeft aria-hidden="true" />} className={BACK_BUTTON_CLASS}>
              {t('components.lessons.keyboardDetectionWizard.general.back')}
            </Button>
          </div>
        )}

        {step === 'complete' && family && (
          <div className="mx-auto max-w-2xl space-y-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-(--accent-green)" aria-hidden="true" />
            <Heading className="text-xl font-semibold text-(--text-primary)">
              {t('components.lessons.keyboardDetectionWizard.general.physicalFamily.complete', {
                family: PHYSICAL_FAMILY_LABEL[family],
              })}
            </Heading>
            <Button onClick={onComplete} className={DETECTION_BUTTON_CLASS}>
              {t('components.lessons.keyboardDetectionWizard.general.close')}
            </Button>
          </div>
        )}
        {saveError && <p role="alert" className="mt-4 text-center text-sm text-(--accent-red)">{t('components.lessons.keyboardDetectionWizard.general.errors.saveFailed')}</p>}
      </section>
    </div>
  );
}
