// lib/recommendations/rules.ts
import { ProgressData } from '@/types/progress';
import { WeakKeysResponse } from '@/types/weakKeys';
import { User } from '@/types/user';

export interface RecommendationRule {
  id: string;
  priority: number;
  type: 'tip' | 'warning' | 'achievement';
  condition: (
    progress: ProgressData,
    user: User | null,
    weakKeys: WeakKeysResponse | null,
  ) => boolean;
  messageKey: string;
  // placeholders opcionales, se extraen de los datos en el engine
}

// Helper para obtener la tecla más débil y su precisión
function getWeakestKeyInfo(
  weakKeys: WeakKeysResponse | null,
): { key: string; accuracy: number } | null {
  if (!weakKeys || weakKeys.insufficientData || !weakKeys.summary) return null;
  return {
    key: weakKeys.summary.weakestKey,
    accuracy: weakKeys.summary.weakestAccuracy,
  };
}

export const recommendationRules: RecommendationRule[] = [
  // 1. Crítico: tecla muy débil (<70%)
  {
    id: 'weak_key_critical',
    priority: 1,
    type: 'warning',
    condition: (_, __, weakKeys) => {
      const info = getWeakestKeyInfo(weakKeys);
      return info !== null && info.accuracy < 70;
    },
    messageKey: 'dashboard.Recommendations.weakKeyCritical',
  },
  // 2. Tecla débil moderada (<85%)
  {
    id: 'weak_key_improve',
    priority: 2,
    type: 'tip',
    condition: (_, __, weakKeys) => {
      const info = getWeakestKeyInfo(weakKeys);
      return info !== null && info.accuracy >= 70 && info.accuracy < 85;
    },
    messageKey: 'dashboard.Recommendations.weakKeyImprove',
  },
  // 3. Racha larga
  {
    id: 'streak_milestone',
    priority: 3,
    type: 'achievement',
    condition: (progress) => progress.streak >= 7,
    messageKey: 'dashboard.Recommendations.streakMilestone',
  },
  // 4. Trend de precisión negativo
  {
    id: 'accuracy_trend_down',
    priority: 4,
    type: 'warning',
    condition: (progress) => progress.accuracyTrend?.isPositive === false,
    messageKey: 'dashboard.Recommendations.accuracyTrendDown',
  },
  // 5. Trend de WPM negativo
  {
    id: 'wpm_trend_down',
    priority: 5,
    type: 'warning',
    condition: (progress) => progress.wpmTrend?.isPositive === false,
    messageKey: 'dashboard.Recommendations.wpmTrendDown',
  },
  // 6. Precisión baja general
  {
    id: 'accuracy_low',
    priority: 6,
    type: 'warning',
    condition: (progress) => progress.averageAccuracy < 85,
    messageKey: 'dashboard.Recommendations.accuracyLow',
  },
  // 7. Velocidad baja
  {
    id: 'speed_low',
    priority: 7,
    type: 'tip',
    condition: (progress) => progress.averageWpm < 30,
    messageKey: 'dashboard.Recommendations.speedLow',
  },
  // 8. Rango Novice
  {
    id: 'novice_grade',
    priority: 8,
    type: 'tip',
    condition: (_, user) => (user as any)?.grade?.rank === 'novice',
    messageKey: 'dashboard.Recommendations.noviceGrade',
  },
  // 9. Poco tiempo de práctica (<1 hora)
  {
    id: 'low_practice_time',
    priority: 9,
    type: 'tip',
    condition: (progress) => progress.totalPracticeTime < 3600,
    messageKey: 'dashboard.Recommendations.lowPracticeTime',
  },
  // 10. Legendario
  {
    id: 'legend_grade',
    priority: 10,
    type: 'achievement',
    condition: (_, user) => (user as any)?.grade?.rank === 'legend',
    messageKey: 'dashboard.Recommendations.legendGrade',
  },
  // 11. Datos insuficientes para weak keys
  {
    id: 'insufficient_weak_data',
    priority: 11,
    type: 'tip',
    condition: (_, __, weakKeys) => weakKeys?.insufficientData === true,
    messageKey: 'dashboard.Recommendations.insufficientWeakData',
  },
];
