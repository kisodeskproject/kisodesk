// components/ranking/LanguageFilter.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { LOCALE_OPTIONS, type Locale } from '@/lib/locales';

interface LanguageFilterProps {
  selectedLanguage: Locale | 'global';
  onChange: (lang: Locale | 'global') => void;
  t: (key: string) => string;
}

export default function LanguageFilter({ selectedLanguage, onChange, t }: LanguageFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node))
        setIsDropdownOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedLabel =
    selectedLanguage === 'global'
      ? t('ranking.general.allLanguages')
      : (LOCALE_OPTIONS.find((locale) => locale.code === selectedLanguage)?.label ?? selectedLanguage);

  return (
    <div className="w-full rounded-xl border border-(--border-card) bg-(--bg-primary) px-3 py-2 light:bg-(--bg-secondary)">
      <div className="flex items-center justify-between w-full">
        <span className="text-(--text-secondary) text-sm">{t('ranking.general.filterByLanguage')}:</span>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3 py-1 bg-(--bg-secondary) border border-(--border-card) rounded-lg text-(--text-primary) flex items-center gap-2 hover:bg-(--bg-card-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--accent-blue-border) text-sm"
          >
            <span>
              {selectedLabel}
            </span>
            <ChevronDown size={14} />
          </button>
          {isDropdownOpen && (
            <ul className="absolute right-0 z-50 mt-1 w-40 bg-(--bg-card) border border-(--border-card) rounded-lg shadow-lg overflow-hidden">
              <li
                onClick={() => {
                  onChange('global');
                  setIsDropdownOpen(false);
                }}
                className="cursor-pointer px-3 py-1.5 text-sm text-(--text-primary) hover:bg-(--bg-secondary)"
              >
                {t('ranking.general.allLanguages')}
              </li>
              {LOCALE_OPTIONS.map((language) => (
                <li
                  key={language.code}
                  onClick={() => {
                    onChange(language.code);
                    setIsDropdownOpen(false);
                  }}
                  className="cursor-pointer px-3 py-1.5 text-sm text-(--text-primary) hover:bg-(--bg-secondary)"
                >
                  {language.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
