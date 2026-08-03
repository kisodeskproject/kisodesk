// components/ui/Button.tsx
'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { useParams } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  icon,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  const { lang } = useParams<{ lang: string }>() ?? {};
  const t = useTranslations(toSupportedLocale(lang));
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg font-semibold transition-[background-color,border-color,box-shadow,color,filter] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary:
      'bg-(--accent-blue) text-(--text-inverse) hover:brightness-110 focus-visible:ring-(--accent-blue-border) shadow-sm hover:shadow-(--shadow-accent)',
    secondary:
      'bg-(--bg-secondary) text-(--text-primary) hover:bg-(--bg-card-hover) focus-visible:ring-(--border-card)',
    outline:
      'border border-(--border-card) text-(--text-primary) hover:bg-(--bg-secondary) focus-visible:ring-(--border-card)',
    ghost:
      'text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary) focus-visible:ring-(--border-card)',
    danger:
      'bg-(--accent-red) text-(--text-inverse) hover:brightness-110 focus-visible:ring-(--accent-red-border) shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
  };
  const widthClass = fullWidth ? 'w-full' : '';
  const computedAriaLabel =
    ariaLabel || (typeof children === 'string' ? undefined : t('general.Accessibility.button'));

  return (
    <button
      type={type}
      className={cn(baseStyles, variants[variant], sizes[size], widthClass, className)}
      disabled={disabled || loading}
      aria-label={computedAriaLabel}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
