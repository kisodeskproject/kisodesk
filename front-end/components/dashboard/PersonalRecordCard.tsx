// components/dashboard/PersonalRecordCard.tsx

import { Award } from 'lucide-react';

interface PersonalRecordCardProps {
  bestWpm?: number;
  bestAccuracy?: number;
  longestStreak?: number;
  translations: {
    record: string;
    bestWpm: string;
    bestAccuracy: string;
    longestStreak: string;
    days: string;
  };
}

export default function PersonalRecordCard({
  bestWpm,
  bestAccuracy,
  longestStreak,
  translations,
}: PersonalRecordCardProps) {
  const hasData = Boolean(bestWpm) || Boolean(bestAccuracy) || Boolean(longestStreak);

  if (!hasData) return null;

  return (
    <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none">
      <div className="flex items-center gap-2 rounded-t-2xl bg-(--bg-primary) px-6 py-3 light:bg-(--bg-secondary)">
        <Award className="h-5 w-5 text-(--accent-yellow)" />
        <h2 className="text-lg font-semibold text-(--text-primary)">{translations.record}</h2>
      </div>

      <div className="grid grid-cols-3 gap-4 p-5">
        <div>
          <p className="text-2xl font-bold text-(--text-primary)">{bestWpm ?? '—'}</p>
          <p className="text-sm text-(--text-secondary)">{translations.bestWpm}</p>
        </div>

        <div>
          <p className="text-2xl font-bold text-(--text-primary)">
            {typeof bestAccuracy === 'number' ? `${bestAccuracy}%` : '—'}
          </p>
          <p className="text-sm text-(--text-secondary)">{translations.bestAccuracy}</p>
        </div>

        <div>
          <p className="text-2xl font-bold text-(--text-primary)">
            {typeof longestStreak === 'number' ? `${longestStreak} ${translations.days}` : '—'}
          </p>
          <p className="text-sm text-(--text-secondary)">{translations.longestStreak}</p>
        </div>
      </div>
    </div>
  );
}
