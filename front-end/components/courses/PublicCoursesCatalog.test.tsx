import { describe, expect, it } from '@jest/globals';

import { buildCatalogJsonLd } from './PublicCoursesCatalog';

describe('buildCatalogJsonLd', () => {
  it('keeps every catalog item while omitting an empty description', () => {
    const catalog = buildCatalogJsonLd(
      'es-latam',
      [
        {
          id: 'curso-1',
          slug: 'curso-uno',
          name: 'Curso <uno>',
          description: '',
          languageCode: 'es',
          localeCode: 'es-latam',
          level: 'beginner',
          lessonsCount: 8,
          supportedLayouts: [],
          estimatedMinutes: null,
        },
      ],
      'Cursos',
    );

    expect(catalog.numberOfItems).toBe(1);
    expect(catalog.itemListElement[0].item).toEqual(
      expect.objectContaining({
        inLanguage: 'es',
        url: 'https://kisodesk.online/es-latam/courses/curso-uno/lessons',
      }),
    );
    expect(catalog.itemListElement[0].item).not.toHaveProperty('description');
    expect(JSON.stringify(catalog).replace(/</g, '\\u003c')).toContain('\\u003cuno>');
  });
});
