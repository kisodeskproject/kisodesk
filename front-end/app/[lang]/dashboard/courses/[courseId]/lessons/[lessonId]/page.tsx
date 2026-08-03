// app/[lang]/dashboard/courses/[courseId]/lessons/[lessonId]/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Keyboard as KeyboardIcon, Volume2 } from 'lucide-react';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { toContentLanguage } from '@/lib/locales';
import { useAuth } from '@/hooks/useAuth';
import { useLesson } from '@/hooks/useLesson';
import { useLessonPractice } from '@/contexts/LessonPracticeContext';
import TypingArea, { TypingStats } from '@/components/lessons/TypingArea';
import KeyboardView from '@/components/lessons/Keyboard';
import Results from '@/components/lessons/Results';
import Button from '@/components/ui/Button';
import DashboardBackground from '@/components/layout/DashboardBackground';
import { useKeyboardLayout } from '@/hooks/useKeyboardLayout';
import { buildErrorSummary } from '@/lib/errorSummary';
import { isLowTypingResult } from '@/lib/typingResultQuality';
import { resolveCharacterToPhysicalKey } from '@/lib/keyMappings';
import { getPhysicalKeyIdForCode, type PhysicalKeyId } from '@/lib/keyboardPhysical';
import {
  getHandReferencesForExpectedKey,
  getKeyboardGuideKeysForExpectedKey,
  getNextPendingTargetKey,
} from '@/lib/handSvg';
import type { LessonProgressResult } from '@/types';
import { usePublicTrial } from '@/contexts/PublicTrialContext';
import { recordGuestLessonProgress } from '@/lib/guestProgressStore';
import { useLessonAudio } from '@/hooks/useLessonAudio';

const CORRECT_FLASH_MS = 150;
const INCORRECT_FLASH_MS = 150;
const SHOW_KEYBOARD_STORAGE_KEY = 'typing-show-keyboard';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed' | 'skipped';
type MatchingFeedback = 'selectEnglish' | 'incorrect' | 'correct' | 'complete' | null;
type InteractionFeedback = 'correct' | 'incorrect' | null;

const EXPERIMENTAL_INTERACTION_TYPES = new Set([
  'fill-blank',
  'type-choice',
  'correct-word',
  'correct-sentence',
  'word-order',
  'word-build',
  'listen-choice',
  'dictation',
  'dialogue-choice',
  'branching-dialogue',
  'mini-review',
]);

const MANUAL_AUDIO_INTERACTION_TYPES = new Set([
  'listening',
  'dialogue',
  'listen-choice',
  'dictation',
  'dialogue-choice',
  'branching-dialogue',
]);

function ExperimentalLessonHeader({
  title,
  instruction,
  position,
  currentStep,
  totalSteps,
  unitProgressLabel,
  stepLabel,
}: {
  title: string;
  instruction?: string;
  position: string;
  currentStep: number;
  totalSteps: number;
  unitProgressLabel: string;
  stepLabel: (step: number, isCurrent: boolean) => string;
}) {
  const visualStep = Math.max(1, Math.ceil((currentStep / Math.max(totalSteps, 1)) * 4));
  return (
    <header className="mb-6 border-b border-(--border-card) pb-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold text-(--accent-blue) light:text-(--lesson-card-time-stat-value-light-color)">
          {position}
        </p>
        <ol className="flex items-center gap-1.5" aria-label={unitProgressLabel}>
          {Array.from({ length: 4 }, (_, index) => {
            const step = index + 1;
            return (
              <li
                key={step}
                className={`h-2.5 w-2.5 rounded-full ${
                  step <= visualStep ? 'bg-(--accent-blue)' : 'bg-(--border-card)'
                }`}
                aria-label={stepLabel(step, step === visualStep)}
                aria-current={step === visualStep ? 'step' : undefined}
              />
            );
          })}
        </ol>
      </div>
      <h1 className="mt-2 text-2xl font-bold text-(--text-primary)">{title}</h1>
      {instruction ? <p className="mt-2 max-w-2xl text-(--text-secondary)">{instruction}</p> : null}
    </header>
  );
}

