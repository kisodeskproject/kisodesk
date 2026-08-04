// components/layout/Footer.tsx

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FaEnvelope, FaGithub } from 'react-icons/fa6';

import { toSupportedLocale, useTranslations } from '@/lib/i18n';

export default function Footer() {
  const params = useParams();
  const lang = params.lang as string;
  const t = useTranslations(toSupportedLocale(lang));

  const contactEmail = 'kisodesk.project@gmail.com';
  const githubUrl = 'https://github.com/kisodeskproject/kisodesk';

  return (
    <footer className="relative z-10 mt-[-50px] border-t border-slate-700 bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-8 md:grid-cols-4 md:gap-8">
          <div>
            <p className="mb-4 font-semibold text-slate-100">
              {t('components.layout.footer.general.product')}
            </p>

            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/${lang}/courses`}
                  className="text-slate-300 transition-colors hover:text-sky-400"
                >
                  {t('components.layout.footer.general.lessons')}
                </Link>
              </li>

              <li>
                <Link
                  href={`/${lang}/ranking`}
                  className="text-slate-300 transition-colors hover:text-sky-400"
                >
                  {t('components.layout.footer.general.ranking')}
                </Link>
              </li>

            </ul>
          </div>

          <div>
            <p className="mb-4 font-semibold text-slate-100">
              {t('components.layout.footer.general.project')}
            </p>

            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/${lang}/about`}
                  className="text-slate-300 transition-colors hover:text-sky-400"
                >
                  {t('components.layout.footer.general.aboutKisoDesk')}
                </Link>
              </li>

              {toSupportedLocale(lang) === 'es-latam' && (
                <li>
                  <Link
                    href="/es-latam/how-it-works"
                    className="text-slate-300 transition-colors hover:text-sky-400"
                  >
                    {t('howItWorks.general.footerLink')}
                  </Link>
                </li>
              )}

              <li>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-300 transition-colors hover:text-sky-400"
                >
                  <FaGithub className="h-4 w-4 text-sky-400" />
                  {t('components.layout.footer.general.github')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-semibold text-slate-100">
              {t('components.layout.footer.general.legal')}
            </p>

            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/${lang}/privacy`}
                  className="text-slate-300 transition-colors hover:text-sky-400"
                >
                  {t('components.layout.footer.general.privacyPolicy')}
                </Link>
              </li>

              <li>
                <Link
                  href={`/${lang}/terms`}
                  className="text-slate-300 transition-colors hover:text-sky-400"
                >
                  {t('components.layout.footer.general.termsOfUse')}
                </Link>
              </li>

              <li>
                <Link
                  href={`/${lang}/cookies`}
                  className="text-slate-300 transition-colors hover:text-sky-400"
                >
                  {t('components.layout.footer.general.cookiePolicy')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-semibold text-slate-100">
              {t('components.layout.footer.general.contact')}
            </p>

            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-2 text-slate-300 transition-colors hover:text-sky-400"
                >
                  <FaEnvelope className="h-4 w-4 text-sky-400" />
                  {contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
          <p>
            {t('components.layout.footer.general.copyright', {
              year: 2026,
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}
