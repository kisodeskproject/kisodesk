// front-typing/app/[lang]/auth/register/page.tsx

import type { Metadata } from 'next';

import RegisterPage from './RegisterPageClient';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';

interface RegisterPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: RegisterPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  const t = (key: string) => getTranslation(locale, key);

  return {
    ...localizedMetadata(lang, '/register', {
      [locale]: {
        title: t('auth.register.metadata.title'),
        description: t('auth.register.metadata.description'),
      },
    }),
    robots: { index: false, follow: true },
  };
}

export default function Page() {
  return <RegisterPage />;
}
