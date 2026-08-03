// app/[lang]/dashboard/courses/[courseId]/lessons/page.tsx
'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { useLesson } from '@/hooks/useLesson';
import { useAuth } from '@/hooks/useAuth';
import LessonCard from '@/components/lessons/LessonCard';
import Input from '@/components/ui/Input';
import DashboardBackground from '@/components/layout/DashboardBackground';
import { DifficultyFilter } from '@/lib/filters';
import { usePublicTrial } from '@/contexts/PublicTrialContext';
import { getGuestLessonProgress } from '@/lib/guestProgressStore';

export default function CourseLessonsPage() {
  const params = useParams();
  const lang = params.lang as string;
  const courseSlug = params.courseId as string;
  const t = useTranslations(lang as never);
  const { lessons, loading, error, fetchLessonsByCourse } = useLesson();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isPublicTrial = usePublicTrial();
  const coursesPath = `/${lang}/${isPublicTrial ? 'courses' : 'dashboard/courses'}`;
  const [filter, setFilter] = useState('');
  const [difficulty, setDifficulty] = useState<string>('all');
  const hasScrolledToNextLesson = useRef(false);

  useEffect(() => {
    hasScrolledToNextLesson.current = false;
    if (courseSlug) fetchLessonsByCourse(courseSlug);
  }, [courseSlug, fetchLessonsByCourse]);

  const lessonsWithProgress = isAuthenticated
    ? lessons
    : lessons.map((lesson) => {
        const progress = getGuestLessonProgress(courseSlug, lesson.id);
        return progress
          ? {
              ...lesson,
              bestWpm: progress.bestNetWpm,
              bestScore: progress.bestScore,
              bestAccuracy: progress.bestAccuracy,
              timeSpent: progress.totalTimeElapsed,
              completed: true,
              status: 'COMPLETED' as const,
              attemptsCount: progress.attempts,
            }
          : lesson;
      });

  const firstIncompleteLesson = lessonsWithProgress.find(
    (lesson) =>
      !lesson.completed &&
      !lesson.mastered &&
      lesson.status !== 'COMPLETED' &&
      lesson.status !== 'MASTERED',
  );

  useLayoutEffect(() => {
    if (loading || authLoading || hasScrolledToNextLesson.current || !firstIncompleteLesson) return;

    document.getElementById(`lesson-card-${firstIncompleteLesson.id}`)?.scrollIntoView({ block: 'start' });
    hasScrolledToNextLesson.current = true;
  }, [authLoading, firstIncompleteLesson, loading]);

  const filteredLessons = lessonsWithProgress.filter((lesson) => {
    const matchesFilter =
      lesson.title.toLowerCase().includes(filter.toLowerCase()) ||
      (lesson.description || '').toLowerCase().includes(filter.toLowerCase());
    const matchesDifficulty = difficulty === 'all' || lesson.difficulty === difficulty;
    return matchesFilter && matchesDifficulty;
  });

  const modules = Array.from(
    filteredLessons.reduce((grouped, lesson) => {
      const key = lesson.moduleSlug ?? 'course';
      const current = grouped.get(key) ?? {
        slug: key,
        title: lesson.moduleTitle ?? t('lessons.general.title'),
        description: lesson.moduleDescription ?? '',
        order: lesson.moduleOrder ?? 0,
        lessons: [],
      };
      current.lessons.push(lesson);
      grouped.set(key, current);
      return grouped;
    }, new Map<string, { slug: string; title: string; description: string; order: number; lessons: typeof lessons }>()),
  )
    .map(([, moduleData]) => moduleData)
    .sort((a, b) => a.order - b.order);

  const difficultyLabels = {
    all: t('lessons.general.allDifficulties'),
    beginner: t('lessons.general.beginner'),
    intermediate: t('lessons.general.intermediate'),
    advanced: t('lessons.general.advanced'),
  };

  const isLoading = loading || authLoading;

  return (
    <DashboardBackground>
      <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-2 text-3xl font-bold">
          <Link
            href={coursesPath}
            className="text-(--text-secondary) light:text-(--lesson-light-heading-text) transition-colors hover:text-(--text-primary)"
          >
            {t('courses.general.title')}
          </Link>
          <span className="text-(--text-tertiary)">&gt;</span>
          <h1 className="bg-linear-to-r from-blue-400 via-cyan-400 to-purple-400 light:from-(--page-title-primary-color) light:via-(--page-title-highlight-color) light:to-(--page-title-secondary-color) bg-clip-text text-transparent">
            {t('lessons.general.title')}
          </h1>
        </div>
        <p className="text-(--text-secondary) light:text-(--page-subtitle-light-color) mt-1">{t('lessons.general.subtitle')}</p>
      </div>

      {!authLoading && !isAuthenticated && (
        <div className="bg-blue-900/20 light:bg-blue-950 border border-blue-500/30 light:border-blue-500 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-blue-300">{t('lessons.general.guestModeMessage')}</p>
          </div>
          <Link
            href={`/${lang}/login`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            {t('lessons.general.signIn')}
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('lessons.general.searchPlaceholder') as string}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="light:bg-(--bg-card)"
          />
        </div>
        <DifficultyFilter value={difficulty} onChange={setDifficulty} labels={difficultyLabels} />
      </div>

      <div className="min-h-[760px]" aria-busy={isLoading}>
        {isLoading ? (
          <div className="space-y-4" aria-hidden="true">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-(--bg-secondary)" />
                <div className="h-8 w-64 rounded bg-(--bg-secondary)" />
                <div className="h-4 w-full max-w-2xl rounded bg-(--bg-secondary)" />
              </div>
              <div className="h-4 w-28 rounded bg-(--bg-secondary)" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-60 rounded-xl border border-(--border-card) bg-(--bg-card) p-6"
                >
                  <div className="mb-4 h-5 w-3/4 rounded bg-(--bg-secondary)" />
                  <div className="mb-2 h-4 w-full rounded bg-(--bg-secondary)" />
                  <div className="mb-6 h-4 w-2/3 rounded bg-(--bg-secondary)" />
                  <div className="mt-auto grid grid-cols-3 gap-3">
                    <div className="h-10 rounded bg-(--bg-secondary)" />
                    <div className="h-10 rounded bg-(--bg-secondary)" />
                    <div className="h-10 rounded bg-(--bg-secondary)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-300 mb-2">{t('lessons.general.errorTitle')}</h3>
            <p className="text-red-200/80 text-sm mb-4 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchLessonsByCourse(courseSlug)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              {t('lessons.general.retry')}
            </button>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-12 bg-(--bg-card) rounded-xl border border-(--border-card)">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-(--bg-secondary) text-(--text-tertiary) mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
              {t('lessons.general.noLessonsTitle')}
            </h3>
            <p className="text-(--text-secondary) text-sm max-w-md mx-auto">
              {t('lessons.general.noLessonsDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {modules.map((moduleData) => {
              const masteredCount = moduleData.lessons.filter((lesson) => lesson.mastered).length;

              return (
                <section key={moduleData.slug} className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-2xl font-extrabold uppercase tracking-[0.18em] text-(--accent-cyan) light:text-(--lesson-module-label-light-color)">
                        {t('lessons.general.moduleLabel', { order: moduleData.order })}
                      </p>
                      <h2 className="text-2xl font-bold text-(--text-primary) light:text-(--lesson-light-heading-text)">
                        {moduleData.title}
                      </h2>
                    </div>
                    <span className="text-sm text-(--text-tertiary)">
                      {t('lessons.general.masteredCount', {
                        mastered: masteredCount,
                        total: moduleData.lessons.length,
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {moduleData.lessons.map((lesson) => (
                      <div key={lesson.id} id={`lesson-card-${lesson.id}`} className="scroll-mt-6">
                        <LessonCard
                          slug={lesson.slug}
                          courseSlug={lesson.courseSlug ?? courseSlug}
                          order={lesson.order}
                          title={lesson.title}
                          description={lesson.objective || lesson.description || ''}
                          difficulty={lesson.difficulty ?? 'beginner'}
                          duration={lesson.duration ?? 0}
                          completed={lesson.completed}
                          mastered={lesson.mastered}
                          status={lesson.status}
                          minAccuracy={lesson.minAccuracy}
                          isLocked={lesson.isLocked}
                          bestWpm={lesson.bestWpm}
                          bestScore={lesson.bestScore}
                          bestAccuracy={lesson.bestAccuracy}
                          timeSpent={lesson.timeSpent}
                          type={lesson.type}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </DashboardBackground>
  );
}
