// components/lessons/Results.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { TypingStats } from './TypingArea';
import { useTranslations } from '@/lib/i18n';
import { getGradeFromScore } from '@/lib/grades';
import type { GradeResult } from '@/lib/grades';
import type { LessonProgressResult } from '@/types';
import { isLowTypingResult } from '@/lib/typingResultQuality';
import { usePublicTrial } from '@/contexts/PublicTrialContext';

interface ResultsProps {
  stats: TypingStats;
  lessonTitle: string;
  onRetry: () => void;
  onNext?: () => void;
  isLastLesson?: boolean;
  mode?: 'lesson' | 'practice';
  newTextLabel?: string;
  onBackToList?: () => void;
  backLabel?: string;
  progressResult?: LessonProgressResult | null;
  minAccuracy?: number;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'failed' | 'skipped';
  saveMessage?: string;
}

type LetterGradeKey = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'SSS+';
type AdventurerRankKey = 'novice' | 'scout' | 'ranger' | 'veteran' | 'elite' | 'legend';

const letterGradeKeys: Record<string, LetterGradeKey> = {
  F: 'F',
  D: 'D',
  C: 'C',
  B: 'B',
  A: 'A',
  S: 'S',
  SS: 'SS',
  SSS: 'SSS',
  'SSS+': 'SSS+',
};
const adventurerRankKeys: Record<string, AdventurerRankKey> = {
  novice: 'novice',
  scout: 'scout',
  ranger: 'ranger',
  veteran: 'veteran',
  elite: 'elite',
  legend: 'legend',
};

