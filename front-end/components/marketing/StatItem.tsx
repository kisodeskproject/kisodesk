// components/marketing/StatItem.tsx
import { LucideIcon } from 'lucide-react';

interface StatItemProps {
  icon?: LucideIcon;
  value: string;
  label: string;
  color: 'blue' | 'purple';
  align?: 'start' | 'center';
}

export default function StatItem({
  icon: Icon,
  value,
  label,
  color,
  align = 'center',
}: StatItemProps) {
  return (
    <div
      className={`flex flex-1 flex-col border-b border-(--border-card) px-1 pb-4 lg:border-r lg:border-b-0 lg:pb-0 ${
        align === 'start' ? 'items-start text-left' : 'items-center text-center'
      }`}
    >
      {Icon && (
        <div
          className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border backdrop-blur-xs sm:h-16 sm:w-16"
          style={{
            borderColor: `var(--accent-${color}-border)`,
            backgroundColor: `var(--accent-${color}-bg)`,
          }}
        >
          <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: `var(--accent-${color})` }} />
        </div>
      )}

      <div className="w-full">
        <div
          className={`text-lg font-semibold text-(--text-primary) sm:text-xl light:text-white ${
            align === 'start' ? 'text-center' : ''
          }`}
        >
          {value}
        </div>
        <div
          className={`text-sm text-(--text-tertiary) sm:text-base ${align === 'start' ? 'text-left' : ''}`}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
