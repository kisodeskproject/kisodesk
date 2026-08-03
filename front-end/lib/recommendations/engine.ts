// lib/recommendations/engine.ts
import { ProgressData } from '@/types/progress';
import { WeakKeysResponse } from '@/types/weakKeys';
import { User } from '@/types/user';
import { recommendationRules } from './rules';
import { Recommendation } from '@/types/recommendation';

type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Genera un array de recomendaciones (máx 3) ordenadas por prioridad.
 * Las recomendaciones se basan en las reglas definidas y se traducen en el momento.
 */
export function generateRecommendations(
  progress: ProgressData,
  user: User | null,
  weakKeys: WeakKeysResponse | null,
  t: TranslationFunction,
): Recommendation[] {
  // Evaluar todas las reglas que cumplen condición
  const triggered = recommendationRules
    .filter((rule) => rule.condition(progress, user, weakKeys))
    .map((rule) => {
      // Construir placeholders según la regla
      let placeholders: Record<string, string | number> = {};

      if (rule.id === 'weak_key_critical' || rule.id === 'weak_key_improve') {
        const info = weakKeys?.summary;
        if (info) {
          placeholders = { key: info.weakestKey, accuracy: Math.round(info.weakestAccuracy) };
        }
      } else if (rule.id === 'streak_milestone') {
        placeholders = { streak: progress.streak };
      } else if (rule.id === 'low_practice_time') {
        // formatear tiempo en minutos/horas
        const minutes = Math.floor(progress.totalPracticeTime / 60);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const formatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        placeholders = { time: formatted };
      } else if (rule.id === 'accuracy_low') {
        placeholders = { accuracy: Math.round(progress.averageAccuracy) };
      } else if (rule.id === 'speed_low') {
        placeholders = { wpm: Math.round(progress.averageWpm) };
      }

      const message = t(rule.messageKey, placeholders);
      return {
        id: rule.id,
        type: rule.type,
        message,
        priority: rule.priority,
      } as Recommendation;
    });

  // Ordenar por prioridad (menor número = más importante) y tomar máximo 3
  const sorted = triggered.sort((a, b) => a.priority - b.priority);
  return sorted.slice(0, 3);
}
