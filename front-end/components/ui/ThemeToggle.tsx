'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';

type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'theme';

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove('dark', 'light', 'gray');
  html.classList.add(theme);
  html.style.colorScheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function getNextTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}

function getIcon(theme: Theme) {
  return theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />;
}

export default function ThemeToggle() {
  const { lang } = useParams<{ lang: string }>() ?? {};
  const t = useTranslations(toSupportedLocale(lang));
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const html = document.documentElement;
    const current = html.classList.contains('light') ? 'light' : 'dark';
    applyTheme(current);
    setTheme(current);
  }, []);

  const toggle = () => {
    const next = getNextTheme(theme);
    applyTheme(next);
    setTheme(next);
  };

  const ariaLabel =
    theme === 'dark'
      ? t('components.ui.themeToggle.general.switchToLight')
      : t('components.ui.themeToggle.general.switchToDark');

  return (
    <button
      onClick={toggle}
      className="rounded-lg bg-slate-700/60 light:bg-slate-700 p-2 text-slate-200 hover:bg-slate-600/80 light:hover:bg-slate-600 hover:text-white transition-colors"
      aria-label={ariaLabel}
    >
      {getIcon(theme)}
    </button>
  );
}
