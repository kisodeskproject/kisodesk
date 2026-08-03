// app/[lang]/(auth)/login/page.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useRateLimit } from '@/hooks/useRateLimit';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import GoogleButton from '@/components/ui/GoogleButton';

export default function LoginPage() {
  const params = useParams();
  const lang = params.lang as string;
  const safeLang = toSupportedLocale(lang);
  const t = useTranslations(safeLang);

  const { isRateLimited } = useRateLimit(5, 60000);
  const { login, loginWithGoogle, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localError) errorRef.current?.focus();
  }, [localError]);

  const handleGoogleLogin = async () => {
    setGoogleSubmitting(true);
    setLocalError(null);

    try {
      await loginWithGoogle(safeLang);
    } catch {
      setLocalError(t('auth.login.general.googleError') as string);
      setGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isRateLimited()) {
      setLocalError(t('auth.login.general.tooManyAttempts') as string);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setLocalError(t('auth.login.general.requiredFields') as string);
      return;
    }

    setLocalError(null);

    const success = await login(cleanEmail, password);

    if (!success) {
      setLocalError(t('auth.login.general.invalidCredentials') as string);
    }
  };

  return (
    <main className="min-h-screen bg-(--bg-primary) flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <div className="bg-(--bg-card) backdrop-blur-sm border border-(--border-card) rounded-2xl p-8 shadow-(--shadow-card)">
          <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
            {t('auth.login.general.signIn')}
          </h1>

          {localError && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              aria-live="polite"
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <p className="text-sm text-red-400">{localError}</p>
            </div>
          )}

          <GoogleButton
            text={t('auth.login.general.continueWithGoogle') as string}
            loading={googleSubmitting}
            disabled={loading || googleSubmitting}
            onClick={handleGoogleLogin}
          />

          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-(--border-card)" />
            <span className="text-xs text-(--text-secondary)">{t('auth.login.general.or')}</span>
            <div className="h-px flex-1 bg-(--border-card)" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              label={t('auth.login.general.email') as string}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              disabled={loading || googleSubmitting}
            />

            <Input
              type="password"
              name="password"
              label={t('auth.login.general.password') as string}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              disabled={loading || googleSubmitting}
            />

            {/*
              Recuperación de contraseña desactivada temporalmente.
              Reactivar cuando el SMTP esté configurado.

              <div className="text-right">
                <Link
                  href={`/${safeLang}/forgot-password`}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {t('auth.login.general.forgotPassword')}
                </Link>
              </div>
            */}

            <Button type="submit" disabled={loading || googleSubmitting} className="w-full">
              {loading ? t('auth.login.general.sending') : t('auth.login.general.signIn')}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-(--text-secondary)">
              {t('auth.login.general.noAccount')}{' '}
              <Link
                href={`/${safeLang}/register`}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {t('auth.login.general.createAccount')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
