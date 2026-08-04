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
        findUnique: jest.fn().mockResolvedValue(null),
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
      processLessonLayoutStatsInTransaction: jest.fn().mockResolvedValue(undefined),
    };
    const progressService = {
      recordPracticeTimeInTransaction: jest.fn().mockResolvedValue(undefined),
    };
    const telemetryService = { derive: jest.fn() };
    const counter = { inc: jest.fn() };
    const service = new LessonsService(
      prisma as any,
      errorTracking as any,
      progressService as any,
      telemetryService as any,
      counter as any,
    );

    return { service, tx, counter, errorTracking, progressService, telemetryService };
  }

  it('domina la lección en el primer intento calificado aunque el currículo histórico pida más', async () => {
    const { service, tx, counter, errorTracking } = createService(null);

    const result = await service.saveProgress('user-1', lesson.slug, {
      grossWpm: 40,
      netWpm: 36,
      accuracy: 97,
      timeElapsed: 60,
      targetKeyErrors: 1,
      usedAssistance: false,
      errorSummary,
      layoutId: 'qwerty-latam',
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
    expect(errorTracking.processLessonErrorsInTransaction).toHaveBeenCalledTimes(1);
    expect(errorTracking.processLessonLayoutStatsInTransaction).toHaveBeenCalledWith(
      tx,
      'user-1',
      'es',
      'qwerty-latam',
      errorSummary,
    );
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

  it('no duplica estadísticas cuando se reintenta un clientSessionId sincronizado', async () => {
    const { service, tx, errorTracking, telemetryService } = createService(null);
    tx.lessonAttempt.findUnique.mockResolvedValue({ id: 'attempt-1' });

    const result = await service.saveProgress('user-1', lesson.slug, {
      grossWpm: 40, netWpm: 36, accuracy: 97, timeElapsed: 60,
      errorSummary, layoutId: 'qwerty-latam',
      clientSessionId: '72c6ac60-572c-43b5-b84b-c321fb4c6a22',
    });

    expect(result).toEqual({ result: 'duplicate' });
    expect(tx.lessonAttempt.create).not.toHaveBeenCalled();
    expect(errorTracking.processLessonErrorsInTransaction).not.toHaveBeenCalled();
    expect(errorTracking.processLessonLayoutStatsInTransaction).not.toHaveBeenCalled();
  });

  it('envía un resumen corregido sin errores al agregado de la distribución seleccionada', async () => {
    const { service, tx, errorTracking, telemetryService } = createService(null);
    const correctedSummary = {
      totalKeystrokes: 3,
      totalErrors: 0,
      keys: [{ expected: 'a', totalPresses: 3, totalErrors: 0 }],
    };
    telemetryService.derive.mockReturnValue({
      totalFinalInputs: 3,
      uncorrectedErrors: 0,
      keyStats: new Map([['a', { presses: 3, errors: 0 }]]),
    });

    await service.saveProgress('user-1', lesson.slug, {
      grossWpm: 40,
      netWpm: 36,
      accuracy: 100,
      timeElapsed: 60,
      targetKeyErrors: 0,
      errorSummary: correctedSummary,
      telemetry: { version: 1, text: 'aaa', pausedMs: 0, events: [] },
      layoutId: 'qwerty-en',
    });

    expect(errorTracking.processLessonLayoutStatsInTransaction).toHaveBeenCalledWith(
      tx,
      'user-1',
      'es',
      'qwerty-en',
      correctedSummary,
    );
    expect(errorTracking.processLessonErrorsInTransaction).toHaveBeenCalledTimes(1);
    expect(telemetryService.derive).toHaveBeenCalledTimes(1);
  });
});
