import { describe, expect, it } from '@jest/globals';

import {
  getGuestDashboardProgress,
  getGuestPracticeDays,
  getGuestProgressForLanguage,
  getGuestTodaySummary,
  getGuestWeakKeys,
  getGuestWeakPoints,
} from './guestDashboardProgress';

const progress = {
  lessons: {
    'curso:leccion': {
      courseId: 'curso',
      lessonId: 'leccion',
      locale: 'es-latam' as const,
      completedAt: '2026-07-20T18:00:00.000Z',
      attempts: 2,
      bestNetWpm: 40,
      bestAccuracy: 95,
      totalTimeElapsed: 120,
    },
  },
  practice: [
    {
      completedAt: '2026-07-21T18:00:00.000Z',
      netWpm: 60,
      grossWpm: 65,
      accuracy: 97,
      timeElapsed: 180,
      language: 'es' as const,
      locale: 'es-latam' as const,
      clientSessionId: 'session-1',
      errorSummary: {
        totalKeystrokes: 5,
        totalErrors: 2,
        keys: [
          { expected: 'a', totalPresses: 3, totalErrors: 2, mistakes: [{ typed: 's', count: 2 }] },
          { expected: 'j', totalPresses: 2, totalErrors: 0 },
        ],
      },
    },
  ],
};

describe('guestDashboardProgress', () => {
  it('convierte el progreso local en métricas para el dashboard', () => {
    const result = getGuestDashboardProgress(progress, new Date('2026-07-21T20:00:00.000Z'));

    expect(result).toMatchObject({
      completedLessons: 1,
      averageWpm: 50,
      averageAccuracy: 96,
      streak: 2,
      totalPracticeTime: 300,
      formattedPracticeTime: '5m',
    });
    expect(result.weeklyProgress.values).toEqual([0, 0, 0, 0, 0, 40, 60]);
  });

  it('agrupa el tiempo de práctica local por día', () => {
    expect(getGuestPracticeDays(progress)).toEqual([
      { date: '2026-07-20', minutes: 2 },
      { date: '2026-07-21', minutes: 3 },
    ]);
  });

  it('convierte los errores locales por tecla para los paneles del dashboard', () => {
    const keys = getGuestWeakKeys(progress);

    expect(keys[0]).toMatchObject({
      key: 'a',
      totalAttempts: 3,
      correctAttempts: 1,
      commonMistakes: ['s'],
    });
    expect(keys[0].accuracy).toBeCloseTo(100 / 3);
    expect(keys[1]).toMatchObject({
      key: 'j',
      totalAttempts: 2,
      correctAttempts: 2,
      accuracy: 100,
      commonMistakes: [],
    });
  });

  it('separa las estadísticas por idioma', () => {
    const multilingualProgress = {
      ...progress,
      lessons: {
        ...progress.lessons,
        'course-fr:lesson': { ...progress.lessons['curso:leccion'], locale: 'fr' as const },
      },
      practice: [...progress.practice, { ...progress.practice[0], locale: 'fr' as const }],
    };

    expect(getGuestProgressForLanguage(multilingualProgress, 'es-latam')).toEqual({
      version: 2,
      lessons: progress.lessons,
      practice: [progress.practice[0]],
      lessonAdaptiveAttempts: [],
      adaptiveProfiles: {},
    });
    expect(getGuestProgressForLanguage(multilingualProgress, 'es-ES')).toEqual({
      version: 2,
      lessons: {},
      practice: [],
      lessonAdaptiveAttempts: [],
      adaptiveProfiles: {},
    });
    expect(getGuestProgressForLanguage(multilingualProgress, 'fr').practice).toHaveLength(1);
  });
});

describe('getGuestWeakPoints', () => {
  it('combina teclas y bigramas y ordena por menor precisión', () => {
    const withStats = {
      ...progress,
      practice: [
        {
          ...progress.practice[0],
          errorSummary: {
            totalKeystrokes: 10,
            totalErrors: 2,
            keys: [{ expected: 'p', totalPresses: 8, totalErrors: 1 }],
          },
        },
      ],
      adaptiveProfiles: {
        'es:es-latam:qwerty-latam': {
          language: 'es' as const,
          locale: 'es-latam' as const,
          layoutId: 'qwerty-latam',
          sampleSessions: 3,
          totalInputs: 0,
          totalFinalInputs: 0,
          correctFinalInputs: 0,
          totalIncorrectAttempts: 0,
          correctedErrors: 0,
          uncorrectedErrors: 0,
          totalActiveDurationMs: 0,
          finalAccuracy: 0,
          keyStats: {},
          bigramStats: {
            th: { attempts: 20, errors: 4, latencyTotalMs: 0, latencySamples: 0, recurrence: 0 },
            qu: { attempts: 10, errors: 1, latencyTotalMs: 0, latencySamples: 0, recurrence: 0 },
          },
        },
      },
    };

    expect(getGuestWeakPoints(withStats)).toEqual([
      { type: 'bigram', value: 'th', accuracy: 80 },
      { type: 'key', value: 'p', accuracy: 87.5 },
      { type: 'bigram', value: 'qu', accuracy: 90 },
    ]);
  });

  it('ignora teclas y bigramas con muy pocos intentos', () => {
    expect(getGuestWeakPoints(progress)).toEqual([]);
  });
});

describe('getGuestTodaySummary', () => {
  it('calcula minutos, deltas y meta diaria solo con sesiones de hoy', () => {
    const now = new Date('2026-07-21T20:00:00.000Z');
    const todayProgress = {
      ...progress,
      practice: [
        { ...progress.practice[0], completedAt: '2026-07-21T10:00:00.000Z', netWpm: 47, accuracy: 94, timeElapsed: 360 },
        { ...progress.practice[0], completedAt: '2026-07-21T12:00:00.000Z', netWpm: 51, accuracy: 96, timeElapsed: 360 },
        { ...progress.practice[0], completedAt: '2026-07-20T10:00:00.000Z', netWpm: 30, accuracy: 90, timeElapsed: 600 },
      ],
    };

    const summary = getGuestTodaySummary(todayProgress, 15, now);

    expect(summary.minutesTrained).toBe(12);
    expect(summary.dailyGoalMinutes).toBe(15);
    expect(summary.sessionsToday).toBe(2);
    expect(summary.wpm).toEqual({ start: 47, end: 51, delta: 4 });
    expect(summary.accuracy).toEqual({ start: 94, end: 96, delta: 2 });
  });

  it('devuelve valores nulos cuando no hay sesiones hoy', () => {
    const summary = getGuestTodaySummary(progress, 15, new Date('2026-08-01T00:00:00.000Z'));

    expect(summary.minutesTrained).toBe(0);
    expect(summary.sessionsToday).toBe(0);
    expect(summary.wpm).toEqual({ start: null, end: null, delta: 0 });
    expect(summary.accuracy).toEqual({ start: null, end: null, delta: 0 });
  });
});
