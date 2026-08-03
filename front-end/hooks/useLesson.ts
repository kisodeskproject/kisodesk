// hooks/useLesson.ts
import { useState, useCallback } from 'react';
import { apiGet, apiPost } from '@/lib/apiClient';
import type { Lesson, LessonProgressResult, LessonResult } from '@/types';

export function useLesson() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener lecciones de un curso específico (endpoint público)
  const fetchLessonsByCourse = useCallback(async (courseIdentifier: string): Promise<Lesson[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<any[]>(`/courses/${courseIdentifier}/lessons`);
      let lessonsArray = Array.isArray(data) ? data : (data as any).lessons || [];
      lessonsArray = lessonsArray.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      const transformed = lessonsArray.map((lesson: any) => ({
        id: lesson.id,
        slug: lesson.slug,
        courseSlug: lesson.courseSlug,
        title: lesson.title,
        type: lesson.type ?? 'practice',
        text: lesson.content,
        order: lesson.order,
        moduleSlug: lesson.moduleSlug,
        moduleTitle: lesson.moduleTitle,
        moduleDescription: lesson.moduleDescription,
        moduleOrder: lesson.moduleOrder,
        required: lesson.required,
        isLocked: lesson.isLocked ?? false,
        difficulty:
          lesson.difficulty >= 3
            ? ('advanced' as const)
            : lesson.difficulty === 2
              ? ('intermediate' as const)
              : ('beginner' as const),
        duration: Math.max(1, Math.ceil((lesson.estimatedSeconds ?? 60) / 60)),
        description: lesson.description ?? '',
        objective: lesson.objective ?? '',
        instructions: lesson.instructions ?? '',
        mediaUrl: lesson.mediaUrl ?? null,
        audioUrl: lesson.audioUrl ?? null,
        fingerPositions: lesson.fingerPositions ?? null,
        targetKeys: lesson.targetKeys ?? null,
        focusKeys: lesson.focusKeys ?? [],
        reviewKeys: lesson.reviewKeys ?? [],
        allowedCharacters: lesson.allowedCharacters ?? [],
        minAccuracy: lesson.minAccuracy ?? 95,
        maxTargetKeyErrors: lesson.maxTargetKeyErrors ?? null,
        hideLiveWpm: lesson.hideLiveWpm ?? false,
        bestWpm: lesson.userProgress?.bestWpm,
        bestScore: lesson.userProgress?.bestScore,
        bestAccuracy: lesson.userProgress?.bestAccuracy,
        timeSpent: lesson.userProgress?.timeSpent,
        completed: lesson.userProgress?.completed ?? false,
        mastered: lesson.userProgress?.mastered ?? false,
        status: lesson.userProgress?.status ?? 'NOT_STARTED',
        attemptsCount: lesson.userProgress?.attemptsCount ?? 0,
      }));
      setLessons(transformed);
      return transformed;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener una lección individual
  const getLesson = useCallback(async (identifier: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<any>(`/lessons/${identifier}`);
      const lesson: Lesson = {
        id: data.id,
        slug: data.slug,
        courseSlug: data.courses?.[0]?.slug,
        title: data.title,
        type: data.type ?? 'practice',
        text: data.content,
        description: data.description ?? '',
        objective: data.objective ?? '',
        instructions: data.instructions ?? '',
        mediaUrl: data.mediaUrl ?? null,
        audioUrl: data.audioUrl ?? null,
        fingerPositions: data.fingerPositions ?? null,
        targetKeys: data.targetKeys ?? null,
        focusKeys: data.focusKeys ?? [],
        reviewKeys: data.reviewKeys ?? [],
        allowedCharacters: data.allowedCharacters ?? [],
        minAccuracy: data.minAccuracy ?? 95,
        maxTargetKeyErrors: data.maxTargetKeyErrors ?? null,
        hideLiveWpm: data.hideLiveWpm ?? false,
        difficulty:
          data.difficulty >= 3 ? 'advanced' : data.difficulty === 2 ? 'intermediate' : 'beginner',
        duration: Math.max(1, Math.ceil((data.estimatedSeconds ?? 60) / 60)),
      };
      setCurrentLesson(lesson);
      return lesson;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar lección');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Guardar resultado de una lección
  const saveResult = useCallback(async (result: LessonResult) => {
    setLoading(true);
    setError(null);
    try {
      if (result.completed) {
        // Lección explicativa: solo marcar completada
        return await apiPost<LessonProgressResult>(`/lessons/${result.lessonId}/complete`, {
          completed: true,
          locale: result.locale,
        });
      } else {
        // Lección práctica: enviar métricas
        return await apiPost<LessonProgressResult>(`/lessons/${result.lessonId}/complete`, {
          grossWpm: result.grossWpm,
          netWpm: result.netWpm,
          accuracy: result.accuracy,
          timeElapsed: result.timeElapsed,
          targetKeyErrors: result.targetKeyErrors,
          usedAssistance: result.usedAssistance,
          errorSummary: result.errorSummary,
          locale: result.locale,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar resultado');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    lessons,
    currentLesson,
    loading,
    error,
    fetchLessonsByCourse,
    getLesson,
    saveResult,
  };
}
