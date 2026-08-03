// front-typing/components/i18n/LanguageSwitcher.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useTranslations } from '@/lib/i18n';
import { LOCALE_OPTIONS, toSupportedLocale, type Locale } from '@/lib/locales';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  const currentLang = toSupportedLocale(pathname.split('/')[1]);
  const displayedLocale = currentLang;
  const t = useTranslations(currentLang);

  const switchLanguage = (lang: Locale) => {
    const segments = pathname.split('/');
    segments[1] = lang;

    const isDashboardCourseRoute = segments[2] === 'dashboard' && segments[3] === 'courses';
    const isPublicCourseRoute = segments[2] === 'courses';
    const newPath = isDashboardCourseRoute
      ? `/${lang}/dashboard/courses`
      : isPublicCourseRoute
        ? `/${lang}/courses`
        : segments.join('/') || '/';

    router.push(newPath);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) firstOptionRef.current?.focus();
  }, [isOpen]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const currentLabel =
    LOCALE_OPTIONS.find((language) => language.code === displayedLocale)?.label ??
    LOCALE_OPTIONS[0].label;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        aria-label={t('components.i18n.languageSwitcher.general.interfaceLanguage')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="language-switcher-menu"
        className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-(--border-card) bg-(--bg-card) px-3 py-1 text-sm text-(--text-primary) backdrop-blur-sm transition-colors hover:bg-(--bg-card-hover) light:border-slate-600 light:bg-slate-700 light:text-slate-200 light:hover:bg-slate-600 light:hover:text-white"
      >
        {currentLabel}

        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          id="language-switcher-menu"
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className="absolute left-1/2 z-50 mt-2 max-h-[min(70vh,32rem)] w-64 -translate-x-1/2 overflow-y-auto overscroll-contain rounded-xl border border-(--border-card) bg-(--bg-card) shadow-lg backdrop-blur-sm"
        >
          {LOCALE_OPTIONS.map((language) => (
            <button
              key={language.code}
              ref={language === LOCALE_OPTIONS[0] ? firstOptionRef : undefined}
              type="button"
              role="menuitemradio"
              aria-checked={displayedLocale === language.code}
              onClick={() => switchLanguage(language.code)}
              className={`block w-full whitespace-nowrap px-4 py-2 text-left text-sm transition-colors ${
                displayedLocale === language.code
                  ? 'bg-(--accent-blue-bg) text-(--accent-blue)'
                  : 'text-(--text-secondary) hover:bg-(--bg-secondary)'
              }`}
            >
              {language.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
