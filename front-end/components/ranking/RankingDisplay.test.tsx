import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import RankingTable from './RankingTable';
import UserStatsCard from './UserStatsCard';

const t = (key: string) => key;

describe('ranking display contract', () => {
  const user = {
    id: 'user-1',
    name: 'alpha',
    bestWpmNet: 60,
    score: 6000,
    bestGrossWpm: 72,
    bestAccuracy: 98,
    bestAchievedAt: '2026-07-18T10:00:00.000Z',
    level: 'silver' as const,
    language: 'global' as const,
  };

  it('muestra 6000 puntos en la tabla para 60 WPM netos', () => {
    render(
      <RankingTable
        users={[user]}
        loading={false}
        error={null}
        onRetry={jest.fn()}
        t={t}
        getMedal={() => '#1'}
        getLevelIcon={() => '🥈'}
      />,
    );

    expect(screen.getByText('6000')).toBeTruthy();
    expect(screen.getByText('72')).toBeTruthy();
    expect(screen.getByText('98%')).toBeTruthy();
  });

  it('muestra puntuación, WPM bruto y precisión del mismo mejor intento', () => {
    render(
      <UserStatsCard
        stats={{ ...user, rank: 1, topPercent: 0, rankingVisible: true }}
        loading={false}
        error={null}
        isAuthenticated
        onRetry={jest.fn()}
        t={t as any}
        getLevelIcon={() => '🥈'}
        getLevelColor={() => ''}
      />,
    );

    expect(screen.getByText('6000')).toBeTruthy();
    expect(screen.getByText('72')).toBeTruthy();
    expect(screen.getByText('98%')).toBeTruthy();
    expect(screen.getByText('#1')).toBeTruthy();
  });

  it('no muestra un aviso cuando faltan prácticas', () => {
    render(
      <UserStatsCard
        stats={{ ...user, rank: 0, topPercent: 0, rankingVisible: true, insufficientData: true }}
        loading={false}
        error={null}
        isAuthenticated
        onRetry={jest.fn()}
        t={t as any}
        getLevelIcon={() => '🥈'}
        getLevelColor={() => ''}
      />,
    );

    expect(screen.queryByText('ranking.general.insufficientData')).toBeNull();
    expect(screen.getAllByText('—')).toHaveLength(6);
  });
});
