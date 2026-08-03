// components/lessons/LessonCard.tsx
import Link from 'next/link';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { getGradeFromScore, type GradeResult } from '@/lib/grades';
import { usePublicTrial } from '@/contexts/PublicTrialContext';

interface LessonCardProps {
  slug: string;
  courseSlug: string;
  order?: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  completed?: boolean;
  bestWpm?: number;
  bestScore?: number;
  bestAccuracy?: number;
  timeSpent?: number;
  type?: 'practice' | 'explanatory';
  mastered?: boolean;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'MASTERED' | 'REVIEW_DUE';
  minAccuracy?: number;
  isLocked?: boolean;
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

export default function LessonCard({
  slug,
  courseSlug,
  order,
  title,
  description,
  duration,
  completed = false,
  bestWpm,
  bestScore,
  bestAccuracy,
  timeSpent,
  type = 'practice',
  mastered = false,
  status = 'NOT_STARTED',
  minAccuracy = 95,
  isLocked = false,
}: LessonCardProps) {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const t = useTranslations(lang as never);
  const tr = (key: string, values?: Record<string, string | number>) =>
    t(`components.lessons.lessonCard.general.${key}`, values);
  const isPublicTrial = usePublicTrial();
  const [showOrderRecommendation, setShowOrderRecommendation] = useState(false);

  const grade: GradeResult | null = bestScore ? getGradeFromScore(bestScore) : null;
  const letterKey = grade ? letterGradeKeys[grade.letter] : null;
  const rankKey = grade ? adventurerRankKeys[grade.rank] : null;
  const gradeLetter = letterKey
    ? tr(`gradesLetters.${letterKey === 'SSS+' ? 'SSSPlus' : letterKey}`)
    : null;
  const gradeRank = rankKey ? tr(`gradesRanks.${rankKey}`) : null;
  const gradeDescription = rankKey ? tr(`gradesDescriptions.${rankKey}`) : null;

  const formatTime = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}${tr('secondsShort')}`;
    if (secs === 0) return `${mins}${tr('minutesShort')}`;
    return `${mins}${tr('minutesCompact')} ${secs}${tr('secondsShort')}`;
  };

  const isExplanatory = type === 'explanatory';
  const lessonHref = `/${lang}/${isPublicTrial ? 'courses' : 'dashboard/courses'}/${courseSlug}/lessons/${slug}`;

  return (
    <>
      <Link
        href={lessonHref}
        aria-label={`${tr('ariaLabel')} ${title}`}
        className="block h-full"
        onClick={(event) => {
          if (isLocked) {
            event.preventDefault();
            setShowOrderRecommendation(true);
          }
        }}
      >
        <article
          className={`group relative flex h-60 flex-col cursor-pointer bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none rounded-xl border p-6 transition-all shadow-sm font-sans hover:-translate-y-0.5 hover:shadow-lg ${mastered ? 'border-(--accent-green-border) ring-1 ring-(--accent-green-bg)' : 'border-(--border-card)'}`}
          role="article"
        >
          {order !== undefined && (
            <div
              className={`absolute -top-2 -left-2 text-(--text-inverse) text-xs font-bold px-2 py-1 rounded-full shadow-md z-10 ${mastered ? 'bg-(--accent-green)' : 'bg-(--accent-blue)'}`}
            >
              #{order}
            </div>
          )}
          {mastered && (
            <div className="absolute -top-2 -right-2 bg-(--accent-green) rounded-full p-1 shadow-lg">
              <svg
                className="w-4 h-4 text-(--text-inverse)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          <div className="flex justify-between items-start mb-4">
            <h3 className="w-full rounded-lg bg-(--bg-primary) px-3 py-2 text-xl font-bold tracking-tight text-(--text-primary) transition-colors line-clamp-1 group-hover:text-(--accent-blue) light:bg-(--bg-secondary) light:text-white">
              {title}
            </h3>
          </div>
          <p className="mb-4 min-h-10 text-sm leading-relaxed text-(--text-secondary) line-clamp-2">
            {description}
          </p>
          <div className="mb-4 min-h-4">
            {!isExplanatory && (
              <div className="text-xs text-(--text-tertiary)">
                <span>
                  {t('components.lessons.lessonCard.general.objectiveAccuracy', { minAccuracy })}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col">
            {!isExplanatory ? (
              <>
                <div className="grid grid-cols-4 gap-1 mb-4">
                  <div className="rounded-lg bg-(--bg-primary) py-2 text-center light:bg-(--bg-secondary)">
                    <span className="text-(--text-tertiary) text-[11px] font-medium uppercase tracking-wider">
                      {tr('wpm')}
                    </span>
                    <p className="text-(--accent-blue) light:text-(--lesson-card-wpm-stat-value-light-color) font-bold text-lg leading-tight">
                      {bestWpm ?? tr('placeholder')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-(--bg-primary) py-2 text-center light:bg-(--bg-secondary)">
                    <span className="text-(--text-tertiary) text-[11px] font-medium uppercase tracking-wider">
                      {tr('score')}
                    </span>
                    <p className="text-(--accent-purple) light:text-(--lesson-card-score-stat-value-light-color) font-bold text-lg leading-tight">
                      {bestScore ?? tr('placeholder')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-(--bg-primary) py-2 text-center light:bg-(--bg-secondary)">
                    <span className="text-(--text-tertiary) text-[11px] font-medium uppercase tracking-wider">
                      {tr('accuracy')}
                    </span>
                    <p className="text-(--accent-green) light:text-(--lesson-card-accuracy-stat-value-light-color) font-bold text-lg leading-tight">
                      {bestAccuracy ? `${bestAccuracy}%` : tr('placeholder')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-(--bg-primary) py-2 text-center light:bg-(--bg-secondary)">
                    <span className="text-(--text-tertiary) text-[11px] font-medium uppercase tracking-wider">
                      {tr('time')}
                    </span>
                    <p className="text-(--accent-cyan) light:text-(--lesson-card-time-stat-value-light-color) font-bold text-lg leading-tight">
                      {formatTime(timeSpent) ??
                        (duration
                          ? `${tr('approxPrefix')}${duration}${tr('minutesShort')}`
                          : tr('placeholder'))}
                    </p>
                  </div>
                </div>
                {grade && gradeLetter && gradeRank && (
                  <div className="flex justify-between items-center border-t border-(--border-card) pt-3 mt-2 text-xs">
                    <div className="group/tooltip relative">
                      <span className="text-(--text-tertiary)">{tr('rankLabel')}</span>
                      <p className="text-(--accent-amber) font-bold text-sm cursor-help">
                        {gradeRank}
                      </p>
                      {gradeDescription && (
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-(--bg-card) text-(--text-primary) text-xs rounded-md whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-lg border border-(--border-card) z-10">
                          {gradeDescription}
                          <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-(--bg-card)"></div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-(--text-tertiary)">{tr('gradeLabel')}</span>
                      <p className="text-(--accent-amber) font-mono font-bold text-lg leading-5">
                        {gradeLetter}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg bg-(--bg-primary) light:bg-(--bg-secondary)">
                <div className="flex items-center gap-2 text-sm text-(--accent-blue)">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span>
                    {tr('explanatoryBadge')}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 min-h-5 text-right">
            {(completed || status === 'IN_PROGRESS') && (
              <span
                className={`text-xs font-medium flex items-center justify-end gap-1 ${
                  mastered || completed
                    ? 'rounded-full bg-(--accent-green) px-2 py-1 text-white light:bg-(--accent-green) light:text-white'
                    : 'text-(--accent-yellow)'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {mastered
                  ? t('components.lessons.lessonCard.general.mastered')
                  : status === 'IN_PROGRESS'
                    ? t('components.lessons.lessonCard.general.inProgress')
                    : tr('completed')}
              </span>
            )}
          </div>
        </article>
      </Link>

      {showOrderRecommendation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={() => setShowOrderRecommendation(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-order-recommendation-title"
            className="w-full max-w-md rounded-xl border border-(--border-card) bg-(--bg-card) p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2
              id="lesson-order-recommendation-title"
              className="text-lg font-bold text-(--text-primary)"
            >
              {t('components.lessons.lessonCard.general.lessonOrderRecommendationTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">
              {t('components.lessons.lessonCard.general.lessonOrderRecommendationDescription')}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-secondary)"
                onClick={() => setShowOrderRecommendation(false)}
              >
                {t('components.lessons.lessonCard.general.lessonOrderRecommendationBack')}
              </button>
              <button
                type="button"
                className="rounded-lg bg-(--accent-blue) px-4 py-2 text-sm font-medium text-(--text-inverse) transition-colors hover:opacity-90"
                onClick={() => router.push(lessonHref)}
              >
                {t('components.lessons.lessonCard.general.lessonOrderRecommendationContinue')}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
