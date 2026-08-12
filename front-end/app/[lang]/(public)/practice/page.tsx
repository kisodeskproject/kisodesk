// front-typing/app/[lang]/public/practice/page.tsx

import type { Metadata } from 'next';

import PracticePage from '@/app/[lang]/dashboard/practice/page';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';
import { PRACTICE_SEO_CONTENT } from '@/lib/practiceSeoContent';

interface PracticePageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PracticePageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  return localizedMetadata(lang, '/practice', {
    [locale]: {
      title: getTranslation(locale, 'public.practice.metadata.title'),
      description: PRACTICE_SEO_CONTENT[locale].intro,
    },
  });
}

export default async function Page() {
  return <PracticePage />;
}
