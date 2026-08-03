// components/marketing/StatItem.tsx
import { LucideIcon } from 'lucide-react';

interface StatItemProps {
  icon: LucideIcon;
  value: string;
  label: string;
  color: 'blue' | 'purple';
}

export default function StatItem({ icon: Icon, value, label, color }: StatItemProps) {
  return (
    <div className="flex-1 px-1 flex items-center justify-start border-b lg:border-b-0 lg:border-r last:lg:border-r-0 border-(--border-card) pb-4 lg:pb-0">
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 mr-4 border backdrop-blur-xs"
        style={{
          borderColor: `var(--accent-${color}-border)`,
          backgroundColor: `var(--accent-${color}-bg)`,
        }}
      >
        <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: `var(--accent-${color})` }} />
      </div>

      <div>
        <div className="text-2xl sm:text-4xl font-bold text-(--text-primary) light:text-white">{value}</div>
        <div className="text-base sm:text-lg text-(--text-tertiary)">{label}</div>
      </div>
    </div>
  );
}
