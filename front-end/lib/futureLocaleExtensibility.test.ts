import { describe, expect, it } from '@jest/globals';
import { getWeakKeysQueryKey } from '@/hooks/useWeakKeys';
import type { Course } from '@/types';
import { findTypingCourseInConfiguration, type TypingCourseConfiguration } from './typingCourse';
import { getWeakKeyLessonRecommendations } from './weakKeyLessonRecommendations';

const configurations: Record<string, TypingCourseConfiguration> = {
  es: { locale: 'es', languageCode: 'es', courseSlug: 'curso-es' },
  en: { locale: 'en', languageCode: 'en', courseSlug: 'curso-en' },
  zz: { locale: 'zz', languageCode: 'zz', courseSlug: 'curso-zz' },
};

const courses = [
  { slug: 'curso-es', languageCode: 'es', id: 'es' },
  { slug: 'curso-en', languageCode: 'en', id: 'en' },
  { slug: 'curso-zz', languageCode: 'zz', id: 'zz' },
] as unknown as Course[];

describe('extensibilidad de cursos de mecanografía', () => {
  it('encuentra un curso futuro configurado sin acoplar el selector a la tarjeta', () => {
    expect(findTypingCourseInConfiguration(courses, configurations.zz)).toEqual(courses[2]);
  });

  it('mantiene separadas configuraciones por languageCode y slug', () => {
    expect(findTypingCourseInConfiguration(courses, configurations.es)).toEqual(courses[0]);
    expect(findTypingCourseInConfiguration(courses, configurations.en)).toEqual(courses[1]);
    expect(findTypingCourseInConfiguration(courses, configurations.zz)).toEqual(courses[2]);
    expect(findTypingCourseInConfiguration(courses, null)).toBeNull();
  });

  it('mantiene aislados estadísticas, curso y lecciones al alternar tres configuraciones', () => {
    const selected = ['es', 'en', 'zz'].map((locale) => ({
      locale,
      statsKey: getWeakKeysQueryKey(locale, 5),
      course: findTypingCourseInConfiguration(courses, configurations[locale]),
    }));

    expect(new Set(selected.map((item) => item.statsKey)).size).toBe(3);
    expect(new Set(selected.map((item) => item.course?.slug)).size).toBe(3);

    const futureRecommendations = getWeakKeyLessonRecommendations({
      weakKeys: [{ key: 'ž' }],
      courseSlug: 'curso-zz',
      lessons: [
        {
          id: 'lesson-zz',
          slug: 'lesson-zz',
          courseSlug: 'curso-zz',
          title: 'Future lesson',
          text: 'ž',
          focusKeys: ['ž'],
          reviewKeys: [],
        },
        {
          id: 'lesson-es',
          slug: 'lesson-es',
          courseSlug: 'curso-es',
          title: 'Spanish lesson',
          text: 'a',
          focusKeys: ['ž'],
          reviewKeys: [],
        },
      ],
    });

    expect(futureRecommendations.map((item) => item.lesson.id)).toEqual(['lesson-zz']);
  });
});
