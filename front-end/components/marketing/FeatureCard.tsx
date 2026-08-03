// components/marketing/FeatureCard.tsx
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  color: 'blue' | 'purple' | 'green' | 'yellow';
  featured?: boolean;
}

export default function FeatureCard({ href, icon: Icon, title, desc, color, featured = false }: FeatureCardProps) {
  return (
    <Link href={href} className="block">
      <div
        className={[
          'kisodesk-surface kisodesk-surface-interactive light:border-(--landing-card-border)',
          featured ? 'w-[73.333%] px-[16px] py-[18.2px]' : 'w-2/3 p-[16px]',
        ].join(' ')}
      >
        <div className="flex items-center gap-5">
          <div
            className={[
              featured ? 'w-[60px] h-[60px]' : 'w-14 h-14',
              'rounded-2xl flex items-center justify-center shrink-0 border',
            ].join(' ')}
            style={{
              borderColor: `var(--accent-${color}-border)`,
              backgroundColor: `var(--accent-${color}-bg)`,
            }}
          >
            <Icon
              className={featured ? 'w-[35px] h-[35px]' : 'w-8 h-8'}
              style={{ color: `var(--accent-${color})` }}
            />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-(--text-primary)">{title}</h2>
            <p className="text-sm sm:text-base text-(--text-secondary)">{desc}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
