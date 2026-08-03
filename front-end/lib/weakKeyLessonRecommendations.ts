import type { Lesson } from '@/types';
import type { WeakKey } from '@/types/weakKeys';

export interface LessonProgressForRecommendation {
  completed?: boolean;
  mastered?: boolean;
  status?: Lesson['status'];
}

export interface WeakKeyLessonRecommendation {
  lesson: Lesson;
  matchedWeakKeys: string[];
  focusKeyMatches: string[];
  reviewKeyMatches: string[];
  score: number;
  reason: 'focus' | 'review' | 'focus-and-review';
}

export interface WeakKeyLessonRecommendationInput {
  weakKeys: Pick<WeakKey, 'key'>[];
  lessons: Lesson[];
  courseSlug?: string;
  progressByLessonId?: Readonly<Record<string, LessonProgressForRecommendation | undefined>>;
  limit?: number;
}

const FOCUS_KEY_SCORE = 3;
const REVIEW_KEY_SCORE = 1;
const DEFAULT_LIMIT = 3;

export function normalizeRecommendationKey(key: string): string {
  return key.normalize('NFC').toLocaleLowerCase('es');
}

function isCompleted(
  lesson: Lesson,
  progress: LessonProgressForRecommendation | undefined,
): boolean {
  const status = progress?.status ?? lesson.status;
  const completed = progress?.completed ?? lesson.completed ?? false;
  const mastered = progress?.mastered ?? lesson.mastered ?? false;
  return completed || mastered || status === 'COMPLETED' || status === 'MASTERED';
}

export function getWeakKeyLessonRecommendations({
  weakKeys,
  lessons,
  courseSlug,
  progressByLessonId = {},
  limit = DEFAULT_LIMIT,
}: WeakKeyLessonRecommendationInput): WeakKeyLessonRecommendation[] {
  if (limit <= 0 || weakKeys.length === 0 || lessons.length === 0) return [];

  const weaknessRank = new Map<string, { key: string; priority: number }>();
  weakKeys.forEach(({ key }, index) => {
    const normalized = normalizeRecommendationKey(key);
    if (!weaknessRank.has(normalized)) {
      // Prioridad = total de teclas débiles - posición en la respuesta del backend.
      // La primera tecla recibe el mayor multiplicador y no se recalcula su debilidad.
      weaknessRank.set(normalized, { key, priority: weakKeys.length - index });
    }
  });

  const recommendations = new Map<string, WeakKeyLessonRecommendation>();

  for (const lesson of lessons) {
    if (courseSlug && lesson.courseSlug !== courseSlug) continue;
    if (recommendations.has(lesson.id)) continue;

    const focusKeys = new Set((lesson.focusKeys ?? []).map(normalizeRecommendationKey));
    const reviewKeys = new Set((lesson.reviewKeys ?? []).map(normalizeRecommendationKey));
    const focusKeyMatches: string[] = [];
    const reviewKeyMatches: string[] = [];
    let score = 0;

    for (const [normalized, weakKey] of weaknessRank) {
      if (focusKeys.has(normalized)) {
        focusKeyMatches.push(weakKey.key);
        score += FOCUS_KEY_SCORE * weakKey.priority;
      } else if (reviewKeys.has(normalized)) {
        reviewKeyMatches.push(weakKey.key);
        score += REVIEW_KEY_SCORE * weakKey.priority;
      }
    }

    if (score === 0) continue;

    recommendations.set(lesson.id, {
      lesson,
      matchedWeakKeys: [...focusKeyMatches, ...reviewKeyMatches],
      focusKeyMatches,
      reviewKeyMatches,
      score,
      reason:
        focusKeyMatches.length > 0 && reviewKeyMatches.length > 0
          ? 'focus-and-review'
          : focusKeyMatches.length > 0
            ? 'focus'
            : 'review',
    });
  }

  return [...recommendations.values()]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;

      const leftCompleted = isCompleted(left.lesson, progressByLessonId[left.lesson.id]);
      const rightCompleted = isCompleted(right.lesson, progressByLessonId[right.lesson.id]);
      if (leftCompleted !== rightCompleted) return Number(leftCompleted) - Number(rightCompleted);

      if ((left.lesson.order ?? Number.MAX_SAFE_INTEGER) !== (right.lesson.order ?? Number.MAX_SAFE_INTEGER)) {
        return (left.lesson.order ?? Number.MAX_SAFE_INTEGER) - (right.lesson.order ?? Number.MAX_SAFE_INTEGER);
      }

      return left.lesson.id.localeCompare(right.lesson.id);
    })
    .slice(0, limit);
}
