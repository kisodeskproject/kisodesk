// components/courses/CourseCard.tsx

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, ChevronRight, Clock, Library, Target, Zap } from 'lucide-react';

import { usePublicTrial } from '@/contexts/PublicTrialContext';
import { TranslationKey, toSupportedLocale, useTranslations } from '@/lib/i18n';
import type { UserProgress } from '@/types/course';

interface CourseCardProps {
  slug: string;
  name: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessonsCount: number;
  userProgress?: UserProgress | null;
}

const formatTime = (seconds: number, t: (key: TranslationKey) => string): string => {
  const minutesShort = t('components.lessons.lessonCard.general.minutesShort' as TranslationKey);
  if (!seconds) {
    return `0 ${minutesShort}`;
  }

  const minutes = Math.floor(seconds / 60);

  return `${minutes} ${minutesShort}`;
};

export default function CourseCard({
  slug,
  name,
  description,
  lessonsCount,
  userProgress = null,
}: CourseCardProps) {
  const params = useParams<{ lang: string }>();
  const lang = params.lang;
  const t = useTranslations(toSupportedLocale(lang));
  const isPublicTrial = usePublicTrial();

  const completedLessons = userProgress?.completedLessons ?? 0;
  const courseHref = `/${lang}/${isPublicTrial ? 'courses' : 'dashboard/courses'}/${slug}/lessons`;

  return (
    <article className="kisodesk-surface kisodesk-surface-interactive group relative p-6">
      <Link
        href={courseHref}
        aria-label={`${t(
          'components.courses.courseCard.general.viewCourse' as TranslationKey,
        )}: ${name}`}
        className="absolute inset-0 z-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--accent-blue-border) focus:ring-offset-2"
      />

      <div className="pointer-events-none relative z-10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-(--text-primary) transition-colors group-hover:text-(--accent-blue) light:group-hover:text-(--course-card-hover-title)">
            {name}
          </h2>
        </div>

        <p className="mb-5 line-clamp-2 text-sm leading-6 text-(--text-secondary)">{description}</p>

        <div className="mb-4 rounded-lg border border-(--border-card) bg-(--bg-secondary) p-3">
          <div className="mb-2 text-xs uppercase tracking-wider text-(--text-tertiary)">
            {t('components.courses.courseCard.general.yourProgress' as TranslationKey)}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-(--accent-blue)">
              <BookOpen className="h-4 w-4" />

              <span>
                {completedLessons} / {lessonsCount}{' '}
                {t('components.courses.courseCard.general.lessons' as TranslationKey)}
              </span>
            </div>

            <div className="flex items-center gap-1 text-(--accent-green)">
              <Zap className="h-4 w-4" />
              <span>{userProgress ? `${userProgress.bestWpm} WPM` : '—'}</span>
            </div>

            <div className="flex items-center gap-1 text-(--accent-yellow)">
              <Target className="h-4 w-4" />
              <span>{userProgress ? `${userProgress.avgAccuracy}%` : '—'}</span>
            </div>

            <div className="flex items-center gap-1 text-(--accent-purple)">
              <Clock className="h-4 w-4" />
              <span>{userProgress ? formatTime(userProgress.totalTimeSpent, t) : '—'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-(--border-card) pt-4 text-sm text-(--text-tertiary)">
          <span className="flex items-center gap-1">
            <Library className="h-4 w-4" />
            {completedLessons} / {lessonsCount}{' '}
            {t('components.courses.courseCard.general.lessonsCount' as TranslationKey)}
          </span>

          <span className="flex items-center gap-1 text-(--accent-blue) transition group-hover:translate-x-1">
            {t('components.courses.courseCard.general.viewCourse' as TranslationKey)}

            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
