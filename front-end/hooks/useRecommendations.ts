// hooks/useRecommendations.ts
import { useEffect, useMemo } from 'react';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { toContentLanguage } from '@/lib/locales';
import { useParams } from 'next/navigation';
import { useNormalizedProgress } from './useProgress';
import { useAuth } from '@/hooks/useAuth';
import { useWeakKeys } from './useWeakKeys';
import { generateRecommendations } from '@/lib/recommendations/engine';
import { Recommendation } from '@/types/recommendation';

export function useRecommendations() {
  const params = useParams();
  const lang = toSupportedLocale(params.lang);
  const t = useTranslations(lang);
  const {
    normalized,
    loading: progressLoading,
    error: progressError,
    fetchProgress,
  } = useNormalizedProgress(lang);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const {
    data: weakKeys,
    loading: weakKeysLoading,
    error: weakKeysError,
  } = useWeakKeys({
    limit: 3,
    days: 30,
    language: toContentLanguage(lang),
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgress();
    }
  }, [isAuthenticated, fetchProgress]);

  const recommendations: Recommendation[] = useMemo(() => {
    // Solo si tenemos datos suficientes y está autenticado
    if (!isAuthenticated || authLoading || progressLoading || weakKeysLoading) {
      return [];
    }
    if (progressError || !normalized) {
      return [];
    }
    // Si hay error en weak keys, se pasan null (no se usan reglas que dependen de ellAs)
    const weakKeysData = weakKeysError ? null : weakKeys;
    return generateRecommendations(normalized, user ?? null, weakKeysData ?? null, t);
  }, [
    isAuthenticated,
    authLoading,
    progressLoading,
    weakKeysLoading,
    progressError,
    normalized,
    user,
    weakKeys,
    weakKeysError,
    t,
  ]);

  const loading = authLoading || progressLoading || (isAuthenticated && weakKeysLoading);

  return { recommendations, loading };
}