export default function LessonPracticePage() {
  const params = useParams();
  const router = useRouter();
  const lang = toSupportedLocale(params.lang);
  const courseSlug = params.courseId as string;
  const lessonSlug = params.lessonId as string;
  const t = useTranslations(lang);
  const { isAuthenticated } = useAuth();
  const isPublicTrial = usePublicTrial();
  const { saveResult } = useLesson();
  const { setSelectedLayout, getLayoutForLanguage, isReady: isLayoutReady } = useKeyboardLayout();
  const activeLayout = getLayoutForLanguage(lang);

  const {
    lessons,
    currentIndex,
    currentLesson,
    isLast,
    loading,
    error,
    goToNext,
    goToIndex,
    loadLessons,
  } = useLessonPractice();
  const currentCourseSlug = currentLesson?.courseSlug ?? courseSlug;
  const coursesPath = `/${lang}/${isPublicTrial ? 'courses' : 'dashboard/courses'}`;

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!lessons.length && courseSlug && !initializedRef.current) {
      initializedRef.current = true;
      loadLessons(courseSlug);
    }
  }, [courseSlug, lessons.length, loadLessons]);

  useEffect(() => {
    if (lessons.length > 0) {
      const idx = lessons.findIndex((l) => l.slug === lessonSlug || l.id === lessonSlug);
      if (idx !== -1 && idx !== currentIndex) {
        goToIndex(idx);
      }
    }
  }, [lessons, lessonSlug, currentIndex, goToIndex]);

  const updateUrl = useCallback(
    (newCourseSlug: string, newLessonSlug: string) => {
      router.replace(
        `/${lang}/${isPublicTrial ? 'courses' : 'dashboard/courses'}/${newCourseSlug}/lessons/${newLessonSlug}`,
        {
          scroll: false,
        },
      );
    },
    [router, lang, isPublicTrial],
  );

  const [stats, setStats] = useState<TypingStats | null>(null);
  const [progressResult, setProgressResult] = useState<LessonProgressResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [matchingFeedback, setMatchingFeedback] = useState<MatchingFeedback>(null);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [interactionInput, setInteractionInput] = useState('');
  const [interactionSelection, setInteractionSelection] = useState<string | null>(null);
  const [interactionParts, setInteractionParts] = useState<string[]>([]);
  const [interactionFeedback, setInteractionFeedback] = useState<InteractionFeedback>(null);
  const [branchTurn, setBranchTurn] = useState(0);
  const [reviewStep, setReviewStep] = useState(0);
  const [expectedPracticeKey, setExpectedPracticeKey] = useState<string | null>(
    currentLesson?.text?.[0] ?? null,
  );

  const [pressedExplanatoryKeys, setPressedExplanatoryKeys] = useState<string[]>([]);
  const [correctFlashKeys, setCorrectFlashKeys] = useState<PhysicalKeyId[]>([]);
  const [incorrectFlashKeys, setIncorrectFlashKeys] = useState<PhysicalKeyId[]>([]);
  const [completedExplanatoryLessonId, setCompletedExplanatoryLessonId] = useState<string | null>(
    null,
  );
  const explanatoryNavigationRef = useRef<string | null>(null);
  const usesManualAudio = MANUAL_AUDIO_INTERACTION_TYPES.has(currentLesson?.mediaUrl ?? '');
  const {
    activeAudioUrlRef,
    audioRef,
    audioWarning,
    clearPlaybackWarning,
    handleAudioError,
    updateAudioVolumeWarning,
  } = useLessonAudio(currentLesson?.audioUrl, { autoPlay: !usesManualAudio });

  useEffect(() => {
    setStats(null);
    setProgressResult(null);
    setSaveStatus('idle');
    setSaveMessage(null);
    setIsCompleted(false);
    setRetryKey(0);
    setExpectedPracticeKey(currentLesson?.text?.[0] ?? null);
    setPressedExplanatoryKeys([]);
    setCorrectFlashKeys([]);
    setIncorrectFlashKeys([]);
    setCompletedExplanatoryLessonId(null);
    setSelectedMatch(null);
    setMatchedPairs([]);
    setMatchingFeedback(null);
    setHasStartedAudio(false);
    setInteractionInput('');
    setInteractionSelection(null);
    setInteractionParts([]);
    setInteractionFeedback(null);
    setBranchTurn(0);
    setReviewStep(0);
    explanatoryNavigationRef.current = null;
  }, [currentLesson?.id, currentLesson?.text]);

  const handleLessonAudioPlay = useCallback(() => {
    const audioUrl = currentLesson?.audioUrl;
    if (!audioUrl || activeAudioUrlRef.current !== audioUrl) {
      audioRef.current?.pause();
      return;
    }
    if (usesManualAudio) {
      setHasStartedAudio(true);
    }
    updateAudioVolumeWarning();
    clearPlaybackWarning();
  }, [
    activeAudioUrlRef,
    audioRef,
    clearPlaybackWarning,
    currentLesson?.audioUrl,
    updateAudioVolumeWarning,
    usesManualAudio,
  ]);

  const playManualAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (hasStartedAudio) audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [audioRef, hasStartedAudio]);

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

  const handlePracticeComplete = async (finalStats: TypingStats) => {
    setStats(finalStats);
    setIsCompleted(true);
    setSaveMessage(null);

    if (!isAuthenticated && currentLesson) {
      recordGuestLessonProgress({
        courseId: currentCourseSlug,
        lessonId: currentLesson.id,
        language: toContentLanguage(lang),
        locale: toSupportedLocale(lang),
        bestNetWpm: finalStats.netWpm,
        bestGrossWpm: finalStats.grossWpm,
        bestScore: finalStats.score,
        bestAccuracy: finalStats.accuracy,
        timeElapsed: finalStats.timeElapsed,
      });
      setSaveStatus('skipped');
      return;
    }

    if (isLowTypingResult(finalStats)) {
      setSaveStatus('skipped');
      return;
    }

    setSaveStatus('saving');

    if (currentLesson) {
      const focusKeys = new Set(
        (currentLesson.focusKeys ?? []).map((key) => key.toLocaleLowerCase('es')),
      );
      const targetKeyErrors = (finalStats.keystrokes ?? []).filter((keystroke) => {
        const expected = keystroke.expected.toLocaleLowerCase('es');
        return (
          focusKeys.has(expected) && (!keystroke.correct || keystroke.techniqueCorrect === false)
        );
      }).length;
      const errorSummary = buildErrorSummary(finalStats.keystrokes);

      try {
        const savedProgress = await saveResult({
          lessonId: currentLesson.id,
          grossWpm: finalStats.grossWpm,
          netWpm: finalStats.netWpm,
          accuracy: finalStats.accuracy,
          timeElapsed: finalStats.timeElapsed,
          targetKeyErrors,
          usedAssistance: showKeyboard,
          errorSummary,
          locale: toSupportedLocale(lang),
        });
        setProgressResult(savedProgress);
        setSaveStatus(savedProgress ? 'saved' : 'failed');
        if (!savedProgress) {
          setSaveMessage(t('lessonid.general.saveErrorMessage'));
        }
      } catch {
        setSaveStatus('failed');
        setSaveMessage(t('lessonid.general.saveErrorMessage'));
      }
    }
  };

  const handleRetry = () => {
    setIsCompleted(false);
    setStats(null);
    setProgressResult(null);
    setSaveStatus('idle');
    setSaveMessage(null);
    setRetryKey((prev) => prev + 1);
  };

  const handleNext = async () => {
    if (isAuthenticated) {
      await loadLessons(courseSlug);
    }

    if (!isLast) {
      const nextIndex = currentIndex + 1;
      const nextLesson = lessons[nextIndex];
      if (nextLesson) {
        updateUrl(nextLesson.courseSlug ?? courseSlug, nextLesson.slug);
        goToNext();
      }
    } else {
      router.push(coursesPath);
    }
  };

  const targetKeysRef = useRef<string[]>([]);
  const completedExplanatoryRef = useRef<string | null>(null);

  useEffect(() => {
    targetKeysRef.current = currentLesson?.targetKeys ?? [];
  }, [currentLesson?.targetKeys]);

  useEffect(() => {
    completedExplanatoryRef.current = completedExplanatoryLessonId;
  }, [completedExplanatoryLessonId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (completedExplanatoryRef.current) return;
      const physicalKeyId = getPhysicalKeyIdForCode(e.code);
      if (!physicalKeyId) return;
      const targets = targetKeysRef.current;
      const matchedTarget = targets.find(
        (target) => resolveCharacterToPhysicalKey(target, activeLayout)?.physicalKeyId === physicalKeyId,
      );
      if (matchedTarget) {
        setPressedExplanatoryKeys((prev) =>
          prev.includes(matchedTarget) ? prev : [...prev, matchedTarget],
        );
        setCorrectFlashKeys((prev) => (prev.includes(physicalKeyId) ? prev : [...prev, physicalKeyId]));
        setTimeout(() => {
          setCorrectFlashKeys((prev) => prev.filter((key) => key !== physicalKeyId));
        }, CORRECT_FLASH_MS);
      } else {
        setIncorrectFlashKeys((prev) => (prev.includes(physicalKeyId) ? prev : [...prev, physicalKeyId]));
        setTimeout(() => {
          setIncorrectFlashKeys((prev) => prev.filter((key) => key !== physicalKeyId));
        }, INCORRECT_FLASH_MS);
      }
    },
    [activeLayout],
  );

  useEffect(() => {
    if (currentLesson?.type !== 'explanatory') return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLesson?.type, handleKeyDown]);

  useEffect(() => {
    if (
      currentLesson?.type !== 'explanatory' ||
      completedExplanatoryLessonId === currentLesson.id
    ) {
      return;
    }
    const targets = targetKeysRef.current;
    if (targets.length === 0) return;
    if (targets.every((k) => pressedExplanatoryKeys.includes(k))) {
      setCompletedExplanatoryLessonId(currentLesson.id);
    }
  }, [
    pressedExplanatoryKeys,
    currentLesson?.id,
    currentLesson?.type,
    completedExplanatoryLessonId,
  ]);

  const handleExplanatoryComplete = useCallback(
    async (lessonId: string) => {
      const completedIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
      const completedLesson = lessons[completedIndex];
      if (
        completedIndex === -1 ||
        completedLesson.type !== 'explanatory' ||
        explanatoryNavigationRef.current === lessonId
      ) {
        return;
      }

      explanatoryNavigationRef.current = lessonId;
      let saved = true;
      if (isAuthenticated) {
        try {
          const result = await saveResult({
            lessonId,
            completed: true,
            locale: toSupportedLocale(lang),
          });
          saved = Boolean(result);
          if (saved) {
            await loadLessons(courseSlug);
          }
        } catch (err) {
          saved = false;
          console.error('Error saving explanatory lesson:', err);
        }
      } else {
        recordGuestLessonProgress({
          courseId: currentCourseSlug,
          lessonId,
          language: toContentLanguage(lang),
          locale: toSupportedLocale(lang),
        });
      }
      if (!saved) {
        explanatoryNavigationRef.current = null;
        setPressedExplanatoryKeys([]);
        setCompletedExplanatoryLessonId(null);
        return;
      }

      const nextIndex = completedIndex + 1;
      const nextLesson = lessons[nextIndex];
      if (nextLesson) {
        updateUrl(nextLesson.courseSlug ?? courseSlug, nextLesson.slug);
        goToIndex(nextIndex);
      } else {
        router.push(coursesPath);
      }
    },
    [
      lessons,
      lang,
      isAuthenticated,
      saveResult,
      loadLessons,
      courseSlug,
      updateUrl,
      goToIndex,
      router,
      currentCourseSlug,
      coursesPath,
    ],
  );

  useEffect(() => {
    if (
      completedExplanatoryLessonId &&
      currentLesson?.type === 'explanatory' &&
      currentLesson.id === completedExplanatoryLessonId
    ) {
      void handleExplanatoryComplete(completedExplanatoryLessonId);
    }
  }, [completedExplanatoryLessonId, currentLesson, handleExplanatoryComplete]);

  const breadcrumb = (
    <div className="flex items-center gap-2 text-xl font-semibold">
      <Link
        href={coursesPath}
        className="text-(--text-secondary) light:text-(--lesson-light-heading-text) transition-colors hover:text-(--text-primary)"
      >
        {t('courses.general.title')}
      </Link>
      <span className="text-(--text-tertiary)">&gt;</span>
      <Link
        href={`${coursesPath}/${currentCourseSlug}/lessons`}
        className="text-(--text-secondary) light:text-(--lesson-light-heading-text) transition-colors hover:text-(--text-primary)"
      >
        {t('lessons.general.title')}
      </Link>
    </div>
  );

  if (loading || !isLayoutReady || (!currentLesson && !error && !initializedRef.current)) {
    return (
      <DashboardBackground>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          {breadcrumb}
          <div className="bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none rounded-xl border border-(--border-card) p-6">
            <h1 className="mb-5 text-2xl font-semibold text-(--text-primary) light:text-(--lesson-light-heading-text)">
              {t('lessonid.general.typeTheTextBelow')}
            </h1>
            <div className="space-y-3" aria-hidden="true">
              <div className="h-8 w-full rounded bg-(--bg-secondary)" />
              <div className="h-8 w-11/12 rounded bg-(--bg-secondary)" />
              <div className="h-8 w-4/5 rounded bg-(--bg-secondary)" />
            </div>
            <div className="mt-8 h-44 rounded-xl border border-(--border-card) bg-(--bg-secondary)" />
          </div>
        </div>
      </DashboardBackground>
    );
  }

  if (error) {
    return (
      <DashboardBackground>
        <div className="text-center py-12">
          <div
            className="inline-block rounded-lg border border-(--accent-red-border) bg-(--accent-red-bg) p-4"
            role="alert"
          >
            <p className="mb-4 text-(--accent-red)">{error}</p>
            <Button onClick={() => router.push(`${coursesPath}/${currentCourseSlug}/lessons`)}>
              {t('lessonid.general.backToLessons')}
            </Button>
          </div>
        </div>
      </DashboardBackground>
    );
  }

  if (!currentLesson) {
    return (
      <DashboardBackground>
        <div className="text-center py-12">
          <div className="bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none rounded-xl border border-(--border-card) p-8 inline-block">
            <h2 className="text-xl font-semibold text-(--text-primary) mb-4">
              {t('lessonid.general.lessonNotFound')}
            </h2>
            <Button onClick={() => router.push(`${coursesPath}/${currentCourseSlug}/lessons`)}>
              {t('lessonid.general.backToLessons')}
            </Button>
          </div>
        </div>
      </DashboardBackground>
    );
  }

  if (currentLesson.isLocked) {
    return (
      <DashboardBackground>
        <div className="mx-auto max-w-2xl rounded-2xl border border-(--border-card) bg-(--bg-card) p-8 text-center">
          <h2 className="text-xl font-semibold text-(--text-primary)">
            {t('lessonid.general.lockedLesson')}
          </h2>
          <p className="mt-2 text-(--text-secondary)">
            {t('lessonid.general.lockedLessonDescription')}
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push(`${coursesPath}/${currentCourseSlug}/lessons`)}
          >
            {t('lessonid.general.backToLessons')}
          </Button>
        </div>
      </DashboardBackground>
    );
  }

  const isExperimentalGreetingsUnit = currentCourseSlug === 'english-foundations-a1-a2';
  const experimentalLessonPosition = t('lessonid.general.experimentalGreetings.lessonPosition', {
    current: currentIndex + 1,
    total: lessons.length,
  });

  if (currentLesson.type === 'explanatory') {
    if (currentLesson.mediaUrl === 'listening') {
      return (
        <DashboardBackground>
          <div className="mx-auto max-w-3xl space-y-6 p-6">
            {breadcrumb}
            <section className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-6">
              <ExperimentalLessonHeader
                title={currentLesson.title}
                instruction={currentLesson.instructions}
                position={experimentalLessonPosition}
                currentStep={currentIndex + 1}
                totalSteps={lessons.length}
                unitProgressLabel={t('lessonid.general.interactions.unitProgress')}
                stepLabel={(step, isCurrent) =>
                  t('lessonid.general.interactions.stepProgress', {
                    step,
                    current: isCurrent ? t('lessonid.general.interactions.currentStep') : '',
                  })
                }
              />

              <section
                className="rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4"
                aria-labelledby="listening-audio-title"
              >
                <p
                  id="listening-audio-title"
                  className="mb-3 text-sm font-semibold text-(--text-primary)"
                >
                  {t('lessonid.general.audioGuide')}
                </p>
                {audioWarning ? (
                  <p
                    className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
                    role="status"
                  >
                    {t(`lessonid.general.audioWarning.`)}
                  </p>
                ) : null}
                {currentLesson.audioUrl ? (
                  <>
                    <Button
                      size="lg"
                      icon={<Volume2 aria-hidden="true" />}
                      onClick={playManualAudio}
                    >
                      {hasStartedAudio
                        ? t('lessonid.general.manualAudioReplay')
                        : t('lessonid.general.manualAudioPlay')}
                    </Button>
                    <audio
                      key={`${currentLesson.id}-${currentLesson.audioUrl}`}
                      ref={audioRef}
                      className="sr-only"
                      preload="metadata"
                      src={currentLesson.audioUrl}
                      onContextMenu={(event) => event.preventDefault()}
                      onVolumeChange={updateAudioVolumeWarning}
                      onPlay={handleLessonAudioPlay}
                      onError={handleAudioError}
                    >
                      {t('lessonid.general.audioUnsupported')}
                    </audio>
                  </>
                ) : null}
              </section>

              <div className="mt-5">
                <p className="text-sm font-semibold text-(--text-primary)">
                  {t('lessonid.general.experimentalGreetings.supportContent')}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {['hello', 'good morning'].map((expression) => (
                    <div
                      key={expression}
                      className="rounded-xl border border-(--accent-blue-border) bg-(--accent-blue-bg) px-5 py-4 text-xl font-semibold text-(--text-primary)"
                    >
                      {expression}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="mt-6"
                disabled={!hasStartedAudio}
                onClick={() => void handleExplanatoryComplete(currentLesson.id)}
              >
                {t('lessonid.general.experimentalGreetings.continue')}
              </Button>
            </section>
          </div>
        </DashboardBackground>
      );
    }

    if (currentLesson.mediaUrl === 'matching') {
      const pairs = (currentLesson.targetKeys ?? []).map((item) => {
        const [english, spanish] = item.split('|');
        return { english, spanish };
      });
      const spanishOptions = [...pairs.map((pair) => pair.spanish)].reverse();
      const selectMeaning = (spanish: string) => {
        if (!selectedMatch) {
          setMatchingFeedback('selectEnglish');
          return;
        }
        const pair = pairs.find((item) => item.english === selectedMatch);
        if (pair?.spanish !== spanish) {
          setSelectedMatch(null);
          setMatchingFeedback('incorrect');
          return;
        }
        const nextMatchedPairs = [...matchedPairs, selectedMatch];
        setMatchedPairs(nextMatchedPairs);
        setSelectedMatch(null);
        setMatchingFeedback(nextMatchedPairs.length === pairs.length ? 'complete' : 'correct');
      };
      const complete = matchedPairs.length === pairs.length;
      const feedbackText = matchingFeedback
        ? t(
            matchingFeedback === 'selectEnglish'
              ? 'lessonid.general.experimentalGreetings.selectEnglishFirst'
              : matchingFeedback === 'incorrect'
                ? 'lessonid.general.experimentalGreetings.tryAgain'
                : matchingFeedback === 'correct'
                  ? 'lessonid.general.experimentalGreetings.correct'
                  : 'lessonid.general.experimentalGreetings.complete',
          )
        : null;
      return (
        <DashboardBackground>
          <div className="mx-auto max-w-3xl space-y-6 p-6">
            {breadcrumb}
            <section className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-6">
              <ExperimentalLessonHeader
                title={currentLesson.title}
                instruction={currentLesson.instructions}
                position={experimentalLessonPosition}
                currentStep={currentIndex + 1}
                totalSteps={lessons.length}
                unitProgressLabel={t('lessonid.general.interactions.unitProgress')}
                stepLabel={(step, isCurrent) =>
                  t('lessonid.general.interactions.stepProgress', {
                    step,
                    current: isCurrent ? t('lessonid.general.interactions.currentStep') : '',
                  })
                }
              />
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-secondary)">
                    {t('lessonid.general.experimentalGreetings.englishColumn')}
                  </h2>
                  {pairs.map((pair) => {
                    const isMatched = matchedPairs.includes(pair.english);
                    return (
                      <Button
                        key={pair.english}
                        className={
                          isMatched
                            ? 'min-h-12 justify-between border border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'min-h-12 justify-between'
                        }
                        variant={
                          isMatched
                            ? 'outline'
                            : selectedMatch === pair.english
                              ? 'primary'
                              : 'secondary'
                        }
                        fullWidth
                        disabled={isMatched}
                        aria-label={pair.english}
                        aria-pressed={selectedMatch === pair.english}
                        onClick={() => {
                          setSelectedMatch(pair.english);
                          setMatchingFeedback(null);
                        }}
                      >
                        <span>{pair.english}</span>
                        {isMatched ? <span aria-hidden="true">✓</span> : null}
                      </Button>
                    );
                  })}
                </div>
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-secondary)">
                    {t('lessonid.general.experimentalGreetings.spanishColumn')}
                  </h2>
                  {spanishOptions.map((spanish) => {
                    const english = pairs.find((pair) => pair.spanish === spanish)?.english;
                    const isMatched = english ? matchedPairs.includes(english) : false;
                    return (
                      <Button
                        key={spanish}
                        className={
                          isMatched
                            ? 'min-h-12 justify-between border border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'min-h-12 justify-between'
                        }
                        variant={isMatched ? 'outline' : 'secondary'}
                        fullWidth
                        disabled={isMatched}
                        aria-label={spanish}
                        onClick={() => selectMeaning(spanish)}
                      >
                        <span>{spanish}</span>
                        {isMatched ? <span aria-hidden="true">✓</span> : null}
                      </Button>
                    );
                  })}
                </div>
              </div>
              {matchedPairs.length > 0 ? (
                <section
                  className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4"
                  aria-labelledby="completed-pairs-title"
                >
                  <h2
                    id="completed-pairs-title"
                    className="text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                  >
                    {t('lessonid.general.interactions.completedPairs')}
                  </h2>
                  <ul className="mt-2 space-y-1 text-sm font-medium text-(--text-primary)">
                    {matchedPairs.map((english) => {
                      const pair = pairs.find((item) => item.english === english);
                      return pair ? (
                        <li key={english}>{`${pair.english} → ${pair.spanish} ✓`}</li>
                      ) : null;
                    })}
                  </ul>
                </section>
              ) : null}
              {feedbackText ? (
                <p
                  className={`mt-5 rounded-lg px-3 py-2 text-sm font-semibold ${
                    matchingFeedback === 'incorrect' || matchingFeedback === 'selectEnglish'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  }`}
                  role="status"
                >
                  {feedbackText}
                </p>
              ) : null}
              {complete ? (
                <Button
                  className="mt-6"
                  onClick={() => void handleExplanatoryComplete(currentLesson.id)}
                >
                  {t('lessonid.general.experimentalGreetings.continue')}
                </Button>
              ) : null}
            </section>
          </div>
        </DashboardBackground>
      );
    }

    if (EXPERIMENTAL_INTERACTION_TYPES.has(currentLesson.mediaUrl ?? '')) {
      const interactionType = currentLesson.mediaUrl ?? '';
      const targetKeys = currentLesson.targetKeys ?? [];
      const isWriting = [
        'fill-blank',
        'type-choice',
        'correct-word',
        'correct-sentence',
        'dictation',
      ].includes(interactionType);
      const isBuild = interactionType === 'word-order' || interactionType === 'word-build';
      const isReview = interactionType === 'mini-review';
      const answer = isBuild ? currentLesson.text : (targetKeys[0] ?? currentLesson.text);
      const reviewAnswers = ['morning', 'good morning', 'Good morning'];
      const reviewAnswer = reviewAnswers[reviewStep] ?? reviewAnswers[0];
      const expectedAnswer = isReview ? reviewAnswer : answer;
      const visibleChoices =
        interactionType === 'type-choice'
          ? targetKeys
          : interactionType === 'listen-choice'
            ? currentLesson.text.split('|')
            : interactionType === 'dialogue-choice'
              ? (targetKeys[0] ?? '').split('|')
              : isReview && reviewStep === 1
                ? ['good morning', 'goodbye', 'hello']
                : [];
      const parts =
        interactionType === 'word-order'
          ? targetKeys
          : interactionType === 'word-build'
            ? targetKeys
            : isReview && reviewStep === 2
              ? ['morning', 'Good']
              : [];
      const branchChoices = (targetKeys[branchTurn] ?? '').split('|');
      const correctBranchChoice = branchChoices[0];
      const correctText =
        interactionType === 'correct-word'
          ? t('lessonid.general.interactions.spellingFeedback')
          : interactionType === 'correct-sentence'
            ? t('lessonid.general.interactions.sentenceFeedback')
            : interactionType === 'dictation'
              ? t('lessonid.general.interactions.dictationFeedback')
              : t('lessonid.general.interactions.correctAnswer');
      const showFeedback = (correct: boolean) => {
        setInteractionFeedback(correct ? 'correct' : 'incorrect');
      };
      const checkWrittenAnswer = () => {
        showFeedback(interactionInput === expectedAnswer);
      };
      const checkSelection = () => {
        showFeedback(interactionSelection === expectedAnswer);
      };
      const checkParts = () => {
        showFeedback(
          interactionParts.join(interactionType === 'word-build' ? '' : ' ') === expectedAnswer,
        );
      };
      const addPart = (part: string) => {
        setInteractionParts((current) => [...current, part]);
        setInteractionFeedback(null);
      };
      const removeLastPart = () => {
        setInteractionParts((current) => current.slice(0, -1));
        setInteractionFeedback(null);
      };
      const chooseBranch = () => {
        if (interactionSelection !== correctBranchChoice) {
          showFeedback(false);
          return;
        }
        if (branchTurn < targetKeys.length - 1) {
          setBranchTurn((turn) => turn + 1);
          setInteractionSelection(null);
          setInteractionFeedback(null);
          return;
        }
        showFeedback(true);
      };
      const advanceReview = () => {
        if (reviewStep < 2) {
          setReviewStep((step) => step + 1);
          setInteractionInput('');
          setInteractionSelection(null);
          setInteractionParts([]);
          setInteractionFeedback(null);
          return;
        }
        void handleExplanatoryComplete(currentLesson.id);
      };

      return (
        <DashboardBackground>
          <div className="mx-auto max-w-3xl space-y-6 p-6">
            {breadcrumb}
            <section className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-6">
              <ExperimentalLessonHeader
                title={currentLesson.title}
                instruction={currentLesson.instructions}
                position={experimentalLessonPosition}
                currentStep={currentIndex + 1}
                totalSteps={lessons.length}
                unitProgressLabel={t('lessonid.general.interactions.unitProgress')}
                stepLabel={(step, isCurrent) =>
                  t('lessonid.general.interactions.stepProgress', {
                    step,
                    current: isCurrent ? t('lessonid.general.interactions.currentStep') : '',
                  })
                }
              />

              {currentLesson.audioUrl ? (
                <section
                  className="mb-6 rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4"
                  aria-label={t('lessonid.general.lessonAudio')}
                >
                  <Button size="lg" icon={<Volume2 aria-hidden="true" />} onClick={playManualAudio}>
                    {hasStartedAudio
                      ? t('lessonid.general.manualAudioReplay')
                      : t('lessonid.general.manualAudioPlay')}
                  </Button>
                  <audio
                    key={`${currentLesson.id}-${currentLesson.audioUrl}`}
                    ref={audioRef}
                    className="sr-only"
                    preload="metadata"
                    src={currentLesson.audioUrl}
                    onPlay={handleLessonAudioPlay}
                    onError={handleAudioError}
                  >
                    {t('lessonid.general.audioUnsupported')}
                  </audio>
                </section>
              ) : null}

              <div className="rounded-xl border border-(--border-card) bg-(--bg-secondary) p-5">
                {interactionType === 'dictation' ? (
                  <p className="text-lg font-semibold text-(--text-primary)">
                    {t('lessonid.general.interactions.dictationPrompt')}
                  </p>
                ) : interactionType === 'dialogue-choice' ||
                  interactionType === 'branching-dialogue' ? (
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-(--accent-blue) font-bold text-(--text-inverse)">
                      A
                    </span>
                    <div>
                      <p className="font-semibold text-(--text-primary)">Ana</p>
                      <p className="mt-1 rounded-2xl rounded-tl-sm bg-(--bg-card) px-4 py-3 text-lg text-(--text-primary)">
                        {interactionType === 'branching-dialogue' && branchTurn === 1
                          ? 'Ana: Nice to meet you!'
                          : currentLesson.text}
                      </p>
                    </div>
                  </div>
                ) : isReview ? (
                  <p className="text-lg font-semibold text-(--text-primary)">
                    {t('lessonid.general.interactions.reviewTask', { current: reviewStep + 1 })}
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-(--text-primary)">
                    {currentLesson.text}
                  </p>
                )}

                {isWriting || (isReview && reviewStep === 0) ? (
                  <div className="mt-5">
                    {interactionType === 'type-choice' ? (
                      <div
                        className="mb-3 flex flex-wrap gap-2"
                        aria-label={t('lessonid.general.interactions.availableOptions')}
                      >
                        {targetKeys.map((option) => (
                          <span
                            key={option}
                            className="rounded-full bg-(--bg-card) px-3 py-1 text-sm text-(--text-secondary)"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <label className="sr-only" htmlFor="interaction-answer">
                      {t('lessonid.general.interactions.answer')}
                    </label>
                    <input
                      id="interaction-answer"
                      value={interactionInput}
                      onChange={(event) => {
                        setInteractionInput(event.target.value);
                        setInteractionFeedback(null);
                      }}
                      className="w-full rounded-lg border border-(--border-card) bg-(--bg-card) px-4 py-3 text-lg text-(--text-primary) outline-none focus:border-(--accent-blue)"
                      autoComplete="off"
                    />
                    <Button
                      className="mt-3"
                      onClick={checkWrittenAnswer}
                      disabled={!interactionInput}
                    >
                      {t('lessonid.general.interactions.check')}
                    </Button>
                  </div>
                ) : isBuild || (isReview && reviewStep === 2) ? (
                  <div className="mt-5">
                    <div className="min-h-14 rounded-lg border border-dashed border-(--accent-blue-border) bg-(--bg-card) px-4 py-3 text-lg font-semibold text-(--text-primary)">
                      {interactionParts.join(interactionType === 'word-build' ? '' : ' ')}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {parts.map((part, index) => (
                        <Button
                          key={`${part}-${index}`}
                          variant="secondary"
                          disabled={
                            interactionParts.filter((item) => item === part).length >=
                            parts.filter((item) => item === part).length
                          }
                          onClick={() => addPart(part)}
                        >
                          {part}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={removeLastPart}
                        disabled={!interactionParts.length}
                      >
                        {t('lessonid.general.interactions.undo')}
                      </Button>
                      <Button onClick={checkParts} disabled={!interactionParts.length}>
                        {t('lessonid.general.interactions.check')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5">
                    <div
                      className="grid gap-3 sm:grid-cols-2"
                      role="radiogroup"
                      aria-label={t('lessonid.general.interactions.options')}
                    >
                      {(interactionType === 'branching-dialogue'
                        ? branchChoices
                        : visibleChoices
                      ).map((option) => (
                        <Button
                          key={option}
                          variant={interactionSelection === option ? 'primary' : 'secondary'}
                          className="min-h-16 justify-start text-left"
                          fullWidth
                          role="radio"
                          aria-checked={interactionSelection === option}
                          onClick={() => {
                            setInteractionSelection(option);
                            setInteractionFeedback(null);
                          }}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                    <Button
                      className="mt-4"
                      disabled={!interactionSelection}
                      onClick={
                        interactionType === 'branching-dialogue' ? chooseBranch : checkSelection
                      }
                    >
                      {t('lessonid.general.interactions.check')}
                    </Button>
                  </div>
                )}
              </div>

              {isWriting ? (
                <div className="mt-5">
                  <KeyboardView layoutId={activeLayout.id} activeKeys={[]} guideKeys={[]} />
                </div>
              ) : null}

              {interactionFeedback ? (
                <div
                  className={`mt-5 rounded-lg px-4 py-3 ${interactionFeedback === 'correct' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}
                  role="status"
                >
                  {interactionFeedback === 'correct'
                    ? t('lessonid.general.interactions.correct')
                    : t('lessonid.general.interactions.incorrect', {
                        answer: expectedAnswer,
                        detail: correctText,
                      })}
                </div>
              ) : null}

              {interactionFeedback === 'correct' ? (
                <Button
                  className="mt-6"
                  onClick={
                    isReview
                      ? advanceReview
                      : () => void handleExplanatoryComplete(currentLesson.id)
                  }
                >
                  {isReview && reviewStep < 2
                    ? t('lessonid.general.interactions.nextTask')
                    : t('lessonid.general.experimentalGreetings.continue')}
                </Button>
              ) : null}
            </section>
          </div>
        </DashboardBackground>
      );
    }
    const targetKeys: string[] = currentLesson.targetKeys ?? [];
    const nextPendingTargetKey = getNextPendingTargetKey(targetKeys, pressedExplanatoryKeys);
    const nextPendingVisualKey = nextPendingTargetKey?.toLocaleLowerCase('es') ?? null;
    const keyboardTargetKeyIds = targetKeys.flatMap((key) =>
      getKeyboardGuideKeysForExpectedKey(key, activeLayout.id),
    );
    const handReferences = getHandReferencesForExpectedKey(nextPendingVisualKey, activeLayout.id);
    const paragraphs = currentLesson.text?.split('\n').filter(Boolean) ?? [];
    const lessonAudio = currentLesson.audioUrl ? (
      <section
        className="mb-6 rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4"
        aria-labelledby="lesson-audio-title"
      >
        <p id="lesson-audio-title" className="mb-3 text-sm font-semibold text-(--text-primary)">
          {t('lessonid.general.audioGuide')}
        </p>
        {audioWarning && (
          <p
            className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
            role="status"
          >
            {t(`lessonid.general.audioWarning.`)}
          </p>
        )}
        <audio
          key={`${currentLesson.id}-${currentLesson.audioUrl}`}
          ref={audioRef}
          className="w-full"
          autoPlay={!usesManualAudio}
          controls
          controlsList="nodownload"
          preload={usesManualAudio ? 'metadata' : 'auto'}
          src={currentLesson.audioUrl}
          onContextMenu={(event) => event.preventDefault()}
          onVolumeChange={updateAudioVolumeWarning}
          onPlay={handleLessonAudioPlay}
          onError={handleAudioError}
        >
          {t('lessonid.general.audioUnsupported')}
        </audio>
      </section>
    ) : null;

    const highlightTargets = (text: string) => {
      if (!targetKeys.length) return text;
      const escapedKeys = targetKeys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const regex = new RegExp(`(${escapedKeys})`, 'g');
      return text.split(regex).map((part, i) =>
        targetKeys.includes(part) ? (
          <strong key={i} className="text-blue-500 font-semibold">
            {part}
          </strong>
        ) : (
          part
        ),
      );
    };

    return (
      <DashboardBackground>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          {breadcrumb}
          <div className="bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none rounded-2xl border border-(--border-card) p-6">
            {lessonAudio}

            {paragraphs.length > 0 && (
              <div className="text-(--text-primary) text-3xl sm:text-2xl leading-relaxed mb-6 space-y-3">
                {paragraphs.map((para, i) => (
                  <p key={i}>{highlightTargets(para)}</p>
                ))}
              </div>
            )}

            <div className="relative mb-6">
              <KeyboardView
                layoutId={activeLayout.id}
                activeKeys={targetKeys
                  .filter((key) => !pressedExplanatoryKeys.includes(key))
                  .flatMap((key) => getKeyboardGuideKeysForExpectedKey(key, activeLayout.id))}
                correctFlashKeys={correctFlashKeys}
                incorrectFlashKeys={incorrectFlashKeys}
                guideKeys={keyboardTargetKeyIds}
                leftHandSrc={handReferences.left}
                rightHandSrc={handReferences.right}
              />
            </div>
          </div>
        </div>
      </DashboardBackground>
    );
  }

  if (isCompleted && stats) {
    return (
      <DashboardBackground>
        <div className="p-6">
          <Results
            stats={stats}
            lessonTitle={currentLesson.title}
            progressResult={progressResult}
            saveStatus={saveStatus}
            saveMessage={saveMessage ?? undefined}
            minAccuracy={currentLesson.minAccuracy}
            onRetry={handleRetry}
            onNext={isAuthenticated && !progressResult?.mastered ? undefined : handleNext}
            isLastLesson={isLast}
            mode="lesson"
            onBackToList={() => router.push(`${coursesPath}/${currentCourseSlug}/lessons`)}
          />
        </div>
      </DashboardBackground>
    );
  }

  return (
    <DashboardBackground>
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        {breadcrumb}
        <div className="bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none rounded-xl border border-(--border-card) p-6">
          {isExperimentalGreetingsUnit ? (
            <ExperimentalLessonHeader
              title={currentLesson.title}
              instruction={currentLesson.instructions}
              position={experimentalLessonPosition}
              currentStep={currentIndex + 1}
              totalSteps={lessons.length}
              unitProgressLabel={t('lessonid.general.interactions.unitProgress')}
              stepLabel={(step, isCurrent) =>
                t('lessonid.general.interactions.stepProgress', {
                  step,
                  current: isCurrent ? t('lessonid.general.interactions.currentStep') : '',
                })
              }
            />
          ) : null}

          {currentLesson.audioUrl && (
            <section
              className="mb-6 rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4"
              aria-labelledby="lesson-audio-title"
            >
              <p
                id="lesson-audio-title"
                className="mb-3 text-sm font-semibold text-(--text-primary)"
              >
                {t('lessonid.general.audioGuide')}
              </p>
              {audioWarning && (
                <p
                  className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
                  role="status"
                >
                  {t(`lessonid.general.audioWarning.`)}
                </p>
              )}
              {usesManualAudio ? (
                <>
                  <Button size="lg" icon={<Volume2 aria-hidden="true" />} onClick={playManualAudio}>
                  {hasStartedAudio
                    ? t('lessonid.general.manualAudioReplay')
                    : t('lessonid.general.manualAudioPlay')}
                  </Button>
                  <audio
                    key={`${currentLesson.id}-${currentLesson.audioUrl}`}
                    ref={audioRef}
                    className="sr-only"
                    preload="metadata"
                    src={currentLesson.audioUrl}
                    onContextMenu={(event) => event.preventDefault()}
                    onVolumeChange={updateAudioVolumeWarning}
                    onPlay={handleLessonAudioPlay}
                    onError={handleAudioError}
                  >
                    {t('lessonid.general.audioUnsupported')}
                  </audio>
                </>
              ) : (
                <audio
                  key={`${currentLesson.id}-${currentLesson.audioUrl}`}
                  ref={audioRef}
                  className="w-full"
                  autoPlay
                  controls
                  controlsList="nodownload"
                  preload="auto"
                  src={currentLesson.audioUrl}
                  onContextMenu={(event) => event.preventDefault()}
                  onVolumeChange={updateAudioVolumeWarning}
                  onPlay={handleLessonAudioPlay}
                  onError={handleAudioError}
                >
                  {t('lessonid.general.audioUnsupported')}
                </audio>
              )}
            </section>
          )}

          {currentLesson.mediaUrl === 'dialogue' ? (
            <section
              className="mb-6 rounded-xl border border-(--accent-blue-border) bg-(--accent-blue-bg) p-5"
              aria-labelledby="dialogue-card-title"
            >
              <p
                id="dialogue-card-title"
                className="text-xs font-semibold uppercase tracking-wide text-(--accent-blue)"
              >
                {t('lessonid.general.experimentalGreetings.dialogue')}
              </p>
              <div className="mt-4 flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--accent-blue) font-bold text-(--text-inverse)"
                  aria-hidden="true"
                >
                  A
                </div>
                <div>
                  <p className="text-sm font-semibold text-(--text-primary)">Ana</p>
                  <p className="mt-1 rounded-2xl rounded-tl-sm bg-(--bg-card) px-4 py-3 text-lg leading-relaxed text-(--text-primary)">
                    {currentLesson.text}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <TypingArea
            key={`${currentLesson.id}-${retryKey}`}
            text={currentLesson.text}
            onComplete={handlePracticeComplete}
            onProgress={setStats}
            onExpectedKeyChange={setExpectedPracticeKey}
            selectedLayout={activeLayout}
            onLayoutChange={setSelectedLayout}
            showLiveWpm={!currentLesson.hideLiveWpm}
          />

          <div className="mt-5 flex items-center gap-3">
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
