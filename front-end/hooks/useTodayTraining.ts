// hooks/useTodayTraining.ts
import { useState, useCallback } from 'react';
import { apiGet } from '@/lib/apiClient';
import type { TodayTrainingSummary } from '@/types/todayTraining';
import type { Locale } from '@/lib/locales';

export function useTodayTraining(locale?: Locale) {
  const [summary, setSummary] = useState<TodayTrainingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaySummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = locale ? `?locale=${encodeURIComponent(locale)}` : '';
      const data = await apiGet<TodayTrainingSummary>(`/progress/today${query}`);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el entrenamiento de hoy');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  return { summary, loading, error, fetchTodaySummary };
}
