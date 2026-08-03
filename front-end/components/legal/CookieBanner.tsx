// components/legal/CookieBanner.tsx

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useTranslations } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';

import { CookieConsentDecision, readCookieConsent, saveCookieConsent } from './cookieConsent';

type CookieBannerProps = {
  lang: string;
};

export default function CookieBanner({ lang }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);
  const t = useTranslations(toSupportedLocale(lang));

  useEffect(() => {
    try {
      setVisible(readCookieConsent() === null);
    } catch {
      setVisible(true);
    }
  }, []);

  const persistDecision = (decision: CookieConsentDecision) => {
    try {
      saveCookieConsent(decision);
    } catch {
      // localStorage puede no estar disponible en algunos navegadores.
    }

    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-(--border-card) bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 text-sm text-slate-200 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-white">
            {t('components.legal.cookieBanner.general.title')}
          </p>

          <p className="leading-relaxed">
            {t('components.legal.cookieBanner.general.description')}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link href={`/${lang}/privacy`} className="text-blue-400 hover:text-blue-300">
              {t('components.legal.cookieBanner.general.privacyNotice')}
            </Link>

            <Link href={`/${lang}/cookies`} className="text-blue-400 hover:text-blue-300">
              {t('components.legal.cookieBanner.general.cookiePolicy')}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => persistDecision('accepted')}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500"
          >
            {t('components.legal.cookieBanner.general.accept')}
          </button>

          <button
            type="button"
            onClick={() => persistDecision('rejected')}
            className="rounded-lg border border-slate-600 px-4 py-2 font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            {t('components.legal.cookieBanner.general.reject')}
          </button>
        </div>
      </div>
    </div>
  );
}
