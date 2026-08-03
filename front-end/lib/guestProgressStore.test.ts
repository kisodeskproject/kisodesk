import { beforeEach, describe, expect, it } from '@jest/globals';
import type { MockedFunction } from 'jest-mock';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('./practiceClient', () => ({ savePracticeResult: jest.fn() }));

import { savePracticeResult } from './practiceClient';

import {
  GUEST_PROGRESS_STORAGE_KEY,
  clearGuestProgress,
  getGuestAdaptiveProfile,
  getGuestCourseProgress,
  getGuestLessonProgress,
  readGuestProgress,
  recordGuestLessonProgress,
  recordGuestPracticeResult,
  syncGuestPracticeResults,
} from './guestProgressStore';

const mockSavePracticeResult = savePracticeResult as MockedFunction<typeof savePracticeResult>;
const errorSummary = { keys: [], totalErrors: 0, totalPresses: 1, totalKeystrokes: 1 };

describe('guestProgressStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSavePracticeResult.mockReset();
  });

  it('guarda progreso de lección únicamente en localStorage', () => {
    recordGuestLessonProgress({
      courseId: 'curso-es',
      lessonId: 'leccion-1',
      bestNetWpm: 42,
      bestGrossWpm: 48,
      bestScore: 4200,
      bestAccuracy: 96,
      timeElapsed: 75,
    });

    const progress = readGuestProgress();
    expect(progress.lessons['curso-es:leccion-1']).toMatchObject({
      attempts: 1,
      bestNetWpm: 42,
      bestScore: 4200,
      bestAccuracy: 96,
      totalTimeElapsed: 75,
    });
    expect(window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY)).not.toBeNull();
  });

  it('acumula intentos y conserva las mejores métricas', () => {
    recordGuestLessonProgress({ courseId: 'curso-es', lessonId: 'leccion-1', bestNetWpm: 30 });
    recordGuestLessonProgress({
      courseId: 'curso-es',
      lessonId: 'leccion-1',
      bestNetWpm: 48,
      timeElapsed: 60,
    });

    expect(readGuestProgress().lessons['curso-es:leccion-1']).toMatchObject({
      attempts: 2,
      bestNetWpm: 48,
      totalTimeElapsed: 60,
    });
  });

  it('expone el progreso local para las tarjetas de lecciones y cursos', () => {
    recordGuestLessonProgress({
      courseId: 'curso-es',
      lessonId: 'leccion-1',
      bestNetWpm: 42,
      bestScore: 4200,
      bestAccuracy: 96,
      timeElapsed: 75,
    });
    recordGuestLessonProgress({
      courseId: 'curso-es',
      lessonId: 'leccion-2',
      bestNetWpm: 55,
      bestScore: 5500,
      bestAccuracy: 98,
      timeElapsed: 45,
    });

    expect(getGuestLessonProgress('curso-es', 'leccion-1')).toMatchObject({
      bestNetWpm: 42,
      bestScore: 4200,
      bestAccuracy: 96,
    });
    expect(getGuestCourseProgress('curso-es')).toEqual({
      completedLessons: 2,
      bestWpm: 55,
      avgAccuracy: 97,
      totalTimeSpent: 120,
    });
  });

  it('guarda resultados de práctica libre sin sesión de usuario', () => {
    recordGuestPracticeResult({
      netWpm: 51,
      grossWpm: 57,
      accuracy: 97,
      timeElapsed: 80,
      language: 'es',
    });

    expect(readGuestProgress().practice).toHaveLength(1);
    expect(readGuestProgress().practice[0]).toMatchObject({ netWpm: 51, language: 'es' });
  });

  it('permite eliminar el progreso local sin afectar datos remotos', () => {
    recordGuestPracticeResult({
      netWpm: 51,
      grossWpm: 57,
      accuracy: 97,
      timeElapsed: 80,
      language: 'es',
    });
    clearGuestProgress();

    expect(readGuestProgress()).toEqual({ lessons: {}, practice: [] });
  });

  it('sincroniza una práctica local con su telemetría y conserva su identidad', async () => {
    recordGuestPracticeResult({
      netWpm: 51,
      grossWpm: 57,
      accuracy: 97,
      timeElapsed: 80,
      language: 'es',
      locale: 'es-latam',
      layoutId: 'qwerty-es',
      errorSummary,
      telemetry: { version: 1, text: 'hola', startedAt: 10, pausedMs: 0, events: [] },
    });
    mockSavePracticeResult.mockResolvedValue({ id: 'session-1', savedAt: '2026-01-01T00:00:00Z' });

    const session = readGuestProgress().practice[0];
    await syncGuestPracticeResults();

    expect(mockSavePracticeResult).toHaveBeenCalledWith(
      expect.objectContaining({ clientSessionId: session.clientSessionId, telemetry: session.telemetry }),
    );
    expect(readGuestProgress().practice[0].syncedAt).toEqual(expect.any(String));
  });

  it('no pierde prácticas nuevas ni marca como sincronizada una práctica que falló', async () => {
    recordGuestPracticeResult({
      netWpm: 51,
      grossWpm: 57,
      accuracy: 97,
      timeElapsed: 80,
      language: 'es',
      layoutId: 'qwerty-es',
      errorSummary,
    });
    recordGuestPracticeResult({
      netWpm: 52,
      grossWpm: 58,
      accuracy: 98,
      timeElapsed: 81,
      language: 'es',
      layoutId: 'qwerty-es',
      errorSummary,
    });
    mockSavePracticeResult
      .mockRejectedValueOnce(new Error('offline'))
      .mockImplementationOnce(async () => {
        recordGuestPracticeResult({
          netWpm: 53,
          grossWpm: 59,
          accuracy: 99,
          timeElapsed: 82,
          language: 'es',
        });
        return { id: 'session-2', savedAt: '2026-01-01T00:00:00Z' };
      });

    await syncGuestPracticeResults();

    const practice = readGuestProgress().practice;
    expect(practice).toHaveLength(3);
    expect(practice[0].syncedAt).toBeUndefined();
    expect(practice[1].syncedAt).toEqual(expect.any(String));
    expect(practice[2].syncedAt).toBeUndefined();
  });

  it('entrega una adaptación local vacía sin historial y separa idioma y layout', () => {
    expect(getGuestAdaptiveProfile('es', 'qwerty-latam')).toEqual({ keys: [], bigrams: [] });

    recordGuestPracticeResult({
      netWpm: 45,
      grossWpm: 50,
      accuracy: 80,
      timeElapsed: 60,
      language: 'es',
      layoutId: 'qwerty-latam',
      errorSummary: {
        totalKeystrokes: 8,
        totalErrors: 4,
        keys: [{ expected: 'a', totalPresses: 8, totalErrors: 4 }],
      },
      telemetry: {
        version: 1,
        text: 'abababab',
        startedAt: 1,
        pausedMs: 0,
        events: Array.from({ length: 8 }, (_, sequence) => ({
          sequence,
          kind: 'input' as const,
          timestamp: sequence + 1,
          code: sequence % 2 ? 'KeyB' : 'KeyA',
          key: sequence % 2 ? 'b' : 'a',
          expected: sequence % 2 ? 'b' : 'a',
          typed: sequence % 2 ? 'b' : 'x',
          correct: sequence % 2 === 1,
          position: sequence,
        })),
      },
    });

    expect(getGuestAdaptiveProfile('es', 'qwerty-latam').keys).toEqual(['a']);
    expect(getGuestAdaptiveProfile('es', 'qwerty-latam').bigrams).toEqual(['ba']);
    expect(getGuestAdaptiveProfile('es', 'qwerty-en')).toEqual({ keys: [], bigrams: [] });
    expect(getGuestAdaptiveProfile('en', 'qwerty-latam')).toEqual({ keys: [], bigrams: [] });
  });
});
