// app/[lang]/not-found.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import Button from '@/components/ui/Button';

export default function NotFound() {
  const params = useParams();
  const lang = params.lang as string;
  const t = useTranslations(lang as never);

  return (
    <div className="min-h-screen bg-var(--bg-primary) flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-9xl font-bold bg-linear-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              404
            </h1>
            <div className="absolute inset-0 blur-2xl bg-blue-500/20 rounded-full" />
          </div>
          <div className="h-1 w-24 bg-linear-to-r from-blue-500 to-purple-500 mx-auto my-4 rounded-full" />
          <h2 className="text-2xl font-semibold text-var(--text-primary) mt-4">
            {t('notFound.general.title')}
          </h2>
          <p className="text-var(--text-secondary) mt-2 max-w-md mx-auto">
            {t('notFound.general.description')}
          </p>
        </div>

        <div className="space-y-4">
          <Link href={`/${lang}`}>
            <Button
              variant="primary"
              className="min-w-[200px] shadow-lg shadow-blue-500/30 hover:scale-105 transition"
            >
              {t('notFound.general.backHome')}
            </Button>
          </Link>

          <div className="flex justify-center gap-4 mt-6 text-sm text-var(--text-tertiary)">
            <Link
              href={`/${lang}/dashboard`}
              className="hover:text-blue-400 transition-colors duration-200"
            >
              {t('notFound.general.dashboard')}
            </Link>
            <span className="text-var(--text-tertiary)">•</span>
            <Link
              href={`/${lang}/dashboard/courses`}
              className="hover:text-blue-400 transition-colors duration-200"
            >
              {t('notFound.general.lessons')}
            </Link>
            <span className="text-var(--text-tertiary)">•</span>
            <Link
              href={`/${lang}/dashboard/ranking`}
              className="hover:text-blue-400 transition-colors duration-200"
            >
              {t('notFound.general.ranking')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
