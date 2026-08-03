import { RankingService } from './ranking.service';

describe('RankingService', () => {
  const achievedAt = new Date('2026-07-18T10:00:00.000Z');

  function createService() {
    const prisma = {
      userRankingCache: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    return { prisma, service: new RankingService(prisma as any) };
  }

  it('publica desde la primera práctica y expone las métricas del mismo intento', async () => {
    const { prisma, service } = createService();
    prisma.userRankingCache.count.mockResolvedValue(1);
    prisma.userRankingCache.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        user: { id: 'user-1', publicAlias: 'alpha' },
        bestWpmNet: 60,
        bestGrossWpm: 72,
        bestAccuracy: 98,
        bestAchievedAt: achievedAt,
      },
    ]);

    await expect(service.getRanking('es')).resolves.toEqual(
      expect.objectContaining({
        ranking: [
          expect.objectContaining({
            score: 6000,
            bestWpmNet: 60,
            bestGrossWpm: 72,
            bestAccuracy: 98,
            bestAchievedAt: achievedAt.toISOString(),
          }),
        ],
        distribution: [{ wpm: 60, accuracy: 98 }],
      }),
    );
    expect(prisma.userRankingCache.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ bestWpmNet: 'desc' }, { bestAchievedAt: 'asc' }, { userId: 'asc' }],
      }),
    );
    expect(prisma.userRankingCache.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { bestWpmNet: true, bestAccuracy: true },
      }),
    );
  });

  it('calcula una posición ordinal única con el mismo orden de la tabla', async () => {
    const { prisma, service } = createService();
    prisma.userRankingCache.findUnique.mockResolvedValue({
      bestWpmNet: 60,
      bestGrossWpm: 70,
      bestAccuracy: 97,
      bestAchievedAt: achievedAt,
      totalSessionsUsed: 1,
    });
    prisma.user.findUnique.mockResolvedValue({ showInRanking: true, publicAlias: 'alpha' });
    prisma.userRankingCache.findMany.mockResolvedValue([
      { userId: 'earlier', bestWpmNet: 60, bestAchievedAt: new Date('2026-07-17') },
      { userId: 'user-1', bestWpmNet: 60, bestAchievedAt: achievedAt },
    ]);

    await expect(service.getUserStats('user-1', 'global')).resolves.toEqual(
      expect.objectContaining({ score: 6000, rank: 2, bestGrossWpm: 70, bestAccuracy: 97 }),
    );
  });

  it('mantiene métricas propias pero oculta posición cuando no participa', async () => {
    const { prisma, service } = createService();
    prisma.userRankingCache.findUnique.mockResolvedValue({
      bestWpmNet: 62, bestGrossWpm: 70, bestAccuracy: 96, bestAchievedAt: achievedAt, totalSessionsUsed: 1,
    });
    prisma.user.findUnique.mockResolvedValue({ showInRanking: false, publicAlias: null });

    await expect(service.getUserStats('user-1', 'global')).resolves.toEqual(
      expect.objectContaining({ score: 6200, rank: 0, rankingVisible: false }),
    );
  });
});