export default function Results({
  stats,
  lessonTitle,
  onRetry,
  onNext,
  isLastLesson = false,
  mode = 'lesson',
  newTextLabel,
  onBackToList,
  backLabel,
  progressResult,
  minAccuracy = 95,
  saveStatus = 'idle',
  saveMessage,
}: ResultsProps) {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const t = useTranslations(lang as never);
  const tr = (key: string) => t(`components.lessons.results.general.${key}`);
  const isPublicTrial = usePublicTrial();
  const coursesHref = `/${lang}/${isPublicTrial ? 'courses' : 'dashboard/courses'}`;

  const currentGrade: GradeResult = getGradeFromScore(stats.score);
  const letterKey = letterGradeKeys[currentGrade.letter];
  const rankKey = adventurerRankKeys[currentGrade.rank];
  const gradeLetter = letterKey
    ? tr(`gradesLetters.${letterKey === 'SSS+' ? 'SSSPlus' : letterKey}`)
    : null;
  const gradeRank = rankKey ? tr(`gradesRanks.${rankKey}`) : null;
  const gradeDescription = rankKey ? tr(`gradesDescriptions.${rankKey}`) : null;
  const nextButtonText = isLastLesson ? tr('backToCourses') : tr('next');
  const isLowResult = isLowTypingResult(stats);
  const showLowResultRecommendation = mode === 'practice' && isLowResult;
  const showAccuracyFocus =
    mode === 'practice' &&
    !showLowResultRecommendation &&
    stats.accuracy > 90 &&
    stats.accuracy < 95;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && onNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext]);

  const handleBackDefault = () => {
    if (mode === 'practice')
      router.push(`/${lang}/${isPublicTrial ? 'practice' : 'dashboard/practice'}`);
    else router.push(coursesHref);
  };

  const cardClasses =
    'bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none rounded-2xl border border-(--border-card) p-8 max-w-2xl mx-auto';
  const statBoxClasses =
    'text-center p-4 bg-(--bg-secondary) rounded-xl border border-(--border-card)';

  return (
    <div className={cardClasses}>
      <h2 className="text-2xl font-bold text-center bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
        {lessonTitle}
      </h2>

      {saveStatus === 'failed' && saveMessage && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-sm font-medium">{tr('saveWarning')}</p>
            <p className="text-yellow-200/70 text-sm mt-1">{saveMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={statBoxClasses}>
          <p className="text-3xl font-bold text-(--accent-blue)">{stats.grossWpm}</p>
          <p className="text-sm text-(--text-secondary)">{tr('wpm')}</p>
        </div>
        <div className={statBoxClasses}>
          <p className="text-3xl font-bold text-(--accent-purple)">{stats.score}</p>
          <p className="text-sm text-(--text-secondary)">{tr('score')}</p>
        </div>
        <div className={statBoxClasses}>
          <p className="text-3xl font-bold text-(--accent-green)">{stats.accuracy}%</p>
          <p className="text-sm text-(--text-secondary)">{tr('accuracy')}</p>
        </div>
        <div className={statBoxClasses}>
          <p className="text-3xl font-bold text-(--text-primary)">
            {stats.correctChars}/{stats.totalChars}
          </p>
          <p className="text-sm text-(--text-secondary)">{tr('correctChars')}</p>
        </div>
      </div>

      {(showLowResultRecommendation || showAccuracyFocus) && (
        <div className="mb-8 space-y-3">
          {showLowResultRecommendation && (
            <div className="rounded-lg border border-(--accent-yellow-border) bg-(--accent-yellow-bg) p-4">
              <p className="font-semibold text-(--text-primary)">{tr('lowResultTitle')}</p>
              <p className="mt-1 text-sm text-(--text-secondary)">{tr('lowResultMessage')}</p>
              <Link
                href={coursesHref}
                className="mt-3 inline-flex text-sm font-semibold text-(--accent-blue) hover:brightness-110"
              >
                {tr('lowResultCourseLink')}
              </Link>
            </div>
          )}
          {showAccuracyFocus && (
            <div className="rounded-xl border border-(--accent-blue-border) bg-(--accent-blue-bg) p-4">
              <p className="font-semibold text-(--text-primary)">{tr('accuracyFocusTitle')}</p>
              <p className="mt-1 text-sm text-(--text-secondary)">{tr('accuracyFocusMessage')}</p>
            </div>
          )}
        </div>
      )}

      {mode === 'lesson' && progressResult && (
        <div
          className={`mb-8 rounded-xl border p-4 ${
            progressResult.mastered
              ? 'border-(--accent-green-border) bg-(--accent-green-bg)'
              : 'border-(--accent-red-border) bg-(--accent-red-bg)'
          }`}
        >
          <p className="font-semibold text-(--text-primary)">
            {progressResult.mastered
              ? t('components.lessons.results.general.masteredResult')
              : t('components.lessons.results.general.needsReview')}
          </p>
          <p className="mt-1 text-sm text-(--text-secondary)">
            {progressResult.mastered
              ? t('components.lessons.results.general.masteredMessage')
              : t('components.lessons.results.general.reviewMessage', { minAccuracy })}
          </p>
        </div>
      )}

      <div className="mb-8 p-4 rounded-xl border border-(--border-card) bg-(--bg-secondary) w-2/3 mx-auto">
        <div className="flex justify-center items-center gap-[30px]">
          <div className="text-center">
            <span className="text-xs text-(--text-tertiary)">{tr('score')}</span>
            <p className="text-(--accent-purple) font-bold text-3xl leading-7">{stats.score}</p>
          </div>
          <div className="text-center">
            <span className="text-xs text-(--text-tertiary)">{tr('rankLabel')}</span>
            <p className="text-(--accent-amber) font-bold text-lg">{gradeRank}</p>
            {gradeDescription && (
              <p className="text-xs text-(--text-secondary)">{gradeDescription}</p>
            )}
          </div>
          <div className="text-center">
            <span className="text-xs text-(--text-tertiary)">{tr('gradeLabel')}</span>
            <p className="text-(--accent-amber) font-mono font-bold text-3xl leading-7">
              {gradeLetter}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onRetry}
          className="px-6 py-2 border border-(--accent-blue-border) bg-(--bg-secondary) text-(--text-primary) rounded-lg transition-colors hover:bg-(--bg-card-hover) hover:border-(--accent-blue) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-blue) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-card)"
          aria-label={tr('retryAriaLabel')}
        >
          {tr('retry')}
        </button>
        {mode === 'lesson' ? (
          <>
            {onNext && (
              <button
                onClick={onNext}
                className="px-6 py-2 bg-(--accent-blue) hover:brightness-110 text-(--text-inverse) rounded-lg transition-all shadow-lg"
              >
                {nextButtonText}
              </button>
            )}
            <button
              onClick={onBackToList ?? handleBackDefault}
              className="px-6 py-2 border border-(--border-card) text-(--text-secondary) rounded-lg hover:bg-(--bg-secondary) transition-colors"
            >
              {backLabel ?? tr('backToCourses')}
            </button>
          </>
        ) : (
          <>
            {onNext && (
              <button
                onClick={onNext}
                className="px-6 py-2 bg-(--accent-blue) hover:brightness-110 text-(--text-inverse) rounded-lg transition-all shadow-lg"
              >
                {newTextLabel ?? tr('newText')}
              </button>
            )}
            <button
              onClick={onBackToList ?? handleBackDefault}
              className="px-6 py-2 border border-(--border-card) text-(--text-secondary) rounded-lg hover:bg-(--bg-secondary) transition-colors"
            >
              {backLabel ?? tr('backToDashboard')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
