// types/progress.ts
export interface ChartData {
  labels: string[];
  values: number[];
}

export interface ProgressTrend {
  value: number;
  isPositive: boolean;
}

// Respuesta del endpoint /progress
export interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  completedCourses?: number;
  averageWpm: number;
  averageAccuracy: number;
  totalPracticeTime: number;
  weeklyProgress: ChartData;
  weeklyAccuracy: ChartData;
  monthlyProgress: ChartData;
}

// Estadísticas adicionales del usuario
export interface UserStats {
  bestWpm: number;
  bestAccuracy: number;
  totalKeystrokes: number;
  streak: number;
}

// Datos normalizados para el dashboard
export interface ProgressData {
  completedLessons: number;
  completedCourses?: number;
  averageWpm: number;
  averageAccuracy: number;
  streak: number;
  totalPracticeTime: number;
  formattedPracticeTime: string;
  weeklyProgress: ChartData;
  monthlyProgress: ChartData;
  wpmTrend?: ProgressTrend;
  accuracyTrend?: ProgressTrend;
}
export interface PracticeDay {
  date: string;
  minutes: number;
}
