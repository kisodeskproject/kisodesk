'use client';

import { useEffect, useMemo, useState } from 'react';

import CourseCard from '@/components/courses/CourseCard';
import LevelFilter from '@/components/courses/LevelFilter';
import DashboardBackground from '@/components/layout/DashboardBackground';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { getGuestCourseProgress } from '@/lib/guestProgressStore';
import { useTranslations } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
import type { PublicCourse } from '@/lib/publicCourses';
import type { Course } from '@/types/course';

interface CoursesExplorerProps {
  locale: Locale;
  initialCourses: PublicCourse[];
  initialLoadError: boolean;
}

function toClientCourse(course: PublicCourse): Course {
  return {
    ...course,
    estimatedMinutes: course.estimatedMinutes ?? undefined,
    userProgress: null,
  };
}

export default function CoursesExplorer({
  locale,
  initialCourses,
  initialLoadError,
}: CoursesExplorerProps) {
  const initialClientCourses = useMemo(
    () => initialCourses.map(toClientCourse),
    [initialCourses],
  );
  const { courses, loading, error, fetchCourses } = useCourses(initialClientCourses);
  const { isAuthenticated, loading: isAuthLoading } = useAuth();
  const t = useTranslations(locale);
  const [filter, setFilter] = useState('');
  const [level, setLevel] = useState<string>('all');
  const [, setGuestProgressVersion] = useState(0);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      void fetchCourses();
    }
  }, [fetchCourses, isAuthenticated, isAuthLoading]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setGuestProgressVersion((version) => version + 1);
    }
  }, [isAuthenticated, isAuthLoading]);

  const coursesForLocale = courses.filter((course) => course.localeCode === locale);
  const filteredCourses = coursesForLocale.filter((course) => {
    const search = filter.toLowerCase();
    return (
      (course.name.toLowerCase().includes(search) || course.description.toLowerCase().includes(search)) &&
      (level === 'all' || course.level === level)
    );
  });
  const levelLabels = {
    all: t('courses.general.allLevels'),
    beginner: t('courses.general.beginner'),
    intermediate: t('courses.general.intermediate'),
    advanced: t('courses.general.advanced'),
  };
  const hasInitialCourses = initialCourses.length > 0;
  const showError = initialLoadError || (Boolean(error) && !hasInitialCourses);

  return (
    <DashboardBackground>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold text-(--accent-blue)">{t('courses.general.title')}</h1>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder={t('courses.general.searchPlaceholder') as string}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="border-(--border-card) bg-(--bg-secondary) text-(--text-primary) placeholder-(--text-tertiary) light:bg-(--bg-card)"
            />
          </div>
          <LevelFilter value={level} onChange={setLevel} labels={levelLabels} />
        </div>

        <div className="min-h-[200px]">
          {showError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 py-12 text-center">
              <p className="mb-3 text-red-400">{error ?? 'No se pudieron cargar los cursos.'}</p>
              {!initialLoadError && (
                <button
                  onClick={() => void fetchCourses()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  {t('courses.general.retry')}
                </button>
              )}
            </div>
          ) : filteredCourses.length === 0 ? (
            coursesForLocale.length === 0 ? (
              <div className="mx-auto max-w-2xl rounded-2xl border border-(--border-card) bg-(--bg-card) px-6 py-12 text-center shadow-(--shadow-card)">
                <div
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-(--accent-blue-bg) text-2xl"
                  aria-hidden="true"
                >
                  🚧
                </div>
                <h2 className="text-xl font-semibold text-(--text-primary)">
                  {t('courses.general.noCourseYetTitle')}
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-(--text-secondary)">
                  {t('courses.general.noCourseYetDescription')}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-(--border-card) bg-(--bg-card) py-12 text-center">
                <p className="text-(--text-secondary)">{t('courses.general.noCourses')}</p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  slug={course.slug}
                  name={course.name}
                  description={course.description}
                  level={course.level}
                  lessonsCount={course.lessonsCount}
                  userProgress={
                    isAuthenticated ? course.userProgress : getGuestCourseProgress(course.slug)
                  }
                />
              ))}
            </div>
          )}
          {loading && hasInitialCourses && <span className="sr-only">Cargando cursos</span>}
        </div>
      </div>
    </DashboardBackground>
  );
}
