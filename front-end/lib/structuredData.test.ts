import { describe, expect, it } from '@jest/globals';

import {
  buildCourseJsonLd,
  buildLearningResourceJsonLd,
  buildWebApplicationJsonLd,
  serializeJsonLd,
} from './structuredData';

const course = {
  id: 'course-1',
  slug: 'curso-<uno>',
  name: 'Curso <uno>',
  description: 'Aprende <mecanografía>',
  languageCode: 'es' as const,
  localeCode: 'es-latam' as const,
  level: 'beginner' as const,
  lessonsCount: 1,
  supportedLayouts: [],
  estimatedMinutes: null,
};

const lesson = {
  id: 'lesson-1',
  slug: 'leccion-uno',
  title: 'Lección uno',
  description: 'Practica la fila guía.',
  objective: 'Escribir con precisión.',
  order: 1,
  moduleSlug: 'inicio',
  moduleTitle: 'Inicio',
  moduleDescription: '',
  moduleOrder: 1,
};

describe('structured data', () => {
  it('describes the localized web application with a BCP 47 language tag', () => {
    expect(buildWebApplicationJsonLd('es-latam', 'Práctica gratuita')).toEqual(
      expect.objectContaining({
        '@type': 'WebApplication',
        inLanguage: 'es-419',
        isAccessibleForFree: true,
        url: 'https://kisodesk.online/es-latam',
      }),
    );
  });

  it('adds educational information to a course without duplicating the parent context', () => {
    const schema = buildCourseJsonLd('es-latam', course, ['Escribir con precisión.'], false);

    expect(schema).toEqual(
      expect.objectContaining({
        '@type': 'Course',
        educationalLevel: 'beginner',
        inLanguage: 'es',
        isAccessibleForFree: true,
        teaches: ['Escribir con precisión.'],
      }),
    );
    expect(schema).not.toHaveProperty('@context');
  });

  it('connects a learning resource to its canonical course and escapes JSON-LD safely', () => {
    const schema = buildLearningResourceJsonLd('es-latam', course, lesson);

    expect(schema).toEqual(
      expect.objectContaining({
        '@type': 'LearningResource',
        educationalLevel: 'beginner',
        inLanguage: 'es',
        isAccessibleForFree: true,
        teaches: 'Escribir con precisión.',
        isPartOf: expect.objectContaining({ '@type': 'Course' }),
      }),
    );
    expect(serializeJsonLd(schema)).toContain('\\u003cuno>');
  });
});
