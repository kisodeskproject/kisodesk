'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import {
  recordObservedAnonymousSessionStart,
  recordObservedPageView,
  renewFrontendAnalyticsSession,
  startFrontendTelemetry,
  stopFrontendAnalytics,
} from '@/lib/frontendTelemetry';
import { readCookieConsent } from '@/components/legal/cookieConsent';
import { useAuth } from '@/hooks/useAuth';

export default function FrontendObservability() {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Obtener el idioma actual
    const language = document.documentElement.lang || 'unknown';
    const authState = isAuthenticated ? 'authenticated' : 'anonymous';

    startFrontendTelemetry(authState, language);
    const renew = () => {
      const isNew = renewFrontendAnalyticsSession();
      if (isNew && !loading && !isAuthenticated) recordObservedAnonymousSessionStart();
    };
    const handleConsent = () => {
      if (readCookieConsent()?.status === 'accepted') renew();
      else stopFrontendAnalytics();
    };
    window.addEventListener('pointerdown', renew, { passive: true });
    window.addEventListener('keydown', renew);
    window.addEventListener('scroll', renew, { passive: true });
    window.addEventListener('cookie-consent-updated', handleConsent);
    return () => {
      window.removeEventListener('pointerdown', renew);
      window.removeEventListener('keydown', renew);
      window.removeEventListener('scroll', renew);
      window.removeEventListener('cookie-consent-updated', handleConsent);
    };
  }, [isAuthenticated, loading]);

  useEffect(() => {
    // La navegación interna mantiene la misma cookie de sesión
    const isNew = renewFrontendAnalyticsSession();
    if (loading || isAuthenticated) return;
    if (isNew) recordObservedAnonymousSessionStart();
    recordObservedPageView(pathname);
  }, [isAuthenticated, loading, pathname]);
  return null;
}
