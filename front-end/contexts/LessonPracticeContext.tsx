// contexts/LessonPracticeContext.tsx
// manejar la navegación y estado de las lecciones de un curso

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import type { Lesson } from '@/types/lesson';
import { useLesson } from '@/hooks/useLesson';
import { useErrorTracker } from '@/hooks/useErrorTracker';
import type { TypingStats } from '@/components/lessons/TypingArea';

// ============================================================
// TIPOS
// ============================================================
interface LessonPracticeState {
  lessons: Lesson[];
  currentIndex: number;
  currentLesson: Lesson | null;
  isFirst: boolean;
  isLast: boolean;
  loading: boolean;
  error: string | null;
  goToNext: () => void;
  goToPrev: () => void;
  goToIndex: (index: number) => void;
  loadLessons: (courseId: string) => Promise<void>;
  trackError: (expectedChar: string, typedChar: string, position: number) => void;
  flushErrors: (stats: Pick<TypingStats, 'grossWpm' | 'netWpm' | 'accuracy' | 'timeElapsed'>) => Promise<void>;
  currentLessonId: string | null;
}

// ============================================================
// CONTEXTO
// ============================================================
const LessonPracticeContext = createContext<LessonPracticeState | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================
export function LessonPracticeProvider({ children }: { children: ReactNode }) {
  // HOOKS Y ESTADOS
  const { fetchLessonsByCourse } = useLesson();
  const { trackError: bufferError, flush: flushBuffer, reset: resetBuffer } = useErrorTracker();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const currentLessonIdRef = useRef<string | null>(null);

  // PROPIEDADES DERIVADAS
  const currentLesson = useMemo(() => lessons[currentIndex] ?? null, [lessons, currentIndex]);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === lessons.length - 1;

  // ACTUALIZAR REF AL CAMBIAR DE LECCIÓN
  currentLessonIdRef.current = currentLesson?.id ?? null;

  // FUNCIONES DE NAVEGACIÓN
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, lessons.length - 1));
  }, [lessons.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < lessons.length) {
        setCurrentIndex(index);
      }
    },
    [lessons.length],
  );

  // FUNCIÓN PARA CARGAR LECCIONES
  const loadLessons = useCallback(
    async (courseId: string) => {
      const isSameCourse = courseId === currentCourseId;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLessonsByCourse(courseId);
        setLessons(data);
        setCurrentCourseId(courseId);
        resetBuffer();
        if (!isSameCourse) {
          setCurrentIndex(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar lecciones');
      } finally {
        setLoading(false);
      }
    },
    [fetchLessonsByCourse, currentCourseId, resetBuffer],
  );

  // TRACKEO DE ERRORES
  const trackError = useCallback(
    (expectedChar: string, typedChar: string, position: number) => {
      bufferError(expectedChar, typedChar, position);
    },
    [bufferError],
  );

  // FLUSH DE ERRORES
  const flushErrors = useCallback(async (stats: Pick<TypingStats, 'grossWpm' | 'netWpm' | 'accuracy' | 'timeElapsed'>) => {
    if (!currentLessonIdRef.current) return;
    await flushBuffer(currentLessonIdRef.current, stats);
  }, [flushBuffer]);

  // VALOR DEL CONTEXTO
  const value = useMemo<LessonPracticeState>(
    () => ({
      lessons,
      currentIndex,
      currentLesson,
      isFirst,
      isLast,
      loading,
      error,
      goToNext,
      goToPrev,
      goToIndex,
      loadLessons,
      trackError,
      flushErrors,
      currentLessonId: currentLessonIdRef.current,
    }),
    [
      lessons,
      currentIndex,
      currentLesson,
      isFirst,
      isLast,
      loading,
      error,
      goToNext,
      goToPrev,
      goToIndex,
      loadLessons,
      trackError,
      flushErrors,
    ],
  );

  return <LessonPracticeContext.Provider value={value}>{children}</LessonPracticeContext.Provider>;
}

// ============================================================
// HOOK PERSONALIZADO
// ============================================================
export function useLessonPractice() {
  const context = useContext(LessonPracticeContext);
  if (context === undefined) {
    throw new Error('useLessonPractice debe usarse dentro de un LessonPracticeProvider');
  }
  return context;
}
