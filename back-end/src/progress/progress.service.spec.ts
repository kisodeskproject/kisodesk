import { ProgressService } from './progress.service';

describe('ProgressService completion aggregation', () => {
  it('no cuenta intentos en curso como lecciones completadas en el dashboard', async () => {
    const prisma = {
      lesson: { count: jest.fn().mockResolvedValue(2) },
      userLessonProgress: {
        findMany: jest.fn().mockResolvedValue([
          {
            lessonId: 'lesson-started',
            status: 'IN_PROGRESS',
            achievedAt: new Date('2026-07-10T00:00:00.000Z'),
            bestQualifiedNetWpm: 0,
            bestAccuracy: 0,
            lesson: { type: 'practice' },
          },
          {
            lessonId: 'lesson-mastered',
            status: 'MASTERED',
            achievedAt: new Date('2026-07-11T00:00:00.000Z'),
            bestQualifiedNetWpm: 42,
            bestAccuracy: 97,
            lesson: { type: 'practice' },
          },
        ]),
      },
      course: {
        findMany: jest.fn().mockResolvedValue([
          {
            courseLessons: [{ lessonId: 'lesson-started' }, { lessonId: 'lesson-mastered' }],
          },
        ]),
      },
      practiceDay: { aggregate: jest.fn().mockResolvedValue({ _sum: { totalSeconds: 60 } }) },
      practiceSession: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new ProgressService(prisma as any);

    const result = await service.getProgress('user-1');

    expect(result.stats.completedLessons).toBe(1);
    expect(result.stats.completedCourses).toBe(0);
  });
});

describe('ProgressService.getTodaySummary', () => {
  function createService() {
    const prisma = {
      practiceDay: { findUnique: jest.fn().mockResolvedValue({ totalSeconds: 720 }) },
      practiceSession: {
        findMany: jest.fn().mockResolvedValue([
          { netWpm: 47, accuracy: 94 },
          { netWpm: 49, accuracy: 95 },
          { netWpm: 51, accuracy: 96 },
        ]),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ dailyGoalMinutes: 15 }) },
      keyStat: {
        findMany: jest.fn().mockResolvedValue([
          { keyChar: 'p', totalPresses: 40, totalErrors: 5, errorRate: 12 },
        ]),
      },
      bigramStat: {
        findMany: jest.fn().mockResolvedValue([
          { firstChar: 't', secondChar: 'h', totalPresses: 30, totalErrors: 6 },
          { firstChar: 'q', secondChar: 'u', totalPresses: 20, totalErrors: 3 },
        ]),
      },
    };
    return { prisma, service: new ProgressService(prisma as any) };
  }

  it('calcula minutos, deltas de wpm/precisión y los 3 puntos débiles con menor precisión', async () => {
    const { service } = createService();

    const summary = await service.getTodaySummary('user-1');

    expect(summary.minutesTrained).toBe(12);
    expect(summary.dailyGoalMinutes).toBe(15);
    expect(summary.sessionsToday).toBe(3);
    expect(summary.wpm).toEqual({ start: 47, end: 51, delta: 4 });
    expect(summary.accuracy).toEqual({ start: 94, end: 96, delta: 2 });
    expect(summary.weakPoints).toEqual([
      { type: 'bigram', value: 'th', accuracy: 80 },
      { type: 'bigram', value: 'qu', accuracy: 85 },
      { type: 'key', value: 'p', accuracy: 88 },
    ]);
  });

  it('devuelve valores por defecto cuando el usuario no practicó hoy', async () => {
    const { service, prisma } = createService();
    prisma.practiceDay.findUnique.mockResolvedValue(null);
    prisma.practiceSession.findMany.mockResolvedValue([]);
    prisma.keyStat.findMany.mockResolvedValue([]);
    prisma.bigramStat.findMany.mockResolvedValue([]);

    const summary = await service.getTodaySummary('user-1');

    expect(summary.minutesTrained).toBe(0);
    expect(summary.sessionsToday).toBe(0);
    expect(summary.wpm).toEqual({ start: null, end: null, delta: 0 });
    expect(summary.accuracy).toEqual({ start: null, end: null, delta: 0 });
    expect(summary.weakPoints).toEqual([]);
  });
});
