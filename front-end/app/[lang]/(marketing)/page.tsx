// front-typing/app/[lang]/marketing/page.tsx

import type { Metadata } from 'next';

import MarketingPage from './MarketingPageClient';
import PublicPageLinks from '@/components/seo/PublicPageLinks';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';

interface MarketingPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: MarketingPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  return localizedMetadata(lang, '', {
    [locale]: {
      title: getTranslation(locale, 'marketing.page.metadata.title'),
      description: getTranslation(locale, 'marketing.page.metadata.description'),
    },
  });
}

export default async function Page({ params }: MarketingPageProps) {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  return (
    <>
      <MarketingPage />
      <PublicPageLinks locale={locale} current="home" />
    </>
  );
}
