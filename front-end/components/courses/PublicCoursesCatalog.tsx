import CoursesExplorer from '@/components/courses/CoursesExplorer';
import { getTranslation } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
import type { PublicCourse } from '@/lib/publicCourses';
import { siteUrl } from '@/lib/seo';

interface PublicCoursesCatalogProps {
  locale: Locale;
  initialCourses: PublicCourse[];
  loadError: boolean;
}

export function buildCatalogJsonLd(locale: Locale, courses: PublicCourse[], catalogTitle: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: catalogTitle,
    numberOfItems: courses.length,
    itemListElement: courses.map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        name: course.name,
        ...(course.description.trim() ? { description: course.description } : {}),
        url: `${siteUrl}/${locale}/courses/${encodeURIComponent(course.slug)}/lessons`,
        inLanguage: course.languageCode,
        provider: {
          '@type': 'Organization',
          name: 'KisoDesk',
          url: siteUrl,
        },
      },
    })),
  };
}

export default function PublicCoursesCatalog({
  locale,
  initialCourses,
  loadError,
}: PublicCoursesCatalogProps) {
  const catalogTitle = getTranslation(locale, 'courses.general.title');
  const structuredData = buildCatalogJsonLd(locale, initialCourses, catalogTitle);

  return (
    <>
      {!loadError && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <CoursesExplorer
        key={locale}
        locale={locale}
        initialCourses={initialCourses}
        initialLoadError={loadError}
      />
    </>
  );
}
