// ThirdPartyScriptsGate
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { CookieConsentDecision, readCookieConsent } from './cookieConsent';

type ThirdPartyScriptsGateProps = {
  children?: ReactNode;
};

export default function ThirdPartyScriptsGate({ children = null }: ThirdPartyScriptsGateProps) {
  const [decision, setDecision] = useState<CookieConsentDecision | null>(null);

  useEffect(() => {
    const readDecision = () => {
      try {
        setDecision(readCookieConsent()?.status ?? null);
      } catch {
        setDecision(null);
      }
    };

    readDecision();

    const handleConsentUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ status?: CookieConsentDecision }>;
      const nextDecision = customEvent.detail?.status;
      setDecision(nextDecision === 'accepted' || nextDecision === 'rejected' ? nextDecision : null);
    };

    window.addEventListener('cookie-consent-updated', handleConsentUpdate as EventListener);

    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate as EventListener);
    };
  }, []);

  if (decision !== 'accepted') {
    return null;
  }

  return <>{children}</>;
}
