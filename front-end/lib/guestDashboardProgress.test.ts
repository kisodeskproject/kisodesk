import { describe, expect, it } from '@jest/globals';

import {
  getGuestDashboardProgress,
  getGuestPracticeDays,
  getGuestProgressForLanguage,
  getGuestWeakKeys,
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
