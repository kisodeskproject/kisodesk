import { beforeEach, describe, expect, it } from '@jest/globals';
import type { MockedFunction } from 'jest-mock';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('./practiceClient', () => ({ savePracticeResult: jest.fn() }));
jest.mock('./apiClient', () => ({ apiPost: jest.fn() }));

import { savePracticeResult } from './practiceClient';
import { apiPost } from './apiClient';

import {
  GUEST_PROGRESS_STORAGE_KEY,
  LEGACY_GUEST_PROGRESS_STORAGE_KEY,
  clearGuestProgress,
  getGuestAdaptiveProfile,
  getGuestCourseProgress,
  getGuestLessonProgress,
  readGuestDailyGoalMinutes,
  readGuestProgress,
  recordGuestLessonProgress,
  recordGuestPracticeResult,
  syncGuestPracticeResults,
  syncGuestLessonAttempts,
  writeGuestDailyGoalMinutes,
} from './guestProgressStore';

const mockSavePracticeResult = savePracticeResult as MockedFunction<typeof savePracticeResult>;
const mockApiPost = apiPost as MockedFunction<typeof apiPost>;
const errorSummary = { keys: [], totalErrors: 0, totalPresses: 1, totalKeystrokes: 1 };

describe('guestProgressStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSavePracticeResult.mockReset();
    mockApiPost.mockReset();
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

    expect(readGuestProgress()).toEqual({
      version: 2,
      lessons: {},
      practice: [],
      lessonAdaptiveAttempts: [],
      adaptiveProfiles: {},
    });
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

  it('migra v1 a v2 y conserva las prácticas existentes', () => {
    window.localStorage.setItem(
      LEGACY_GUEST_PROGRESS_STORAGE_KEY,
      JSON.stringify({
        lessons: {},
        practice: [
          {
            completedAt: '2026-01-01T00:00:00.000Z',
            netWpm: 40,
            grossWpm: 45,
            accuracy: 95,
            timeElapsed: 60,
            language: 'es',
            locale: 'es-latam',
            layoutId: 'qwerty-latam',
            errorSummary: { totalKeystrokes: 5, totalErrors: 1, keys: [{ expected: 'a', totalPresses: 5, totalErrors: 1 }] },
          },
        ],
      }),
    );

    const migrated = readGuestProgress();

    expect(migrated.version).toBe(2);
    expect(migrated.practice[0].clientSessionId).toEqual(expect.any(String));
    expect(migrated.adaptiveProfiles['es:es-latam:qwerty-latam'].keyStats.a).toMatchObject({
      attempts: 5,
      errors: 1,
    });
    expect(window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY)).not.toBeNull();
  });

  it('reconstruye el estado final y no cuenta un error corregido con Backspace', () => {
    recordGuestPracticeResult({
      netWpm: 45,
      grossWpm: 50,
      accuracy: 100,
      timeElapsed: 60,
      language: 'es',
      locale: 'es-latam',
      layoutId: 'qwerty-latam',
      errorSummary: { totalKeystrokes: 4, totalErrors: 1, keys: [{ expected: 'a', totalPresses: 2, totalErrors: 1 }] },
      telemetry: {
        version: 1,
        text: 'cat',
        startedAt: 1000,
        pausedMs: 0,
        events: [
          { sequence: 0, kind: 'input', timestamp: 1000, code: 'KeyC', key: 'c', expected: 'c', typed: 'c', correct: true, position: 0 },
          { sequence: 1, kind: 'input', timestamp: 1100, code: 'KeyX', key: 'x', expected: 'a', typed: 'x', correct: false, position: 1 },
          { sequence: 2, kind: 'backspace', timestamp: 1150, code: 'Backspace', key: 'Backspace', position: 2 },
          { sequence: 3, kind: 'input', timestamp: 1200, code: 'KeyA', key: 'a', expected: 'a', typed: 'a', correct: true, position: 1 },
          { sequence: 4, kind: 'input', timestamp: 1300, code: 'KeyT', key: 't', expected: 't', typed: 't', correct: true, position: 2 },
        ],
      },
    });

    const profile = getGuestAdaptiveProfile('es', 'es-latam', 'qwerty-latam');

    expect(profile).toMatchObject({
      totalIncorrectAttempts: 1,
      correctedErrors: 1,
      uncorrectedErrors: 0,
      finalAccuracy: 100,
    });
    expect(profile?.keyStats.a).toMatchObject({ attempts: 1, errors: 0 });
    expect(profile?.bigramStats.ca).toMatchObject({ attempts: 1, errors: 0 });
  });

  it('incorpora una lección de invitado una sola vez al perfil adaptativo', () => {
    const lesson = {
      courseId: 'curso-es', lessonId: 'leccion-1', language: 'es' as const, locale: 'es-latam' as const,
      layoutId: 'qwerty-latam', clientSessionId: '72c6ac60-572c-43b5-b84b-c321fb4c6a22', timeElapsed: 30,
      errorSummary: { totalKeystrokes: 3, totalErrors: 1, keys: [{ expected: 'a', totalPresses: 1, totalErrors: 1 }] },
      telemetry: {
        version: 1 as const, text: 'cat', startedAt: 1000, pausedMs: 0,
        events: [
          { sequence: 0, kind: 'input' as const, timestamp: 1000, code: 'KeyC', key: 'c', expected: 'c', typed: 'c', correct: true, position: 0 },
          { sequence: 1, kind: 'input' as const, timestamp: 1100, code: 'KeyX', key: 'x', expected: 'a', typed: 'x', correct: false, position: 1 },
          { sequence: 2, kind: 'backspace' as const, timestamp: 1150, code: 'Backspace', key: 'Backspace', position: 2 },
          { sequence: 3, kind: 'input' as const, timestamp: 1200, code: 'KeyA', key: 'a', expected: 'a', typed: 'a', correct: true, position: 1 },
          { sequence: 4, kind: 'input' as const, timestamp: 1300, code: 'KeyT', key: 't', expected: 't', typed: 't', correct: true, position: 2 },
        ],
      },
    };

    recordGuestLessonProgress(lesson);
    recordGuestLessonProgress(lesson);

    const progress = readGuestProgress();
    const profile = getGuestAdaptiveProfile('es', 'es-latam', 'qwerty-latam');
    expect(progress.lessonAdaptiveAttempts).toHaveLength(1);
    expect(progress.lessons['curso-es:leccion-1'].attempts).toBe(1);
    expect(profile).toMatchObject({ sampleSessions: 1, correctedErrors: 1, uncorrectedErrors: 0, finalAccuracy: 100 });
    expect(profile?.keyStats.a).toMatchObject({ attempts: 1, errors: 0 });
  });

  it('sincroniza un intento de lección y lo excluye del perfil local sin borrarlo', async () => {
    recordGuestLessonProgress({
      courseId: 'curso-es', lessonId: 'leccion-1', language: 'es', locale: 'es-latam',
      layoutId: 'qwerty-latam', clientSessionId: '72c6ac60-572c-43b5-b84b-c321fb4c6a22',
      bestNetWpm: 40, bestGrossWpm: 45, bestAccuracy: 95, timeElapsed: 30,
      errorSummary: { totalKeystrokes: 3, totalErrors: 1, keys: [{ expected: 'a', totalPresses: 3, totalErrors: 1 }] },
    });
    mockApiPost.mockResolvedValue({});

    await syncGuestLessonAttempts();

    const progress = readGuestProgress();
    expect(mockApiPost).toHaveBeenCalledWith(
      '/lessons/leccion-1/complete',
      expect.objectContaining({ clientSessionId: '72c6ac60-572c-43b5-b84b-c321fb4c6a22' }),
    );
    expect(progress.lessonAdaptiveAttempts[0].syncedAt).toEqual(expect.any(String));
    expect(progress.lessonAdaptiveAttempts).toHaveLength(1);
    expect(getGuestAdaptiveProfile('es', 'es-latam', 'qwerty-latam')).toBeNull();
  });

  it('separa perfiles por idioma, locale y distribución', () => {
    expect(getGuestAdaptiveProfile('es', 'es-latam', 'qwerty-latam')).toBeNull();

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
        text: 'abababababab',
        startedAt: 1,
        pausedMs: 0,
        events: Array.from({ length: 12 }, (_, sequence) => ({
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

    expect(getGuestAdaptiveProfile('es', 'es-ES', 'qwerty-latam')).toBeNull();
    expect(getGuestAdaptiveProfile('es', 'es-latam', 'qwerty-en')).toBeNull();
    expect(getGuestAdaptiveProfile('en', 'en-US', 'qwerty-latam')).toBeNull();
  });

  it('excluye del perfil adaptativo las prácticas ya sincronizadas', () => {
    recordGuestPracticeResult({
      netWpm: 45,
      grossWpm: 50,
      accuracy: 80,
      timeElapsed: 60,
      language: 'es',
      locale: 'es-latam',
      layoutId: 'qwerty-latam',
      syncedAt: '2026-01-01T00:00:00.000Z',
      errorSummary: { totalKeystrokes: 8, totalErrors: 4, keys: [{ expected: 'a', totalPresses: 8, totalErrors: 4 }] },
    });

    expect(getGuestAdaptiveProfile('es', 'es-latam', 'qwerty-latam')).toBeNull();
  });
});

describe('meta diaria de invitado', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('usa 15 minutos por defecto cuando no hay valor guardado', () => {
    expect(readGuestDailyGoalMinutes()).toBe(15);
  });

  it('guarda y recupera la meta diaria elegida', () => {
    writeGuestDailyGoalMinutes(30);

    expect(readGuestDailyGoalMinutes()).toBe(30);
  });

  it('recorta la meta diaria al rango permitido (5-180 min)', () => {
    writeGuestDailyGoalMinutes(500);
    expect(readGuestDailyGoalMinutes()).toBe(180);

    writeGuestDailyGoalMinutes(1);
    expect(readGuestDailyGoalMinutes()).toBe(5);
  });
});
