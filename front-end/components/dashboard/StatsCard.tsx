// components/dashboard/StatsCard.tsx

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-(--border-card) bg-(--bg-card) p-6 backdrop-blur-sm transition hover:border-(--accent-blue-border) light:backdrop-blur-none">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-(--text-secondary)">{title}</p>

          <p className="mt-1 text-2xl font-bold text-(--text-primary)">{value}</p>

          {description && <p className="mt-1 text-sm text-(--text-tertiary)">{description}</p>}

          {trend && (
            <p
              className={`mt-2 text-sm ${
                trend.isPositive ? 'text-(--accent-green)' : 'text-(--accent-red)'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>

        {icon && <div className="text-(--text-tertiary)">{icon}</div>}
      </div>
    </div>
  );
}
