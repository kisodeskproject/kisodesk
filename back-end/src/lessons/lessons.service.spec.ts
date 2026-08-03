import { LessonProgressStatus } from '@prisma/client';

import { LessonsService } from './lessons.service';

describe('LessonsService mastery', () => {
  const lesson = {
    id: 'lesson-1',
    slug: 'fila-guia',
    type: 'practice',
    minAccuracy: 95,
    maxTargetKeyErrors: 2,
    requiredSuccessfulAttempts: 2,
    courseLessons: [{ course: { languageCode: 'es' } }],
  };
  const errorSummary = {
    totalKeystrokes: 3,
    totalErrors: 1,
    keys: [
      {
        expected: 'a',
        totalPresses: 3,
        totalErrors: 1,
        mistakes: [{ typed: 's', count: 1 }],
      },
    ],
  };

  function createService(existingProgress: Record<string, unknown> | null) {
    const tx = {
      lessonAttempt: {
        create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
      userLessonProgress: {
        findUnique: jest.fn().mockResolvedValue(existingProgress),
        upsert: jest.fn().mockImplementation(({ update, create }) =>
          Promise.resolve({
            id: 'progress-1',
            ...(existingProgress ? update : create),
          }),
        ),
      },
    };
    const prisma = {
      lesson: {
        findFirst: jest.fn().mockResolvedValue(lesson),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const errorTracking = {
      processLessonErrors: jest.fn().mockResolvedValue(undefined),
      processLessonErrorsInTransaction: jest.fn().mockResolvedValue(undefined),
    };
    const progressService = {
      recordPracticeTimeInTransaction: jest.fn().mockResolvedValue(undefined),
    };
    const counter = { inc: jest.fn() };
    const service = new LessonsService(
      prisma as any,
      errorTracking as any,
      progressService as any,
      counter as any,
    );

    return { service, tx, counter, errorTracking, progressService };
  }

  it('domina la lección en el primer intento calificado aunque el currículo histórico pida más', async () => {
    const { service, tx, counter } = createService(null);

    const result = await service.saveProgress('user-1', lesson.slug, {
      grossWpm: 40,
      netWpm: 36,
      accuracy: 97,
      timeElapsed: 60,
      targetKeyErrors: 1,
      usedAssistance: false,
      errorSummary,
    });

    expect(result.qualified).toBe(true);
    expect(result.mastered).toBe(true);
    expect(result.status).toBe(LessonProgressStatus.MASTERED);
    expect(result.successfulAttempts).toBe(1);
    expect(result.bestScore).toBe(3600);
    expect(tx.lessonAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ qualified: true, usedAssistance: false }),
      }),
    );
    expect(tx.userLessonProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_lessonId_localeCode: {
            userId: 'user-1',
            lessonId: lesson.id,
            localeCode: 'es-latam',
          },
        },
        create: expect.objectContaining({
          status: LessonProgressStatus.MASTERED,
          successfulAttempts: 1,
          localeCode: 'es-latam',
        }),
      }),
    );
    expect(counter.inc).toHaveBeenCalledTimes(1);
  });

  it('no califica cuando excede los errores permitidos en teclas objetivo', async () => {
    const { service, tx, counter } = createService(null);

    const result = await service.saveProgress('user-1', lesson.slug, {
      grossWpm: 45,
      netWpm: 40,
      accuracy: 99,
      timeElapsed: 60,
      targetKeyErrors: 3,
      errorSummary,
    });

    expect(result.qualified).toBe(false);
    expect(result.mastered).toBe(false);
    expect(result.status).toBe(LessonProgressStatus.IN_PROGRESS);
    expect(result.bestAccuracy).toBe(0);
    expect(result.recommendation).toBe('review');
    expect(tx.userLessonProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_lessonId_localeCode: {
            userId: 'user-1',
            lessonId: lesson.id,
            localeCode: 'es-latam',
          },
        },
        create: expect.objectContaining({
          userId: 'user-1',
          lessonId: lesson.id,
          localeCode: 'es-latam',
          status: LessonProgressStatus.IN_PROGRESS,
          attemptsCount: 1,
        }),
      }),
    );
    expect(counter.inc).not.toHaveBeenCalled();
  });
});
