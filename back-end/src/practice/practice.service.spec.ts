import { PracticeService } from './practice.service';
import type { SavePracticeDto } from './dto/save-practice.dto';

describe('PracticeService', () => {
  function createService() {
    const tx = {
      $executeRaw: jest.fn(),
      practiceText: {
        findUnique: jest.fn(),
      },
      practiceSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      userRankingCache: { upsert: jest.fn() },
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx)),
      keyLayoutStat: { findMany: jest.fn().mockResolvedValue([]) },
      bigramStat: { findMany: jest.fn().mockResolvedValue([]) },
      practiceSession: { findMany: jest.fn().mockResolvedValue([]) },
      practiceText: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const errorTracking = {
      processPracticeErrorsInTransaction: jest.fn(),
    };

    const progressService = {
      recordPracticeTimeInTransaction: jest.fn(),
    };

    const telemetryService = {
      derive: jest.fn(),
      persistAggregates: jest.fn(),
    };

    const counter = {
      labels: jest.fn().mockReturnValue({ inc: jest.fn() }),
    };

    const histogram = {
      labels: jest.fn().mockReturnValue({ observe: jest.fn() }),
    };

    const service = new PracticeService(
      prisma as any,
      errorTracking as any,
      progressService as any,
      telemetryService as any,
      counter as any,
      counter as any,
      counter as any,
      counter as any,
      counter as any,
      histogram as any,
      histogram as any,
      histogram as any,
    );

    return {
      tx,
      prisma,
      errorTracking,
      progressService,
      counter,
      service,
    };
  }

  function createDto(overrides: Partial<SavePracticeDto> = {}): SavePracticeDto {
    return {
      netWpm: 52,
      grossWpm: 60,
      accuracy: 97,
      timeElapsed: 45,
      language: 'es',
      layoutId: 'qwerty-latam',
      textId: 'default-es-1',
      errorSummary: {
        totalKeystrokes: 120,
        totalErrors: 2,
        keys: [
          {
            expected: 'a',
            totalPresses: 10,
            totalErrors: 1,
          },
        ],
      },
      ...overrides,
    };
  }

  it('guarda practiceTextId cuando el texto existe', async () => {
    const { service, tx } = createService();
    tx.practiceText.findUnique.mockResolvedValue({ id: 'text-1' });
    tx.practiceSession.create.mockResolvedValue({ id: 'session-1', createdAt: new Date() });

    await service.savePractice('user-1', createDto({ textId: 'text-1' }));

    expect(tx.practiceSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          practiceTextId: 'text-1',
        }),
      }),
    );
  });

  it('guarda null cuando el textId no existe en practice_texts', async () => {
    const { service, tx } = createService();
    tx.practiceText.findUnique.mockResolvedValue(null);
    tx.practiceSession.create.mockResolvedValue({ id: 'session-1', createdAt: new Date() });

    await service.savePractice('user-1', createDto({ textId: 'default-es-1' }));

    expect(tx.practiceSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          practiceTextId: null,
        }),
      }),
    );
  });

  it('actualiza bestGrossWpm cuando la práctica lo supera, incluido NULL, sin lectura previa', async () => {
    const { service, tx } = createService();
    tx.practiceSession.create.mockResolvedValue({ id: 'session-1', createdAt: new Date() });

    await service.savePractice('user-1', createDto({ grossWpm: 60 }));

    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', OR: [{ bestGrossWpm: null }, { bestGrossWpm: { lt: 60 } }] },
      data: { bestGrossWpm: 60 },
    });
  });

  it('mantiene bestGrossWpm cuando la práctica no lo supera con una única operación condicional', async () => {
    const { service, tx } = createService();
    tx.practiceSession.create.mockResolvedValue({ id: 'session-1', createdAt: new Date() });
    tx.user.updateMany.mockResolvedValue({ count: 0 });

    await service.savePractice('user-1', createDto({ grossWpm: 40 }));

    expect(tx.user.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', OR: [{ bestGrossWpm: null }, { bestGrossWpm: { lt: 40 } }] },
      data: { bestGrossWpm: 40 },
    });
  });

  it('no cuenta una práctica completada cuando PostgreSQL detecta un reintento duplicado', async () => {
    const { service, tx, counter } = createService();
    tx.practiceSession.findUnique.mockResolvedValue({ id: 'session-1', createdAt: new Date() });

    const result = await service.savePractice('user-1', createDto({ clientSessionId: '5cb5bf29-0d5c-4d3f-8494-8041e73a3f42' }));

    expect(result).toEqual(expect.objectContaining({ result: 'duplicate' }));
    expect(tx.practiceSession.create).not.toHaveBeenCalled();
    expect(counter.labels).toHaveBeenCalledWith('direct');
  });

  it('prioriza errores recurrentes no corregidos antes que caracteres nuevos', async () => {
    const { service, prisma } = createService();
    prisma.keyLayoutStat.findMany.mockResolvedValue([
      { keyChar: 'a', totalPresses: 10, totalErrors: 4, errorRate: 40 },
    ]);
    prisma.practiceText.findMany.mockResolvedValue([
      { id: 'text-1', content: 'alpha atlas beta', difficulty: null, characterSet: [], wordIndex: [], bigramIndex: [] },
    ]);

    const exercise = await service.getNextAdaptiveExercise('user-1', 'es', 'qwerty-latam', 'words');

    expect(exercise.targets.keys).toContain('a');
    expect(exercise.composition.persistentErrors).toBe(1);
    expect(exercise.reason).toBe('Prioriza errores recurrentes no corregidos.');
    expect(exercise.text).toContain('a');
  });

  it('no clasifica una tecla sin errores como débil', async () => {
    const { service, prisma } = createService();
    prisma.keyLayoutStat.findMany.mockResolvedValue([
      { keyChar: 'z', totalPresses: 20, totalErrors: 0, errorRate: 0 },
    ]);
    prisma.practiceText.findMany.mockResolvedValue([
      { id: 'text-1', content: 'zoo zebra', difficulty: null, characterSet: [], wordIndex: [], bigramIndex: [] },
    ]);

    const exercise = await service.getNextAdaptiveExercise('user-1', 'es', 'qwerty-latam', 'words');

    expect(exercise.targets.keys).not.toContain('z');
    expect(exercise.composition.weakKeys).toBe(0);
  });

  it('genera palabras que contienen el bigrama débil y explica ese objetivo', async () => {
    const { service, prisma } = createService();
    prisma.keyLayoutStat.findMany.mockResolvedValue([
      { keyChar: 'a', totalPresses: 5, totalErrors: 0, errorRate: 0 },
      { keyChar: 'b', totalPresses: 5, totalErrors: 0, errorRate: 0 },
    ]);
    prisma.bigramStat.findMany.mockResolvedValue([
      { firstChar: 'a', secondChar: 'b', totalPresses: 8, totalErrors: 2, averageLatencyMs: 380 },
    ]);
    prisma.practiceText.findMany.mockResolvedValue([
      { id: 'text-1', content: 'caba baba casa', difficulty: null, characterSet: [], wordIndex: [], bigramIndex: [] },
    ]);

    const exercise = await service.getNextAdaptiveExercise('user-1', 'es', 'qwerty-latam', 'words');

    expect(exercise.targets.bigrams).toEqual(['ab']);
    expect(exercise.text.toLocaleLowerCase()).toContain('ab');
    expect(exercise.reason).toBe('Prioriza bigramas débiles con errores recurrentes.');
  });

  it('introduce como máximo dos caracteres nuevos y completa el resto con repaso', async () => {
    const { service, prisma } = createService();
    // Presiones suficientes (sin errores, tecla ausente del corpus) para que la
    // confianza del perfil supere el umbral y habilite los 2 cupos de caracteres nuevos.
    prisma.keyLayoutStat.findMany.mockResolvedValue([
      { keyChar: 'z', totalPresses: 200, totalErrors: 0 },
    ]);
    prisma.practiceText.findMany.mockResolvedValue([
      { id: 'text-1', content: 'alpha beta gamma', difficulty: null, characterSet: [], wordIndex: [], bigramIndex: [] },
    ]);

    const exercise = await service.getNextAdaptiveExercise('user-1', 'es', 'qwerty-latam', 'words');

    expect(exercise.composition.newCharacters).toBe(2);
    expect(exercise.composition.newCharacters / 6).toBeLessThanOrEqual(1 / 3);
    expect(exercise.composition.review).toBe(4);
    expect(exercise.reason).toBe(
      'Introduce caracteres nuevos de forma gradual y conserva repaso general.',
    );
  });

  it('prioriza caracteres nuevos por tipo: letras, luego números, luego símbolos', async () => {
    const { service, prisma } = createService();
    prisma.keyLayoutStat.findMany.mockResolvedValue([
      { keyChar: 'q', totalPresses: 200, totalErrors: 0 },
    ]);
    prisma.practiceText.findMany.mockResolvedValue([
      { id: 'text-1', content: 'x : 4 c', difficulty: null, characterSet: [], wordIndex: [], bigramIndex: [] },
    ]);

    const exercise = await service.getNextAdaptiveExercise('user-1', 'es', 'qwerty-latam', 'words');

    // Con 4 candidatos (x, :, 4, c) y solo 2 cupos, se eligen las dos letras
    // en orden alfabético antes que el número o el símbolo.
    expect(exercise.targets.keys).toEqual(['c', 'x']);
    expect(exercise.composition.newCharacters).toBe(2);
  });

  it('con confianza baja (perfil sin historial) introduce un solo carácter nuevo', async () => {
    const { service, prisma } = createService();
    prisma.practiceText.findMany.mockResolvedValue([
      { id: 'text-1', content: 'alpha beta gamma', difficulty: null, characterSet: [], wordIndex: [], bigramIndex: [] },
    ]);

    const exercise = await service.getNextAdaptiveExercise('user-1', 'es', 'qwerty-latam', 'words');

    expect(exercise.profile.confidence).toBeLessThan(0.5);
    expect(exercise.composition.newCharacters).toBe(1);
    expect(exercise.reason).toBe(
      'Introduce un carácter nuevo de forma gradual y conserva repaso general.',
    );
  });

  it('da hasta 2 cupos al bigrama débil cuando no hay errores persistentes ni teclas débiles', async () => {
    const { service, prisma } = createService();
    prisma.bigramStat.findMany.mockResolvedValue([
      { firstChar: 'a', secondChar: 'b', totalPresses: 8, totalErrors: 2, averageLatencyMs: 380 },
      { firstChar: 'c', secondChar: 'd', totalPresses: 8, totalErrors: 2, averageLatencyMs: 380 },
    ]);
    prisma.practiceText.findMany.mockResolvedValue([
      { id: 'text-1', content: 'abcd abcd abcd', difficulty: null, characterSet: [], wordIndex: [], bigramIndex: [] },
    ]);

    const exercise = await service.getNextAdaptiveExercise('user-1', 'es', 'qwerty-latam', 'words');

    expect(exercise.composition.persistentErrors).toBe(0);
    expect(exercise.composition.weakKeys).toBe(0);
    expect(exercise.composition.weakBigrams).toBe(2);
    expect(exercise.targets.bigrams).toEqual(['ab', 'cd']);
  });

  it('rota el punto de partida del repaso según las sesiones ya practicadas', async () => {
    const { service, prisma } = createService();
    prisma.practiceText.findMany.mockResolvedValue([
      { id: 'text-1', content: 'alpha beta gamma delta epsilon zeta', difficulty: null, characterSet: [], wordIndex: [], bigramIndex: [] },
    ]);
    const baseProfile = {
      language: 'es',
      locale: 'es-latam',
      layoutId: 'qwerty-latam',
      totalInputs: 0,
      totalFinalInputs: 0,
      correctFinalInputs: 0,
      totalIncorrectAttempts: 0,
      correctedErrors: 0,
      uncorrectedErrors: 0,
      totalActiveDurationMs: 0,
      finalAccuracy: 100,
      keyStats: {},
      bigramStats: {},
    };

    const first = await service.getGuestAdaptiveExercise({
      mode: 'words',
      profile: { ...baseProfile, sampleSessions: 0 },
    } as any);
    const second = await service.getGuestAdaptiveExercise({
      mode: 'words',
      profile: { ...baseProfile, sampleSessions: 3 },
    } as any);

    expect(first.text).not.toBe(second.text);
  });

  it('usa el mismo priorizador para el perfil anónimo sin persistirlo', async () => {
    const { service, prisma } = createService();
    prisma.practiceText.findMany.mockResolvedValue([
      { id: 'text-1', content: 'casa cama cacao' },
    ]);

    const exercise = await service.getGuestAdaptiveExercise({
      mode: 'words',
      profile: {
        language: 'es', locale: 'es-latam', layoutId: 'qwerty-latam', sampleSessions: 2,
        totalInputs: 10, totalFinalInputs: 8, correctFinalInputs: 8, totalIncorrectAttempts: 2,
        correctedErrors: 2, uncorrectedErrors: 0, totalActiveDurationMs: 5000, finalAccuracy: 100,
        keyStats: { x: { attempts: 200, errors: 2, latencyTotalMs: 2400, latencySamples: 10, recurrence: 2 } },
        bigramStats: {},
      },
    } as any);

    expect(exercise.targets.keys).not.toContain('x');
    expect(exercise.targets.keys).toEqual(['a', 'c']);
    expect(exercise.reason).toContain('nuevo');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rechaza perfiles anónimos con más estadísticas de las permitidas', async () => {
    const { service } = createService();
    await expect(service.getGuestAdaptiveExercise({
      profile: {
        language: 'es', locale: 'es-latam', layoutId: 'qwerty-latam', sampleSessions: 0,
        totalInputs: 0, totalFinalInputs: 0, correctFinalInputs: 0, totalIncorrectAttempts: 0,
        correctedErrors: 0, uncorrectedErrors: 0, totalActiveDurationMs: 0, finalAccuracy: 100,
        keyStats: Object.fromEntries(Array.from({ length: 257 }, (_, index) => [`x${index}`, {}])), bigramStats: {},
      },
    } as any)).rejects.toThrow('Demasiadas estadísticas adaptativas');
  });
});
