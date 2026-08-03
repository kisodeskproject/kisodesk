'use client';

import { useEffect } from 'react';

import { pingPresence } from '@/lib/friendsClient';

interface UsePresencePingOptions {
  enabled?: boolean;
  intervalMs?: number;
}

export function usePresencePing({ enabled = true, intervalMs = 60000 }: UsePresencePingOptions = {}) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let active = true;

    const ping = async () => {
      if (!active) return;
      try {
        await pingPresence();
      } catch {
        // Best effort only.
      }
    };

    ping();

    const intervalId = window.setInterval(() => {
      void ping();
    }, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void ping();
      }
    };

    const handleFocus = () => {
      void ping();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, intervalMs]);
}
