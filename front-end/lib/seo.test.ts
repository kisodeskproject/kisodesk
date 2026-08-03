import { describe, expect, it } from '@jest/globals';

import { localizedMetadata } from './seo';

describe('localizedMetadata', () => {
  it('keeps self-referential canonicals and emits Google-supported hreflang values', () => {
    const metadata = localizedMetadata('es-latam', '/courses', {
      'es-latam': { title: 'Cursos', description: 'Cursos de mecanografía' },
    });
    const alternates = metadata.alternates as {
      canonical: string;
      languages: Record<string, string>;
    };

    expect(alternates.canonical).toBe('https://kisodesk.online/es-latam/courses');
    expect(alternates.languages.es).toBe('https://kisodesk.online/es-latam/courses');
    expect(alternates.languages.en).toBe('https://kisodesk.online/en-US/courses');
    expect(alternates.languages['x-default']).toBe('https://kisodesk.online/es-latam/courses');
    expect(alternates.languages['es-419']).toBeUndefined();
    expect(alternates.languages['es-latam']).toBeUndefined();
  });

  it('does not duplicate the site name supplied by the root title template', () => {
    const metadata = localizedMetadata('en-US', '/practice', {
      'en-US': { title: 'Free Typing Practice | Kiso Desk', description: 'Practice typing.' },
    });

    expect(metadata.title).toBe('Free Typing Practice');
  });
});
