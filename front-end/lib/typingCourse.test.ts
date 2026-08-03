import { describe, expect, it } from '@jest/globals';
import type { Course } from '@/types';
import { findTypingCourse, getTypingCourseConfiguration } from './typingCourse';

const spanishTypingCourse: Course = {
  id: 'course-es',
  slug: 'caracteres-alfabeticos-es',
  name: 'Curso de Mecanografía en Español',
  description: '',
  languageCode: 'es',
  level: 'beginner',
  lessonsCount: 1,
  userProgress: null,
};

describe('typing course configuration', () => {
  it('centraliza la configuración del curso español por locale', () => {
    expect(getTypingCourseConfiguration('es')).toEqual({
      locale: 'es',
      languageCode: 'es',
      courseSlug: 'caracteres-alfabeticos-es',
    });
  });

  it('devuelve null para locales sin configuración y nunca elige por posición o nombre', () => {
    const derivedEnglishCourse: Course = {
      ...spanishTypingCourse,
      id: 'course-en',
      slug: 'spanish-typing-course',
      name: 'Spanish Typing Course',
      languageCode: 'en',
    };

    expect(getTypingCourseConfiguration('en')).toBeNull();
    expect(findTypingCourse([derivedEnglishCourse, spanishTypingCourse], 'en')).toBeNull();
    expect(findTypingCourse([derivedEnglishCourse, spanishTypingCourse], 'es')).toBe(spanishTypingCourse);
  });

  it('tolera que el curso configurado no exista o cambie de slug', () => {
    expect(findTypingCourse([], 'es')).toBeNull();
    expect(findTypingCourse([{ ...spanishTypingCourse, slug: 'renombrado' }], 'es')).toBeNull();
  });
});
