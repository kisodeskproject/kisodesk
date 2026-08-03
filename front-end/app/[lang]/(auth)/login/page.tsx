// front-typing/app/[lang]/auth/login/page.tsx

import type { Metadata } from 'next';

import LoginPage from './LoginPageClient';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';

interface LoginPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  const t = (key: string) => getTranslation(locale, key);

  return {
    ...localizedMetadata(lang, '/login', {
      [locale]: {
        title: t('auth.login.metadata.title'),
        description: t('auth.login.metadata.description'),
      },
    }),
    robots: { index: false, follow: true },
  };
}

export default function Page() {
  return <LoginPage />;
}
