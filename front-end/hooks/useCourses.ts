'use client';

import { useCallback, useState } from 'react';

import { apiGet } from '@/lib/apiClient';
import { toContentLanguage, toSupportedLocale, type ContentLanguage, type Locale } from '@/lib/locales';
import type { Course } from '@/types';

type RawCourse = {
  id: string;
  slug?: string;
  name: string;
  description?: string | null;
  languageCode?: string;
  localeCode?: string;
  language?: string;
  level: string;
  supportedLayouts?: string[];
  curriculumVersion?: number;
  estimatedMinutes?: number | null;
  lessonsCount?: number;
  userProgress?: {
    completedLessons: number;
    masteredLessons?: number;
    bestWpm: number;
    avgAccuracy: number;
    totalTimeSpent: number;
  } | null;
};

function normalizeLanguage(value?: string | null): ContentLanguage | undefined {
  return value ? toContentLanguage(value) : undefined;
}

function normalizeLocale(value?: string | null): Locale | undefined {
  return value ? toSupportedLocale(value) : undefined;
}

function normalizeLevel(value: string): Course['level'] {
  const normalized = value.toLowerCase();
  if (normalized === 'beginner' || normalized === 'intermediate' || normalized === 'advanced') {
    return normalized;
  }
  return 'beginner';
}

function normalizeCourse(course: RawCourse): Course {
  const languageCode = normalizeLanguage(course.languageCode ?? course.language);
  const localeCode = normalizeLocale(course.localeCode);

  return {
    id: course.id,
    slug: course.slug ?? course.id,
    name: course.name,
    description: course.description ?? '',
    languageCode,
    localeCode,
    level: normalizeLevel(course.level),
    supportedLayouts: course.supportedLayouts,
    curriculumVersion: course.curriculumVersion,
    estimatedMinutes: course.estimatedMinutes ?? undefined,
    lessonsCount: course.lessonsCount ?? 0,
    userProgress: course.userProgress
      ? {
          completedLessons: course.userProgress.completedLessons,
          masteredLessons: course.userProgress.masteredLessons,
          bestWpm: course.userProgress.bestWpm,
          avgAccuracy: course.userProgress.avgAccuracy,
          totalTimeSpent: course.userProgress.totalTimeSpent,
        }
      : null,
  };
}

export function useCourses(initialCourses: Course[] = []) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet<RawCourse[] | { courses?: RawCourse[] }>('/courses');
      const items = Array.isArray(response) ? response : (response.courses ?? []);
      setCourses(items.map(normalizeCourse));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  return { courses, loading, error, fetchCourses };
}
