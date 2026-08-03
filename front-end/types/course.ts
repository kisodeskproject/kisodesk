// types/course.ts
import type { ContentLanguage, Locale } from '@/lib/locales';

export interface UserProgress {
  completedLessons: number;
  masteredLessons?: number;
  bestWpm: number;
  avgAccuracy: number;
  totalTimeSpent: number;
}

export interface Course {
  id: string;
  slug: string;
  name: string;
  description: string;
  languageCode?: ContentLanguage;
  localeCode?: Locale;
  level: 'beginner' | 'intermediate' | 'advanced';
  supportedLayouts?: string[];
  curriculumVersion?: number;
  estimatedMinutes?: number;
  lessonsCount: number;
  userProgress: UserProgress | null;
}
