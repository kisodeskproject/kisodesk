// front-typing/app/[lang]/public/courses/page.tsx

import type { Metadata } from 'next';

import CoursesPage from '@/app/[lang]/dashboard/courses/page';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';

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

export default function Page() {
  return <CoursesPage />;
}
