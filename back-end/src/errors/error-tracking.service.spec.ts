import { ErrorTrackingService } from './error-tracking.service';

describe('ErrorTrackingService layout statistics', () => {
  function createService() {
    const prisma = {};
    const executeRaw = jest.fn();
    const tx = { $executeRaw: executeRaw };
    return { service: new ErrorTrackingService(prisma as any), tx, executeRaw };
  }

  it.each([
    { totalPresses: 5, totalErrors: 2 },
    { totalPresses: 3, totalErrors: 0 },
  ])(
    'actualiza únicamente key_layout_stats para totalErrors=$totalErrors',
    async ({ totalPresses, totalErrors }) => {
      const { service, tx, executeRaw } = createService();

      await service.processLessonLayoutStatsInTransaction(tx, 'user-1', 'es', 'qwerty-latam', {
        totalKeystrokes: totalPresses,
        totalErrors,
        keys: [{ expected: 'a', totalPresses, totalErrors }],
      });

      expect(executeRaw).toHaveBeenCalledTimes(1);
      const [query, ...values] = executeRaw.mock.calls[0];
      expect(query.join('')).toContain('"key_layout_stats"');
      expect(query.join('')).not.toContain('"key_stats"');
      expect(values).toEqual(
        expect.arrayContaining(['user-1', 'es', 'qwerty-latam', 'a', totalPresses, totalErrors]),
      );
    },
  );

  it('mantiene agregados separados por distribución', async () => {
    const { service, tx, executeRaw } = createService();
    const summary = {
      totalKeystrokes: 5,
      totalErrors: 1,
      keys: [{ expected: 'a', totalPresses: 5, totalErrors: 1 }],
    };

    await service.processLessonLayoutStatsInTransaction(tx, 'user-1', 'es', 'qwerty-latam', summary);
    await service.processLessonLayoutStatsInTransaction(tx, 'user-1', 'es', 'qwerty-en', summary);

    expect(executeRaw.mock.calls[0].slice(1)).toEqual(expect.arrayContaining(['qwerty-latam']));
    expect(executeRaw.mock.calls[1].slice(1)).toEqual(expect.arrayContaining(['qwerty-en']));
  });
});
