export const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent';

export type CookieConsentDecision = 'accepted' | 'rejected';

export type CookieConsent = {
  status: CookieConsentDecision;
  updatedAt: string;
  version: 1;
};

export function readCookieConsent(): CookieConsent | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!stored) return null;

    if (stored === 'accepted' || stored === 'rejected') {
      return { status: stored, updatedAt: '', version: 1 };
    }

    const parsed = JSON.parse(stored) as Partial<CookieConsent>;
    if (parsed.status !== 'accepted' && parsed.status !== 'rejected') return null;

    return {
      status: parsed.status,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
      version: 1,
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent(status: CookieConsentDecision): CookieConsent {
  const consent: CookieConsent = { status, updatedAt: new Date().toISOString(), version: 1 };
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: consent }));
  return consent;
}
