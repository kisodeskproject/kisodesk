// app/[lang]/dashboard/courses/page.tsx
'use client';

import LevelFilter from '@/components/courses/LevelFilter';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import CourseCard from '@/components/courses/CourseCard';
import Input from '@/components/ui/Input';
import DashboardBackground from '@/components/layout/DashboardBackground';
import { getGuestCourseProgress } from '@/lib/guestProgressStore';

export default function CoursesPage() {
  const params = useParams();
  const lang = toSupportedLocale(params.lang);
  const t = useTranslations(lang);
  const { courses, loading, error, fetchCourses } = useCourses();
  const { isAuthenticated } = useAuth();

  const [filter, setFilter] = useState('');
  const [level, setLevel] = useState<string>('all');
  const [, setGuestProgressVersion] = useState(0);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (!isAuthenticated) setGuestProgressVersion((version) => version + 1);
  }, [isAuthenticated]);

  const coursesForLanguage = courses.filter((course) => course.localeCode === lang);

  const filteredCourses = coursesForLanguage.filter((course) => {
    const matchesFilter =
      course.name.toLowerCase().includes(filter.toLowerCase()) ||
      course.description.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = level === 'all' || course.level === level;
    return matchesFilter && matchesLevel;
  });

  const levelLabels = {
    all: t('courses.general.allLevels'),
    beginner: t('courses.general.beginner'),
    intermediate: t('courses.general.intermediate'),
    advanced: t('courses.general.advanced'),
  };

  return (
    <DashboardBackground>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-(--accent-blue)">
            {t('courses.general.title')}
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t('courses.general.searchPlaceholder') as string}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-(--bg-secondary) light:bg-(--bg-card) border-(--border-card) text-(--text-primary) placeholder-(--text-tertiary)"
            />
          </div>
          <LevelFilter value={level} onChange={setLevel} labels={levelLabels} />
        </div>

        <div className="min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 mb-3">{error}</p>
              <button
                onClick={() => fetchCourses()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {t('courses.general.retry')}
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            coursesForLanguage.length === 0 ? (
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
              <div className="text-center py-12 bg-(--bg-card) rounded-xl border border-(--border-card)">
                <p className="text-(--text-secondary)">{t('courses.general.noCourses')}</p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  slug={course.slug}
                  name={course.name}
                  description={course.description}
                  level={course.level}
                  lessonsCount={course.lessonsCount}
                  userProgress={
                    isAuthenticated
                      ? course.userProgress
                      : getGuestCourseProgress(course.slug)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardBackground>
  );
}
