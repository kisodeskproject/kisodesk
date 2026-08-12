import type { Metadata } from 'next';
import Link from 'next/link';

import DashboardBackground from '@/components/layout/DashboardBackground';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';
import { localizedMetadata } from '@/lib/seo';

interface HowItWorksPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: HowItWorksPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  return localizedMetadata(lang, '/how-it-works', {
    [locale]: {
      title: getTranslation(locale, 'howItWorks.metadata.title'),
      description: getTranslation(locale, 'howItWorks.metadata.description'),
    },
  });
}

export default async function HowItWorksPage({ params }: HowItWorksPageProps) {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);
  const t = (key: string) => getTranslation(locale, key);

  const steps = [
    ['stepPracticeTitle', 'stepPracticeText'],
    ['stepSignalsTitle', 'stepSignalsText'],
    ['stepPriorityTitle', 'stepPriorityText'],
    ['algorithmTitle', 'algorithmText'],
  ] as const;

  return (
    <DashboardBackground>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-(--text-primary) sm:text-5xl">
            {t('howItWorks.general.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-(--text-secondary)">
            {t('howItWorks.general.subtitle')}
          </p>
        </header>

        <section className="mt-12 border-y border-(--border-card) py-8" aria-labelledby="why-title">
          <h2 id="why-title" className="text-2xl font-semibold text-(--text-primary)">
            {t('howItWorks.general.whyTitle')}
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-(--text-secondary)">
            {t('howItWorks.general.whyText')}
          </p>
        </section>

        <section className="mt-12" aria-labelledby="process-title">
          <h2 id="process-title" className="text-2xl font-semibold text-(--text-primary)">
            {t('howItWorks.general.processTitle')}
          </h2>
          <div className="mt-5 divide-y divide-(--border-card) border-y border-(--border-card)">
            {steps.map(([titleKey, textKey]) => (
              <section key={titleKey} className="py-6">
                <h3 className="text-lg font-semibold text-(--text-primary)">
                  {t(`howItWorks.general.${titleKey}`)}
                </h3>
                <p className="mt-2 max-w-3xl leading-7 text-(--text-secondary)">
                  {t(`howItWorks.general.${textKey}`)}
                </p>
              </section>
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="language-title">
          <h2 id="language-title" className="text-2xl font-semibold text-(--text-primary)">
            {t('howItWorks.general.languageTitle')}
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-(--text-secondary)">
            {t('howItWorks.general.languageText')}
          </p>
        </section>

        <section className="mt-12" aria-labelledby="difference-title">
          <h2 id="difference-title" className="text-2xl font-semibold text-(--text-primary)">
            {t('howItWorks.general.differenceTitle')}
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-(--text-secondary)">
            {t('howItWorks.general.differenceText')}
          </p>
        </section>

        <div className="mt-12">
          <Link
            href={`/${locale}/practice`}
            className="inline-flex rounded-lg bg-(--accent-blue) px-5 py-3 font-semibold text-(--text-inverse) transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-blue)"
          >
            {t('howItWorks.general.practiceAction')}
          </Link>
        </div>
      </main>
    </DashboardBackground>
  );
}
