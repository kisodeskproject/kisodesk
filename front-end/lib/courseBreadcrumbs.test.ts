import { describe, expect, it } from '@jest/globals';

import { buildCourseBreadcrumbJsonLd } from './courseBreadcrumbs';

describe('buildCourseBreadcrumbJsonLd', () => {
  it('uses canonical localized course URLs and the current page as the final breadcrumb', () => {
    expect(
      buildCourseBreadcrumbJsonLd({
        locale: 'es-latam',
        courseName: 'Curso de mecanografía',
        courseSlug: 'curso-espanol',
        coursesLabel: 'Cursos',
        lessonsLabel: 'Lecciones',
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Cursos',
          item: 'https://kisodesk.online/es-latam/courses',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Curso de mecanografía',
          item: 'https://kisodesk.online/es-latam/courses/curso-espanol/lessons',
        },
        { '@type': 'ListItem', position: 3, name: 'Lecciones' },
      ],
    });
  });
});
