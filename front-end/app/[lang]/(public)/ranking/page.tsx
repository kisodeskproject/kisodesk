// front-typing/app/[lang]/public/ranking/page.tsx

import type { Metadata } from 'next';

import RankingPage from '@/app/[lang]/dashboard/ranking/page';
import { toSupportedLocale } from '@/lib/locales';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';

interface RankingPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: RankingPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  return localizedMetadata(lang, '/ranking', {
    [locale]: {
      title: getTranslation(locale, 'public.ranking.metadata.title'),
      description: getTranslation(locale, 'public.ranking.metadata.description'),
    },
  });
}

export default function Page() {
  return <RankingPage />;
}
