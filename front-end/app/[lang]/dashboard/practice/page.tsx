// app/[lang]/dashboard/practice/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { toContentLanguage } from '@/lib/locales';
import { useAuth } from '@/hooks/useAuth';
import TypingArea, { TypingStats } from '@/components/lessons/TypingArea';
import Results from '@/components/lessons/Results';
import KeyboardView from '@/components/lessons/Keyboard';
import Button from '@/components/ui/Button';
import DashboardBackground from '@/components/layout/DashboardBackground';
import { RefreshCw, AlertTriangle, WifiOff, Keyboard as KeyboardIcon } from 'lucide-react';
import {
  fetchAdaptivePracticeText,
  fetchPracticeText,
  savePracticeResult,
  type AdaptivePracticeText,
} from '@/lib/practiceClient';
import { useKeyboardLayout } from '@/hooks/useKeyboardLayout';
import { buildErrorSummary } from '@/lib/errorSummary';
import { getHandReferencesForExpectedKey, getKeyboardGuideKeysForExpectedKey } from '@/lib/handSvg';
import { usePublicTrial } from '@/contexts/PublicTrialContext';
import { getGuestAdaptiveProfile, recordGuestPracticeResult } from '@/lib/guestProgressStore';
import { getPracticeMode, getPracticeModeUrl, type PracticeMode } from '@/lib/practiceMode';
import AdaptivePracticeKeys from '@/components/practice/AdaptivePracticeKeys';
import { recordObservedPractice } from '@/lib/frontendTelemetry';

type PageStatus = 'loading' | 'ready' | 'error' | 'completed' | 'saving';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed' | 'skipped';
const SHOW_KEYBOARD_STORAGE_KEY = 'typing-show-keyboard';

