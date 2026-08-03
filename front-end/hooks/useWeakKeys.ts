// hooks/useWeakKeys.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWeakKeys } from '@/lib/weakKeysClient';
import { WeakKeysResponse, WeakKeysParams } from '@/types/weakKeys';
import { useAuth } from '@/hooks/useAuth';

export function getWeakKeysQueryKey(language?: string, limit?: number, days?: number): string {
  return `${language ?? 'all'}:${limit ?? 5}:${days ?? 'all'}`;
}

export function useWeakKeys(params?: WeakKeysParams) {
  const { isAuthenticated } = useAuth();
  const [result, setResult] = useState<{ queryKey: string; data: WeakKeysResponse | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ queryKey: string; message: string } | null>(null);
  const requestIdRef = useRef(0);

  // Destructure params for stable dependencies
  const { language, limit, days } = params || {};
  const queryKey = getWeakKeysQueryKey(language, limit, days);

  const loadWeakKeys = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!isAuthenticated) {
      setResult({ queryKey, data: null });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWeakKeys({ language, limit, days });
      if (requestIdRef.current === requestId) setResult({ queryKey, data: result });
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setError({
          queryKey,
          message: err instanceof Error ? err.message : 'Error al cargar teclas débiles',
        });
        setResult({ queryKey, data: null });
      }
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [days, isAuthenticated, language, limit, queryKey]);

  useEffect(() => {
    loadWeakKeys();
  }, [loadWeakKeys]);

  const hasCurrentResult = result?.queryKey === queryKey;
  const hasCurrentError = error?.queryKey === queryKey;

  return {
    data: hasCurrentResult ? result.data : null,
    loading: loading || (isAuthenticated && !hasCurrentResult && !hasCurrentError),
    error: hasCurrentError ? error.message : null,
    refetch: loadWeakKeys,
  };
}
