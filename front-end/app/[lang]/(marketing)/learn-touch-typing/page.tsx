import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import DashboardBackground from '@/components/layout/DashboardBackground';
import JsonLd from '@/components/seo/JsonLd';
import { LEARN_TYPING_SEO_CONTENT } from '@/lib/learnTypingSeoContent';
import { getHrefLang, toSupportedLocale } from '@/lib/locales';
import { siteUrl } from '@/lib/seo';
import { buildFaqPageJsonLd } from '@/lib/structuredData';

const PATH = '/learn-touch-typing';

interface LearnTouchTypingPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LearnTouchTypingPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);
  const content = LEARN_TYPING_SEO_CONTENT[locale];

  if (!content) {
    return {
      robots: { index: false, follow: true },
    };
  }

  const url = `${siteUrl}/${locale}${PATH}`;
  const publishedLocales = Object.keys(LEARN_TYPING_SEO_CONTENT) as Array<
    keyof typeof LEARN_TYPING_SEO_CONTENT
  >;
  const languages = Object.fromEntries(
    publishedLocales.map((publishedLocale) => [
      getHrefLang(publishedLocale),
      `${siteUrl}/${publishedLocale}${PATH}`,
    ]),
  );

  return {
    title: content.title,
    description: content.metaDescription,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: 'website',
      url,
      title: content.title,
      description: content.metaDescription,
      siteName: 'Kiso Desk',
    },
    twitter: {
      card: 'summary',
      title: content.title,
      description: content.metaDescription,
    },
  };
}

export default async function LearnTouchTypingPage({ params }: LearnTouchTypingPageProps) {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);
  const content = LEARN_TYPING_SEO_CONTENT[locale];

  if (!content) notFound();

  const url = `${siteUrl}/${locale}${PATH}`;

  return (
    <DashboardBackground>
      <JsonLd data={buildFaqPageJsonLd(url, content.faq)} />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-(--text-primary) sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-(--text-secondary)">
            {content.intro}
          </p>
        </header>

        <section className="mt-12 border-y border-(--border-card) py-8" aria-labelledby="what-is-it-title">
          <h2 id="what-is-it-title" className="text-2xl font-semibold text-(--text-primary)">
            {content.labels.whatIsItTitle}
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-(--text-secondary)">{content.whatIsIt}</p>
        </section>

        <section className="mt-12" aria-labelledby="why-it-matters-title">
          <h2 id="why-it-matters-title" className="text-2xl font-semibold text-(--text-primary)">
            {content.labels.whyItMattersTitle}
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-(--text-secondary)">{content.whyItMatters}</p>
        </section>

        <section className="mt-12" aria-labelledby="steps-title">
          <h2 id="steps-title" className="text-2xl font-semibold text-(--text-primary)">
            {content.labels.stepsTitle}
          </h2>
          <ol className="mt-4 space-y-3">
            {content.steps.map((step, index) => (
              <li key={step} className="flex gap-3 leading-7 text-(--text-secondary)">
                <span className="font-semibold text-(--text-primary)">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12" aria-labelledby="mistakes-title">
          <h2 id="mistakes-title" className="text-2xl font-semibold text-(--text-primary)">
            {content.labels.commonMistakesTitle}
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-(--text-secondary)">{content.commonMistakes}</p>
        </section>

        <section className="mt-12" aria-labelledby="tips-title">
          <h2 id="tips-title" className="text-2xl font-semibold text-(--text-primary)">
            {content.labels.tipsTitle}
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-(--text-secondary)">{content.tips}</p>
        </section>

        <section className="mt-12" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-2xl font-semibold text-(--text-primary)">
            {content.labels.faqTitle}
          </h2>
          <div className="mt-5 divide-y divide-(--border-card) border-y border-(--border-card)">
            {content.faq.map((item) => (
              <div key={item.question} className="py-6">
                <h3 className="text-lg font-semibold text-(--text-primary)">{item.question}</h3>
                <p className="mt-2 max-w-3xl leading-7 text-(--text-secondary)">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12">
          <Link
            href={`/${locale}/courses`}
            className="inline-flex rounded-lg bg-(--accent-blue) px-5 py-3 font-semibold text-(--text-inverse) transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-blue)"
          >
            {content.labels.ctaLabel}
          </Link>
        </div>
      </main>
    </DashboardBackground>
  );
}
