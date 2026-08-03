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
