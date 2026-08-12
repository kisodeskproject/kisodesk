// components/ranking/RankingTable.tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getGradeFromScore } from '@/lib/grades';
import { RankUser } from '@/types/ranking';

interface RankingTableProps {
  users: RankUser[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  t: (key: string) => string;
  getMedal: (index: number) => string;
}

export default function RankingTable({
  users,
  loading,
  error,
  onRetry,
  t,
  getMedal,
}: RankingTableProps) {
  if (loading) {
    return (
      <div className="p-6">
        <table className="min-w-full divide-y divide-(--border-card)">
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="h-4 bg-(--bg-secondary) rounded w-8" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-(--bg-secondary) rounded w-24" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-(--bg-secondary) rounded w-12" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-(--bg-secondary) rounded w-12" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-(--bg-secondary) rounded w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-(--accent-red) mx-auto mb-4" />
        <p className="text-(--accent-red) mb-4">{error}</p>
        <Button variant="secondary" onClick={onRetry}>
          {t('ranking.general.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-(--border-card)">
        <thead className="bg-(--bg-primary) light:bg-(--bg-secondary)">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
              {t('ranking.general.user')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
              {t('ranking.general.grossWpm')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
              {t('ranking.general.score')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
              {t('ranking.general.accuracy')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
              {t('ranking.general.level')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-(--border-card)">
          {users.map((user, index) => (
            <tr
              key={user.id}
              className={
                user.isCurrentUser
                  ? 'bg-(--accent-blue-bg) border-l-2 border-(--accent-blue) transition-colors hover:bg-(--bg-card-hover)'
                  : 'transition-colors hover:bg-(--bg-card-hover)'
              }
            >
              <td className="px-6 py-4 whitespace-nowrap">{getMedal(index)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.bestGrossWpm}</td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-(--accent-purple)">
                {user.score}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{user.bestAccuracy}%</td>
              <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-(--accent-amber)">
                {getGradeFromScore(user.score).letter}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
