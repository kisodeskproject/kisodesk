// front-typing/app/[lang]/marketing/about/AboutPageClient.tsx

'use client';

import { useParams } from 'next/navigation';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { ABOUT_IDENTITY_CONTENT } from '@/lib/aboutIdentityContent';
import DashboardBackground from '@/components/layout/DashboardBackground';

export default function AboutPage() {
  const params = useParams();
  const lang = params.lang as string;
  const safeLang = toSupportedLocale(lang);
  const t = useTranslations(safeLang);
  const content = ABOUT_IDENTITY_CONTENT[safeLang];

  const cardClasses =
    'bg-(--bg-card) backdrop-blur-sm rounded-2xl border border-(--border-card) p-6 sm:p-8 mb-6 shadow-(--shadow-card)';

  return (
    <DashboardBackground>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-linear-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            KisoDesk
          </h1>

          <p className="mt-4 text-(--text-secondary) max-w-2xl mx-auto">
            {content.summary}
          </p>
        </header>

        <div className={cardClasses}>
          <div className="space-y-4 text-(--text-secondary) leading-relaxed">
            <h2 className="text-2xl font-semibold text-(--text-primary)">KisoDesk</h2>
            <p>{content.publicFeatures}</p>
            <p>
              <span className="font-medium text-(--text-primary)">URL: </span>
              <a href="https://kisodesk.online" className="underline underline-offset-4">https://kisodesk.online</a>
            </p>
          </div>
        </div>

        <div className={cardClasses}>
          <h2 className="text-2xl font-semibold text-(--text-primary)">{t('courses.general.title')}</h2>
          <p className="mt-4 text-(--text-secondary) leading-relaxed">{content.courses}</p>
        </div>

        <div className={cardClasses}>
          <h2 className="text-2xl font-semibold text-(--text-primary)">{content.languagesTitle}</h2>
          <p className="mt-4 text-(--text-secondary) leading-relaxed">{content.languages}</p>
        </div>
      </div>
    </DashboardBackground>
  );
}
