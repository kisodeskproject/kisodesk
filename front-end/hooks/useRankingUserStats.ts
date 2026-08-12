// hooks/useRankingUserStats.ts
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { apiGet } from '@/lib/apiClient';
import { useTranslations } from '@/lib/i18n';
import type { RankingScope, UserStatsResponse } from '@/types/ranking';
import type { Locale } from '@/lib/locales';

export function useRankingUserStats(scope: RankingScope, locale: Locale) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const t = useTranslations(locale);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStats = useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setStats(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const endpoint = scope !== 'global' ? `/ranking/user-stats?language=${scope}` : '/ranking/user-stats';
      const data = await apiGet<UserStatsResponse>(endpoint);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ranking.general.errorFetchingStats'));
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, scope, t]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  return { stats, loading, error, refetch: fetchUserStats };
}
