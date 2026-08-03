// front-typing/app/[lang]/marketing/about/page.tsx

import type { Metadata } from 'next';

import AboutPage from './AboutPageClient';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';

interface AboutPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  const t = (key: string) => getTranslation(locale, key);

  return localizedMetadata(lang, '/about', {
    [locale]: {
      title: t('marketing.about.metadata.title'),
      description: t('marketing.about.metadata.description'),
    },
  });
}

export default function Page() {
  return <AboutPage />;
}
