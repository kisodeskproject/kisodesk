import { siteUrl } from './seo';
import type { Locale } from './locales';

export function buildCourseBreadcrumbJsonLd({
  locale,
  courseName,
  courseSlug,
  coursesLabel,
  lessonsLabel,
}: {
  locale: Locale;
  courseName: string;
  courseSlug: string;
  coursesLabel: string;
  lessonsLabel: string;
}) {
  const courseUrl = `${siteUrl}/${locale}/courses/${encodeURIComponent(courseSlug)}/lessons`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: coursesLabel,
        item: `${siteUrl}/${locale}/courses`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: courseName,
        item: courseUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: lessonsLabel,
      },
    ],
  };
}
