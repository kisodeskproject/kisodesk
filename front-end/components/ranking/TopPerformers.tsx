'use client';

import { RankUser } from '@/types/ranking';

interface TopPerformersProps {
  users: RankUser[];
  getMedal: (index: number) => string;
  t: (key: string) => string;
}

export default function TopPerformers({ users, getMedal, t }: TopPerformersProps) {
  if (users.length === 0) {
    return (
      <p className="text-(--text-tertiary) text-center py-8">{t('ranking.general.noDataYet')}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {users.slice(0, 3).map((user, index) => (
        <div
          key={user.id}
          className="bg-(--bg-secondary) rounded-lg border border-(--border-card) p-4 text-center"
        >
          <span className="text-3xl">{getMedal(index)}</span>
          <p className="text-(--text-primary) font-medium mt-2 truncate">{user.name}</p>
          <p className="text-(--accent-blue) font-bold mt-1">
            {user.bestWpmNet} {t('ranking.topPerformers.general.wpm')}
          </p>
        </div>
      ))}
    </div>
  );
}
