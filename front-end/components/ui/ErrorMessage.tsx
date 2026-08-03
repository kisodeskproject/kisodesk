// components/ui/ErrorMessage.tsx
'use client';

import { MdErrorOutline } from 'react-icons/md';
import { useParams } from 'next/navigation';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';

interface ErrorMessageProps {
  error: string | null;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export default function ErrorMessage({
  error,
  onRetry,
  retryText,
  className = '',
}: ErrorMessageProps) {
  const { lang } = useParams<{ lang: string }>();
  const t = useTranslations(toSupportedLocale(lang));
  if (!error) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-md border border-(--accent-red-border) bg-(--accent-red-bg) p-4 text-(--accent-red) transition-opacity duration-200 ${className}`}
    >
      <MdErrorOutline className="mt-0.5 h-5 w-5 shrink-0 text-(--accent-red)" aria-hidden="true" />
      <p className="flex-1 text-sm leading-relaxed">{error}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-(--accent-red) px-3 py-1.5 text-sm font-medium text-(--text-inverse) shadow-sm transition-colors hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-(--accent-red-border) focus:ring-offset-2"
        >
          {retryText ?? t('general.Common.retry')}
        </button>
      )}
    </div>
  );
}
