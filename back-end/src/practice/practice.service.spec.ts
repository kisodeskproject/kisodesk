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
});
