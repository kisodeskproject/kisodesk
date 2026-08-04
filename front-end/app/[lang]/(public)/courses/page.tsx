// front-typing/app/[lang]/public/courses/page.tsx

import type { Metadata } from 'next';

import PublicCoursesCatalog from '@/components/courses/PublicCoursesCatalog';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';
import { getPublicCoursesWithStatus } from '@/lib/publicCourses';

interface CoursesPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: CoursesPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  return localizedMetadata(lang, '/courses', {
    [locale]: {
      title: getTranslation(locale, 'public.courses.metadata.title'),
      description: getTranslation(locale, 'public.courses.metadata.description'),
    },
  });
}

export default async function Page({ params }: CoursesPageProps) {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);
  const result = await getPublicCoursesWithStatus(locale);
  return <PublicCoursesCatalog locale={locale} initialCourses={result.courses} loadError={result.error !== null} />;
}
