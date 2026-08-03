// components/layout/Header.tsx

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, Menu } from 'lucide-react';

import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';

interface HeaderProps {
  user?: {
    username?: string;
    name?: string;
    email?: string;
  } | null;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  onMenuToggle?: () => void;
  showCoursesShortcut?: boolean;
  hideLanguageSwitcher?: boolean;
  showBrand?: boolean;
}

export default function Header({
  user,
  isAuthenticated,
  onLogout,
  onMenuToggle,
  showCoursesShortcut = false,
  hideLanguageSwitcher = false,
  showBrand = false,
}: HeaderProps) {
  const params = useParams();
  const pathname = usePathname();
  const auth = useAuth();
  const lang = params.lang as string;
  const t = useTranslations(toSupportedLocale(lang));

  const isMarketing =
    pathname === `/${lang}` ||
    pathname.startsWith(`/${lang}/about`) ||
    pathname.startsWith(`/${lang}/privacy`) ||
    pathname.startsWith(`/${lang}/terms`) ||
    pathname.startsWith(`/${lang}/cookies`);

  const isLanding = pathname === `/${lang}`;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsUserMenuOpen(false);
        userMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const headerClasses = isMarketing
    ? `sticky top-0 z-50 border-b border-(--border-card) ${
        isLanding ? 'light:border-(--landing-card-border)' : ''
      }`
    : 'absolute top-0 right-0 left-0 z-50 border-b border-(--border-card)';

  const resolvedUser = user ?? auth.user;
  const resolvedIsAuthenticated = isAuthenticated ?? auth.isAuthenticated;
  const resolvedLogout = onLogout ?? auth.logout;

  const displayName =
    resolvedUser?.name ||
    resolvedUser?.username ||
    resolvedUser?.email ||
    t('components.layout.header.general.defaultUser');

  return (
    <header className={headerClasses}>
      <a
        href="#main-content"
        className="sr-only absolute top-4 left-4 z-[60] rounded-md bg-(--bg-card) px-4 py-2 text-(--text-primary) shadow-lg focus:not-sr-only focus:ring-2 focus:ring-(--accent-blue-border) focus:outline-none"
      >
        {t('components.layout.header.general.skipToMainContent')}
      </a>

      <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-[0.85px] light:bg-(--header-light-background)" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-0">
        <div className="flex h-16 items-center justify-between">
          {isMarketing || showBrand ? (
            <Link href={`/${lang}`} className="flex items-center space-x-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-700 light:bg-(--header-light-background)">
                <Image
                  src="/icon.png"
                  alt=""
                  width={48}
                  height={48}
                  sizes="48px"
                  unoptimized
                  className="h-12 w-12 object-contain"
                  aria-hidden="true"
                />
              </div>

              <span className="text-2xl font-bold text-(--text-primary) dark:text-(--text-inverse)">KisoDesk</span>
            </Link>
          ) : showCoursesShortcut ? (
            <Link
              href={`/${lang}/dashboard/courses`}
              aria-label={t('components.layout.header.general.courses')}
              title={t('components.layout.header.general.courses')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-(--border-card) bg-(--bg-card) text-(--text-secondary) shadow-sm backdrop-blur-sm transition-colors hover:border-(--accent-blue-border) hover:bg-(--accent-blue-bg) hover:text-(--accent-blue)"
            >
              <BookOpen size={21} />
            </Link>
          ) : (
            <div className="w-10" />
          )}

          <div className="flex items-center space-x-3">
            <div className="scale-100">
              <ThemeToggle />
            </div>

            {!hideLanguageSwitcher && (
              <div className="px-3 text-base">
                <LanguageSwitcher />
              </div>
            )}

            {resolvedIsAuthenticated ? (
              <>
                <div ref={userMenuRef} className="relative hidden md:block">
                  <button
                    ref={userMenuButtonRef}
                    type="button"
                    aria-label={t('components.layout.header.general.userMenu')}
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                    aria-controls="user-menu"
                    onClick={() => setIsUserMenuOpen((current) => !current)}
                    className="flex items-center space-x-2 text-(--text-secondary) transition-colors hover:text-(--text-primary) focus:ring-2 focus:ring-(--accent-blue-border) focus:ring-offset-2 focus:outline-none"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-purple-500">
                      <span className="text-sm font-medium text-(--text-inverse)">
                        {displayName.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>

                    <span className="text-sm font-medium">{displayName}</span>
                  </button>

                  <div
                    id="user-menu"
                    role="menu"
                    aria-label={t('components.layout.header.general.userMenu')}
                    className={`absolute right-0 z-50 mt-2 w-56 rounded-lg border border-(--border-card) bg-(--bg-card) shadow-lg transition-all ${
                      isUserMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
                    }`}
                  >
                    <Link
                      href={`/${lang}/dashboard/profile`}
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block rounded-t-lg px-4 py-2 text-sm text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary) focus:ring-2 focus:ring-(--accent-blue-border) focus:outline-none focus:ring-inset"
                    >
                      {t('components.layout.header.general.profile')}
                    </Link>

                    <button
                      onClick={resolvedLogout}
                      role="menuitem"
                      className="block w-full rounded-b-lg px-4 py-2 text-left text-sm text-(--accent-red) hover:bg-(--bg-secondary) hover:brightness-110 focus:ring-2 focus:ring-(--accent-blue-border) focus:outline-none focus:ring-inset"
                    >
                      {t('components.layout.header.general.logout')}
                    </button>
                  </div>
                </div>

              </>
            ) : (
              <>
                {isMarketing ? (
                  <>
                    <Link href={`/${lang}/login`}>
                      <span className="inline-flex rounded-lg border border-(--border-card) bg-(--bg-card) px-3 py-1.5 text-sm font-medium text-(--text-primary) backdrop-blur-sm transition-colors hover:bg-(--bg-card-hover) light:border-slate-600 light:bg-slate-700 light:text-slate-200 light:hover:bg-slate-600 light:hover:text-white">
                        {t('components.layout.header.general.login')}
                      </span>
                    </Link>

                    <Link
                      href={`/${lang}/register`}
                      className="inline-flex items-center justify-center rounded-lg border-0 bg-linear-to-r from-blue-500 to-violet-500 px-3 py-1.5 text-sm font-semibold text-white shadow-none hover:from-blue-600 hover:to-violet-600 hover:brightness-100 hover:shadow-none focus:ring-2 focus:ring-(--accent-blue-border) focus:ring-offset-2 focus:outline-none"
                    >
                      {t('components.layout.header.general.register')}
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`/${lang}/login`}
                    className="rounded-lg border border-(--border-card) bg-(--bg-card) px-3 py-1 text-sm font-medium text-(--text-primary) backdrop-blur-sm transition-colors hover:bg-(--bg-card-hover) light:border-slate-600 light:bg-slate-700 light:text-slate-200 light:hover:bg-slate-600 light:hover:text-white"
                  >
                    {t('components.layout.header.general.login')}
                  </Link>
                )}
              </>
            )}

            {!isMarketing && onMenuToggle && (
              <button
                type="button"
                onClick={onMenuToggle}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary) md:hidden"
                aria-label={t('components.layout.header.general.menuToggle')}
              >
                <Menu size={22} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
