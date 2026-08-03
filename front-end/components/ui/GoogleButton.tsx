// components/auth/GoogleButton.tsx
'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useParams } from 'next/navigation';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';

interface GoogleButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  text: string;
  loading?: boolean;
}

export default function GoogleButton({
  text,
  loading = false,
  disabled,
  className = '',
  ...props
}: GoogleButtonProps) {
  const { lang } = useParams<{ lang: string }>();
  const t = useTranslations(toSupportedLocale(lang));
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={[
        'w-full h-11 rounded-md border border-(--google-button-border) bg-(--google-button-bg) px-3',
        'text-sm font-medium text-(--google-button-text)',
        'transition-colors duration-150',
        'hover:bg-(--google-button-bg-hover)',
        'active:bg-(--google-button-bg-active)',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      ].join(' ')}
      {...props}
    >
      <span className="flex items-center justify-center gap-3">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path
              fill="var(--google-blue)"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
            />
            <path
              fill="var(--google-green)"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
            />
            <path
              fill="var(--google-yellow)"
              d="M3.97 10.72A5.4 5.4 0 0 1 3.69 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z"
            />
            <path
              fill="var(--google-red)"
              d="M9 3.58c1.32 0 2.5.45 3.43 1.35l2.59-2.59C13.46.89 11.42 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
            />
          </svg>
        </span>

        <span className="leading-none">{loading ? t('general.Common.loading') : text}</span>
      </span>
    </button>
  );
}
