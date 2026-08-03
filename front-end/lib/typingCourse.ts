import type { ContentLanguage } from '@/lib/locales';
import type { Course } from '@/types';

export type TypingCourseConfiguration = Readonly<{
  locale: string;
  languageCode: string;
  courseSlug: string;
}>;

// Solo se registran cursos cuyo currículo de mecanografía está identificado
// explícitamente en el repositorio. No se infiere a partir del nombre.
export const typingCoursesByLocale: Partial<Record<ContentLanguage, TypingCourseConfiguration>> = {
  es: {
    locale: 'es',
    languageCode: 'es',
    courseSlug: 'caracteres-alfabeticos-es',
  },
};

export function getTypingCourseConfiguration(locale: ContentLanguage): TypingCourseConfiguration | null {
  return typingCoursesByLocale[locale] ?? null;
}

export function findTypingCourseInConfiguration(
  courses: Course[],
  configuration: TypingCourseConfiguration | null,
): Course | null {
  if (!configuration) return null;

  return (
    courses.find(
      (course) =>
        course.slug === configuration.courseSlug && course.languageCode === configuration.languageCode,
    ) ?? null
  );
}

export function findTypingCourse(courses: Course[], locale: ContentLanguage): Course | null {
  return findTypingCourseInConfiguration(courses, getTypingCourseConfiguration(locale));
}
