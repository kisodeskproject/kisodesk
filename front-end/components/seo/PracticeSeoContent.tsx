import Link from 'next/link';

import { PRACTICE_SEO_CONTENT } from '@/lib/practiceSeoContent';
import { PRACTICE_QUESTIONS } from '@/lib/publicCitationContent';
import { getTranslation } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';

export default function PracticeSeoContent({ locale }: { locale: Locale }) {
  const content = PRACTICE_SEO_CONTENT[locale];
  const questions = PRACTICE_QUESTIONS[locale];

  return (
    <article className="mx-auto max-w-4xl space-y-6 px-6 pt-6 text-(--text-primary)">
      <header>
        <h1 className="text-3xl font-bold">{content.title}</h1>
        <p className="mt-3 text-(--text-secondary)">{content.intro}</p>
      </header>
      <section>
        <h2 className="text-xl font-semibold">{questions.measures}</h2>
        <p className="mt-2 text-(--text-secondary)">{content.intro}</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">{questions.metrics}</h2>
        <p className="mt-2 text-(--text-secondary)">{content.metrics}</p>
        <p className="mt-2 text-(--text-secondary)">
          Accuracy = correct characters ÷ typed characters × 100
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">{questions.start}</h2>
        <p className="mt-2 text-(--text-secondary)">{content.instructions}</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">{questions.results}</h2>
        <p className="mt-2 text-(--text-secondary)">{content.results}</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">{questions.improve}</h2>
        <p className="mt-2 text-(--text-secondary)">{content.tips}</p>
      </section>
      <nav aria-label="Practice resources" className="flex flex-wrap gap-3 pb-2">
        <Link href={`/${locale}/courses`} className="underline underline-offset-4">
          {getTranslation(locale, 'courses.general.title')}
        </Link>
        <Link href={`/${locale}/ranking`} className="underline underline-offset-4">
          {getTranslation(locale, 'ranking.general.title')}
        </Link>
      </nav>
    </article>
  );
}
