// components/dashboard/CourseInProgressCard.tsx

'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { toContentLanguage, toSupportedLocale, type Locale } from '@/lib/locales';
import { useTranslations } from '@/lib/i18n';
import { getGuestCourseProgress } from '@/lib/guestProgressStore';

export default function CourseInProgressCard() {
  const { lang } = useParams<{ lang: string }>();
  const locale: Locale = toSupportedLocale(lang);
  const t = useTranslations(locale);
  const { isAuthenticated } = useAuth();
  const { courses, loading, fetchCourses } = useCourses();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading || courses.length === 0) return null;

  const activeLanguage = toContentLanguage(locale);
  const languageCourses = courses.filter((course) => course.languageCode === activeLanguage);

  const candidate = languageCourses
    .map((course) => {
      const userProgress = isAuthenticated
        ? course.userProgress
        : getGuestCourseProgress(course.id);
      return { course, userProgress };
    })
    .find(
      ({ course, userProgress }) =>
        userProgress && userProgress.completedLessons > 0 && userProgress.completedLessons < course.lessonsCount,
    );

  if (!candidate) return null;

  const { course, userProgress } = candidate;
  const percent = Math.round((userProgress!.completedLessons / course.lessonsCount) * 100);

  return (
    <Link
      href={`/${locale}/dashboard/courses/${course.id}/lessons`}
      className="block overflow-hidden rounded-2xl border border-(--border-card) bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none transition-colors hover:bg-(--bg-card-hover)"
    >
      <div className="flex items-center gap-2 bg-(--bg-primary) px-6 py-3 light:bg-(--bg-secondary)">
        <BookOpen className="h-5 w-5 text-(--accent-blue)" />
        <h2 className="text-lg font-semibold text-(--text-primary)">
          {t('dashboard.general.courseInProgress')}
        </h2>
      </div>

      <div className="p-5">
        <p className="mb-2 font-medium text-(--text-primary)">{course.name}</p>

        <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-(--bg-secondary)">
          <div
            className="h-full rounded-full bg-(--accent-blue) transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-(--text-secondary)">
          <span>
            {userProgress!.completedLessons}/{course.lessonsCount} {t('dashboard.general.lessons')}
          </span>
          <span className="font-medium text-(--accent-blue)">
            {t('dashboard.general.continueCourse')}
          </span>
        </div>
      </div>
    </Link>
  );
}
