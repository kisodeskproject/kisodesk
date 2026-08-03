// hooks/useProgress.ts
import { useState, useCallback } from 'react';
import { apiGet } from '@/lib/apiClient';
import { ProgressStats, UserStats, PracticeDay } from '@/types/progress';
import { normalizeProgress } from '@/lib/normalizeProgress';
import type { Locale } from '@/lib/locales';

export function useProgress(locale?: Locale) {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = locale ? `?locale=${encodeURIComponent(locale)}` : '';
      const data = await apiGet<{ stats: ProgressStats; userStats: UserStats }>(
        `/progress${query}`,
      );
      setStats(data.stats);
      setUserStats(data.userStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar progreso');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  return {
    stats,
    userStats,
    loading,
    error,
    fetchProgress,
  };
}

export function useNormalizedProgress(locale?: Locale) {
  const { stats, userStats, loading, error, fetchProgress } = useProgress(locale);
  const normalized = stats && userStats ? normalizeProgress(stats, userStats) : null;

  return {
    normalized,
    loading,
    error,
    fetchProgress,
  };
}

export function usePracticeCalendar(locale?: Locale) {
  const [days, setDays] = useState<PracticeDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = locale ? `?locale=${encodeURIComponent(locale)}` : '';
      const data = await apiGet<{ days: PracticeDay[] }>(`/progress/calendar${query}`);
      setDays(data.days);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar calendario');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  return { days, loading, error, fetchDates };
}
