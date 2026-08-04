import CoursesExplorer from '@/components/courses/CoursesExplorer';
import { getTranslation } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';
import type { PublicCourse } from '@/lib/publicCourses';
import JsonLd from '@/components/seo/JsonLd';
import { buildCourseJsonLd } from '@/lib/structuredData';

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
      item: buildCourseJsonLd(locale, course, [], false),
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
        <JsonLd data={structuredData} />
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
