// components/ui/TurnstileWidget.tsx
'use client';

import { useCallback, useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  disabled?: boolean;
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
}

export default function TurnstileWidget({
  disabled = false,
  onVerify,
  onExpire,
  onError,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onVerify, onExpire, onError });
  callbacksRef.current = { onVerify, onExpire, onError };

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!siteKey || !window.turnstile || !containerRef.current || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: 'auto',
      callback: (token) => callbacksRef.current.onVerify(token),
      'expired-callback': () => callbacksRef.current.onExpire(),
      'error-callback': () => callbacksRef.current.onError(),
    });
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) return;

    const scriptId = 'cloudflare-turnstile-script';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    const nonce = document.querySelector('script[nonce]')?.getAttribute('nonce');
    const script = existingScript ?? document.createElement('script');

    const load = () => renderWidget();

    if (!existingScript) {
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      if (nonce) script.nonce = nonce;
      script.addEventListener('load', load);
      document.head.append(script);
    } else if (window.turnstile) {
      renderWidget();
    } else {
      existingScript.addEventListener('load', load);
    }

    return () => {
      script.removeEventListener('load', load);
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget, siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
