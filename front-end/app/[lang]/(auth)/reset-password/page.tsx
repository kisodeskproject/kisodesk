// front-typing/app/[lang]/auth/reset-password/page.tsx

'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { resetPassword } from '@/lib/authClient';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';

function ResetPasswordForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = toSupportedLocale(params.lang);
  const t = useTranslations(lang);
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError(t('auth.resetPassword.general.invalidLink'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.resetPassword.general.passwordTooShort'));
      return;
    }

    if (password !== confirmation) {
      setError(t('auth.resetPassword.general.passwordsDoNotMatch'));
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch {
      setError(t('auth.resetPassword.general.invalidOrExpired'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-(--bg-primary) flex items-center justify-center">
        <div className="bg-(--bg-card) border border-(--border-card) w-full max-w-md rounded-2xl p-8 text-center shadow-(--shadow-card) mx-4">
          <h1 className="text-(--text-primary) mb-2 text-2xl font-bold">
            {t('auth.resetPassword.general.successTitle')}
          </h1>

          <p className="text-(--text-secondary) mb-6">
            {t('auth.resetPassword.general.successMessage')}
          </p>

          <Link
            href={`/${lang}/login`}
            className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            {t('auth.resetPassword.general.backToLogin')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--bg-primary) flex items-center justify-center">
      <div className="bg-(--bg-card) border border-(--border-card) w-full max-w-md rounded-2xl p-8 shadow-(--shadow-card) mx-4">
        <h1 className="text-(--text-primary) mb-2 text-2xl font-bold">
          {t('auth.resetPassword.general.title')}
        </h1>

        <p className="text-(--text-secondary) mb-6">
          {t('auth.resetPassword.general.instructions')}
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            label={t('auth.resetPassword.general.newPassword')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            required
            disabled={submitting || !token}
          />

          <Input
            type="password"
            label={t('auth.resetPassword.general.confirmPassword')}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            required
            disabled={submitting || !token}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={submitting}
            disabled={submitting || !token}
          >
            {t('auth.resetPassword.general.submit')}
          </Button>
        </form>

        {!token && (
          <div className="mt-6 text-center">
            <p className="text-sm text-(--text-secondary)">
              {t('auth.resetPassword.general.requestNewLink')}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-(--bg-primary)" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
