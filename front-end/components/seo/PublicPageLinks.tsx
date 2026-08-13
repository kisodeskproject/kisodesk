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
    <nav aria-label="Public pages" className="relative z-10 mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="kisodesk-surface light:border-(--landing-card-border) p-5">
        <h2 className="text-lg font-semibold text-(--text-primary) sm:text-xl">
          {getTranslation(locale, 'marketing.page.general.learn')}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.id}>
              <Link
                href={link.href}
                className="inline-flex rounded-lg border border-(--border-card) bg-(--bg-card) px-4 py-2 text-(--text-primary) transition-colors hover:bg-(--bg-card-hover)"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
