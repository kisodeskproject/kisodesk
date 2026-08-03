import Link from 'next/link';

import { getTranslation } from '@/lib/i18n';
import type { Locale } from '@/lib/locales';

type PublicPageLinksProps = {
  locale: Locale;
  current: 'courses' | 'practice' | 'ranking' | 'home';
};

/**
 * Server-rendered, crawlable navigation between the public acquisition pages.
 * It intentionally uses ordinary anchors through Next Link rather than client
 * click handlers so every destination is discoverable without JavaScript.
 */
export default function PublicPageLinks({ locale, current }: PublicPageLinksProps) {
  const links = [
    { id: 'practice', href: `/${locale}/practice`, label: getTranslation(locale, 'practice.general.title') },
    { id: 'courses', href: `/${locale}/courses`, label: getTranslation(locale, 'courses.general.title') },
    { id: 'ranking', href: `/${locale}/ranking`, label: getTranslation(locale, 'ranking.general.title') },
  ].filter((link) => link.id !== current);

  return (
    <nav aria-label="Public pages" className="mx-auto max-w-4xl px-6 pb-10">
      <h2 className="text-xl font-semibold text-(--text-primary)">
        {getTranslation(locale, 'marketing.page.general.learn')}
      </h2>
      <ul className="mt-3 flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.id}>
            <Link
              href={link.href}
              className="inline-flex rounded-lg border border-(--border-card) px-4 py-2 text-(--text-primary) hover:bg-(--bg-card-hover)"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
