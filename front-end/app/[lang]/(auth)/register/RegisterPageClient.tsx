// front-typing/app/[lang]/auth/register/RegisterPageClient.tsx

'use client';

import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useAuth } from '@/hooks/useAuth';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { register } from '@/lib/authClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import GoogleButton from '@/components/ui/GoogleButton';
import TurnstileWidget from '@/components/ui/TurnstileWidget';

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = params.lang as string;
  const safeLang = toSupportedLocale(lang);
  const t = useTranslations(safeLang);
  const { updateUser, loginWithGoogle } = useAuth();

  const { isRateLimited } = useRateLimit(5, 60000);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const hasValidTurnstileToken = !turnstileEnabled || (turnstileToken?.length ?? 0) >= 10;
  const canCreateAccount = acceptedTerms && acceptedPrivacy;

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (searchParams.get('google') === 'consent-required') {
      setError(t('auth.register.general.acceptLegalRequired') as string);
    }
  }, [searchParams, t]);

  const handleGoogleRegister = async () => {
    if (!canCreateAccount) {
      setError(t('auth.register.general.acceptLegalRequired') as string);
      return;
    }

    setGoogleSubmitting(true);
    setError(null);

    try {
      await loginWithGoogle(safeLang, {
        termsAccepted: acceptedTerms,
        privacyAccepted: acceptedPrivacy,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : (t('auth.register.general.googleError') as string),
      );
      setGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isRateLimited()) {
      setError(t('auth.register.general.tooManyAttempts') as string);
      return;
    }

    if (!canCreateAccount) {
      setError(t('auth.register.general.acceptLegalRequired') as string);
      return;
    }

    if (!hasValidTurnstileToken) {
      setError(t('auth.register.general.unknownError') as string);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await register(name, email, password, turnstileToken, {
        termsAccepted: acceptedTerms,
        privacyAccepted: acceptedPrivacy,
      });

      updateUser(result.user);
      router.push(`/${safeLang}/dashboard`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : (t('auth.register.general.unknownError') as string),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-(--bg-primary) flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <div className="bg-(--bg-card) backdrop-blur-sm border border-(--border-card) rounded-2xl p-8 shadow-(--shadow-card)">
          <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
            {t('auth.register.general.createAccount')}
          </h1>

          {error && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              aria-live="polite"
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <GoogleButton
            text={t('auth.register.general.registerWithGoogle') as string}
            loading={googleSubmitting}
            disabled={submitting || googleSubmitting || !canCreateAccount}
            onClick={handleGoogleRegister}
            className="mb-4"
          />

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-(--border-card)" />
            </div>

            <div className="relative flex justify-center text-sm">
              <span className="bg-(--bg-card) px-2 text-(--text-secondary)">
                {t('auth.register.general.or')}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              name="name"
              label={t('auth.register.general.name') as string}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={submitting || googleSubmitting}
            />

            <Input
              id="email"
              name="email"
              type="email"
              label={t('auth.register.general.email') as string}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              disabled={submitting || googleSubmitting}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label={t('auth.register.general.password') as string}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
              disabled={submitting || googleSubmitting}
            />

            <div className="space-y-3 rounded-xl border border-(--border-card) bg-black/10 p-4 text-sm text-(--text-secondary)">
              <p className="leading-relaxed text-(--text-primary)">
                {t('auth.register.general.socialFeaturesNotice')}
              </p>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-500 bg-transparent text-blue-500 focus:ring-blue-500"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  disabled={submitting || googleSubmitting}
                />

                <span>
                  {t('auth.register.general.acceptTermsPrefix')}{' '}
                  <Link
                    href={`/${safeLang}/terms`}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    {t('auth.register.general.acceptTermsLink')}
                  </Link>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-500 bg-transparent text-blue-500 focus:ring-blue-500"
                  checked={acceptedPrivacy}
                  onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                  disabled={submitting || googleSubmitting}
                />

                <span>
                  {t('auth.register.general.acceptPrivacyPrefix')}{' '}
                  <Link
                    href={`/${safeLang}/privacy`}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    {t('auth.register.general.acceptPrivacyLink')}
                  </Link>
                </span>
              </label>
            </div>

            {turnstileEnabled && (
              <TurnstileWidget
                disabled={submitting || googleSubmitting}
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken(undefined)}
                onError={() => setTurnstileToken(undefined)}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={submitting}
              disabled={submitting || googleSubmitting}
              className="shadow-lg"
            >
              {t('auth.register.general.createAccount')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-(--text-secondary)">
              {t('auth.register.general.alreadyHaveAccount')}{' '}
              <Link
                href={`/${safeLang}/login`}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {t('auth.register.general.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
