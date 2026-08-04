// front-typing/app/[lang]/marketing/about/AboutPageClient.tsx

'use client';

import { useParams } from 'next/navigation';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import DashboardBackground from '@/components/layout/DashboardBackground';

export default function AboutPage() {
  const params = useParams();
  const lang = params.lang as string;
  const safeLang = toSupportedLocale(lang);
  const t = useTranslations(safeLang);

  const cardClasses =
    'bg-(--bg-card) backdrop-blur-sm rounded-2xl border border-(--border-card) p-6 sm:p-8 mb-6 shadow-(--shadow-card)';

  return (
    <DashboardBackground>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-linear-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {t('marketing.about.general.title')}
          </h1>

          <p className="mt-4 text-(--text-secondary) max-w-2xl mx-auto">
            {t('marketing.about.general.subtitle')}
          </p>
        </div>

        <div className={cardClasses}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🚀</span>

            <h2 className="text-2xl font-semibold text-(--text-primary)">
              {t('marketing.about.general.project_title')}
            </h2>
          </div>

          <div className="space-y-4 text-(--text-secondary) leading-relaxed">
            <p>{t('marketing.about.general.project_text')}</p>
            <p>{t('marketing.about.general.project_status_text')}</p>
          </div>
        </div>

        <div className={cardClasses}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl"></span>

            <h2 className="text-2xl font-semibold text-(--text-primary)">
              {t('marketing.about.general.mission_title')}
            </h2>
          </div>

          <p className="text-(--text-secondary) leading-relaxed">
            {t('marketing.about.general.mission_text')}
          </p>
        </div>

        <div className={cardClasses}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl"></span>

            <h2 className="text-2xl font-semibold text-(--text-primary)">
              {t('marketing.about.general.vision_title')}
            </h2>
          </div>

          <p className="text-(--text-secondary) leading-relaxed">
            {t('marketing.about.general.vision_text')}
          </p>
        </div>

        <div className={cardClasses}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl"></span>

            <h2 className="text-2xl font-semibold text-(--text-primary)">
              {t('marketing.about.general.history_title')}
            </h2>
          </div>

          <p className="text-(--text-secondary) leading-relaxed">
            {t('marketing.about.general.history_text')}
          </p>
        </div>
      </div>
    </DashboardBackground>
  );
}