export function PracticePageContent({ showHeading = true }: { showHeading?: boolean }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = toSupportedLocale(params.lang);
  const contentLanguage = toContentLanguage(lang);
  const t = useTranslations(lang);
  const { isAuthenticated, user } = useAuth();
  const isPublicTrial = usePublicTrial();
  const { setSelectedLayout, getLayoutForLanguage, isReady: isLayoutReady } = useKeyboardLayout();
  const activeLayout = getLayoutForLanguage(lang);

  const [practiceTextId, setPracticeTextId] = useState<string | null>(null);
  const [practiceText, setPracticeText] = useState('');
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const clientSessionIdRef = useRef<string | null>(null);
  const practiceMode = getPracticeMode(searchParams.get('mode'));
  const [adaptiveDetails, setAdaptiveDetails] = useState<{
    targets: { keys: string[]; bigrams: string[] };
  } | null>(null);
  const [expectedPracticeKey, setExpectedPracticeKey] = useState<string | null>(
    practiceText[0] ?? null,
  );
  const practiceHandReferences = getHandReferencesForExpectedKey(
    expectedPracticeKey,
    activeLayout.id,
  );
  const practiceGuideKeys = getKeyboardGuideKeysForExpectedKey(
    expectedPracticeKey,
    activeLayout.id,
  );

  const toggleKeyboardVisibility = useCallback(() => {
    setShowKeyboard((current) => {
      const next = !current;
      localStorage.setItem(SHOW_KEYBOARD_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const storedShowKeyboard = localStorage.getItem(SHOW_KEYBOARD_STORAGE_KEY);
    if (storedShowKeyboard !== null) {
      setShowKeyboard(storedShowKeyboard === 'true');
    }
  }, []);

  const loadText = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    setSaveStatus('idle');
    setSaveMessage(null);
    setExpectedPracticeKey(null);
    try {
      const historyScope = user?.id ? `user:${user.id}` : 'guest';
      const data =
        practiceMode === 'adaptive' && isAuthenticated
          ? await fetchAdaptivePracticeText(contentLanguage, activeLayout.id, 'words')
          : await fetchPracticeText(contentLanguage, historyScope);
      const guestProfile =
        !isAuthenticated && practiceMode === 'adaptive'
          ? getGuestAdaptiveProfile(contentLanguage, activeLayout.id)
          : { keys: [] as string[], bigrams: [] as string[] };
      const guestSourceWords: string[] = data.text.match(/[\p{L}\p{M}]+/gu) ?? [];
      const guestTargets: string[] = guestProfile.keys.length
        ? [...guestProfile.keys]
        : [...guestProfile.bigrams];
      const guestWords = guestTargets.flatMap((target) => {
        const matchingWords = guestSourceWords.filter((word) =>
          word.toLocaleLowerCase().includes(target.toLocaleLowerCase()),
        );
        if (matchingWords.length === 0) return [];

        return Array.from({ length: 3 }, (_, index) => matchingWords[index % matchingWords.length]);
      });
      if (!isAuthenticated && practiceMode === 'adaptive' && guestWords.length > 0)
        data.text = guestWords.join(' ');
      setPracticeText(data.text);
      clientSessionIdRef.current = crypto.randomUUID();
      setPracticeTextId(data.id);
      const adaptive = practiceMode === 'adaptive' && isAuthenticated ? (data as AdaptivePracticeText) : null;
      setAdaptiveDetails(
        adaptive
          ? { targets: adaptive.targets }
          : practiceMode === 'adaptive'
            ? {
                targets: guestProfile,
              }
            : null,
      );
      setExpectedPracticeKey(data.text[0] ?? null);
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('practice.general.errorLoadingText'));
      setStatus('error');
    }
  }, [activeLayout.id, contentLanguage, isAuthenticated, practiceMode, t, user?.id]);

  useEffect(() => {
    if (isLayoutReady) loadText();
  }, [isLayoutReady, loadText]);

  const handleComplete = useCallback(
    async (finalStats: TypingStats) => {
      setStats(finalStats);
      recordObservedPractice('practice_completed', {
        authState: isAuthenticated ? 'authenticated' : 'anonymous', language: contentLanguage, layout: activeLayout.id,
      });
      if (!isAuthenticated) {
        recordGuestPracticeResult({
          netWpm: Math.round(finalStats.netWpm),
          grossWpm: Math.round(finalStats.grossWpm),
          accuracy: finalStats.accuracy,
          timeElapsed: finalStats.timeElapsed,
          language: contentLanguage,
          locale: lang,
          layoutId: activeLayout.id,
          errorSummary: buildErrorSummary(finalStats.keystrokes),
          telemetry: finalStats.telemetry,
        });
        setSaveStatus('skipped');
        setSaveMessage(null);
        setStatus('completed');
        return;
      }
      setStatus('saving');
      setSaveStatus('saving');
      setSaveMessage(null);
      try {
        await savePracticeResult({
          netWpm: Math.round(finalStats.netWpm),
          grossWpm: Math.round(finalStats.grossWpm),
          accuracy: finalStats.accuracy,
          timeElapsed: finalStats.timeElapsed,
          language: contentLanguage,
          locale: lang,
          layoutId: activeLayout.id,
          textId: practiceTextId ?? undefined,
          errorSummary: buildErrorSummary(finalStats.keystrokes),
          telemetry: finalStats.telemetry,
          clientSessionId: clientSessionIdRef.current ?? undefined,
        });
        setSaveStatus('saved');
        setStatus('completed');
      } catch {
        setSaveStatus('failed');
        setSaveMessage(t('practice.general.errorSavingResult'));
        setStatus('completed');
      }
    },
    [activeLayout.id, contentLanguage, isAuthenticated, lang, practiceTextId, t],
  );

  const handleNewText = () => {
    setStats(null);
    setSaveStatus('idle');
    setSaveMessage(null);
    loadText();
  };

  const selectPracticeMode = (mode: PracticeMode) => {
    router.replace(getPracticeModeUrl(pathname, searchParams.toString(), mode), { scroll: false });
    setStats(null);
  };

  const handleRetry = () => {
    setStats(null);
    setSaveStatus('idle');
    setSaveMessage(null);
    setStatus('ready');
  };

  const cardClasses =
    'bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none rounded-xl border border-(--border-card) p-6';
  const isAdaptivePractice = practiceMode === 'adaptive';
  const practiceHeading = showHeading ? (
    <div>
      <h1 className="text-2xl font-bold text-(--accent-blue)">
        {t(isAdaptivePractice ? 'practice.general.adaptiveTitle' : 'practice.general.freeTitle')}
      </h1>
      <p className="text-(--text-secondary) light:text-(--page-subtitle-light-color) mt-1">
        {t(isAdaptivePractice ? 'practice.general.adaptiveSubtitle' : 'practice.general.freeSubtitle')}
      </p>
    </div>
  ) : null;

  if (!isLayoutReady) {
    return (
      <DashboardBackground>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          {practiceHeading}
          <div className={`${cardClasses} animate-pulse`}>
            <div className="h-8 bg-(--bg-secondary) rounded w-3/4 mb-4" />
            <div className="h-4 bg-(--bg-secondary) rounded w-full mb-2" />
            <div className="h-4 bg-(--bg-secondary) rounded w-5/6" />
          </div>
        </div>
      </DashboardBackground>
    );
  }

  if (status === 'loading') {
    return (
      <DashboardBackground>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          {practiceHeading}
          <div className={cardClasses}>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
              <span className="ml-3 text-(--text-secondary)">
                {t('practice.general.loadingText')}
              </span>
            </div>
          </div>
        </div>
      </DashboardBackground>
    );
  }

  if (status === 'error') {
    return (
      <DashboardBackground>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          {practiceHeading}
          <div className={cardClasses}>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <WifiOff className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
                {t('practice.general.errorTitle')}
              </h3>
              <p className="text-(--text-secondary) mb-6 max-w-md">{errorMessage}</p>
              <Button variant="primary" onClick={loadText}>
                <RefreshCw size={16} className="mr-2" />
                {t('practice.general.retry')}
              </Button>
            </div>
          </div>
        </div>
      </DashboardBackground>
    );
  }

  if (status === 'completed' && stats) {
    return (
      <DashboardBackground>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          {practiceHeading}
          <div className={cardClasses}>
            {saveStatus === 'failed' && saveMessage && (
              <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-300 text-sm font-medium">
                    {t('practice.general.saveWarning')}
                  </p>
                  <p className="text-yellow-200/70 text-sm mt-1">{saveMessage}</p>
                </div>
              </div>
            )}
            <Results
              stats={stats}
              lessonTitle={t('practice.general.session')}
              onRetry={handleRetry}
              onNext={handleNewText}
              isLastLesson={false}
              mode="practice"
              newTextLabel={t('practice.general.newText')}
              backLabel={
                isPublicTrial ? t('courses.general.title') : t('practice.general.backToDashboard')
              }
            />
          </div>
        </div>
      </DashboardBackground>
    );
  }

  return (
    <DashboardBackground>
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        {practiceHeading}
        <div className={cardClasses}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex flex-wrap gap-2 text-sm" role="tablist" aria-label={t('practice.general.title')}>
              <button
                type="button"
                role="tab"
                aria-selected={practiceMode === 'free'}
                onClick={() => selectPracticeMode('free')}
                className={`rounded-lg border px-4 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-blue) ${practiceMode === 'free' ? 'border-(--accent-blue-border) bg-(--accent-blue-bg) text-(--accent-blue)' : 'border-(--border-card) bg-(--bg-secondary) text-(--text-primary) hover:bg-(--bg-card-hover) light:bg-[#475569] light:text-(--text-inverse) light:hover:bg-[#3f4f65]'}`}
              >
                {t('practice.general.modeRandom')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={practiceMode === 'adaptive'}
                onClick={() => selectPracticeMode('adaptive')}
                className={`rounded-lg border px-4 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-blue) ${practiceMode === 'adaptive' ? 'border-(--accent-blue-border) bg-(--accent-blue-bg) text-(--accent-blue)' : 'border-(--border-card) bg-(--bg-secondary) text-(--text-primary) hover:bg-(--bg-card-hover) light:bg-[#475569] light:text-(--text-inverse) light:hover:bg-[#3f4f65]'}`}
              >
                {t('practice.general.modeWords')}
              </button>
            </div>
            {practiceMode === 'adaptive' && adaptiveDetails && (
              <AdaptivePracticeKeys
                keys={adaptiveDetails.targets.keys}
                label={t('practice.general.adaptivePracticeKeys')}
              />
            )}
          </div>
          <div className="flex items-center mb-2">
            {status === 'saving' && (
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />
                <span>{t('practice.general.saving')}</span>
              </div>
            )}
          </div>

          <TypingArea
            text={practiceText}
            onComplete={handleComplete}
            onExpectedKeyChange={setExpectedPracticeKey}
            selectedLayout={activeLayout}
            onLayoutChange={setSelectedLayout}
            onNewText={handleNewText}
            newTextLabel={t('practice.general.newText')}
          />

          <div className="mt-4 flex items-center gap-3">
            <KeyboardIcon
              size={18}
              className="text-blue-400 light:text-(--lesson-card-time-stat-value-light-color)"
              aria-hidden="true"
            />
            <button
              onMouseDown={(event) => event.preventDefault()}
              onClick={toggleKeyboardVisibility}
              type="button"
              role="switch"
              aria-checked={showKeyboard}
              title={
                showKeyboard
                  ? t('lessonid.general.hideKeyboard')
                  : t('lessonid.general.showKeyboard')
              }
              aria-label={
                showKeyboard
                  ? t('lessonid.general.hideKeyboard')
                  : t('lessonid.general.showKeyboard')
              }
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showKeyboard ? 'bg-(--accent-blue) light:bg-(--lesson-card-time-stat-value-light-color)' : 'bg-(--text-tertiary)'}`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-(--text-inverse) transition-transform ${showKeyboard ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {showKeyboard && (
            <div className="mt-4">
              <KeyboardView
                layoutId={activeLayout.id}
                activeKeys={practiceGuideKeys}
                guideKeys={practiceGuideKeys}
                leftHandSrc={practiceHandReferences.left}
                rightHandSrc={practiceHandReferences.right}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardBackground>
  );
}

export default function Page() {
  return <PracticePageContent />;
}
