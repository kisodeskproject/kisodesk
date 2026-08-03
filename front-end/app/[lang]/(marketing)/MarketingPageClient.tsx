// front-typing/app/[lang]/marketing/MarketingPageClient.tsx

'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { TrendingUp, Trophy, BookOpen, Keyboard, LayoutDashboard } from 'lucide-react';
import FeatureCard from '@/components/marketing/FeatureCard';
import StatItem from '@/components/marketing/StatItem';

export default function MarketingPage() {
  const params = useParams();
  const lang = toSupportedLocale(params.lang);
  const t = useTranslations(lang);

  const altNight = t('marketing.page.general.altNight');
  const altDay = t('marketing.page.general.altDay');

  const featureCards = [
    {
      href: `/${lang}/practice`,
      icon: Keyboard,
      title: t('practice.general.title'),
      desc: t('practice.general.subtitle'),
      color: 'purple' as const,
      featured: true,
    },
    {
      href: `/${lang}/courses`,
      icon: BookOpen,
      title: t('components.layout.sidebar.general.courses'),
      desc: t('marketing.page.general.interactiveLessonsDescription'),
      color: 'blue' as const,
    },
    {
      href: `/${lang}/dashboard`,
      icon: LayoutDashboard,
      title: t('components.layout.sidebar.general.dashboard'),
      desc: t('marketing.page.general.dashboardDescription'),
      color: 'green' as const,
    },
    {
      href: `/${lang}/ranking`,
      icon: Trophy,
      title: t('notFound.general.ranking'),
      desc: t('marketing.page.general.rankingDescription'),
      color: 'yellow' as const,
    },
  ];

  return (
    <div
      className="min-h-screen overflow-x-hidden pt-16 bg-(--bg-primary)"
      style={
        {
          '--bg-card': 'var(--landing-card-bg)',
          '--bg-card-hover': 'var(--landing-card-bg-hover)',
          '--text-primary': 'var(--landing-card-text-primary)',
          '--text-secondary': 'var(--landing-card-text-secondary)',
          '--text-tertiary': 'var(--landing-card-text-secondary)',
        } as React.CSSProperties
      }
    >
      <div className="absolute top-0 left-0 w-full h-[200px] bg-linear-to-b from-slate-950/80 to-transparent light:bg-none z-10 pointer-events-none" />

      <Image
        src="/noche.png"
        alt={altNight}
        width={1448}
        height={1086}
        priority
        unoptimized
        sizes="1900px"
        className="absolute top-[-70px] left-[calc(50%-10px)] h-[1100px] w-[1900px] max-w-none -translate-x-1/2 object-contain z-0 light:hidden"
      />

      <Image
        src="/dia.png"
        alt={altDay}
        width={1448}
        height={1086}
        unoptimized
        sizes="1900px"
        className="absolute top-[-70px] left-[calc(50%-10px)] h-[1100px] w-[1900px] max-w-none -translate-x-1/2 object-contain z-0 hidden light:block"
      />

      <section className="relative z-10 -mt-18">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-4">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-20 items-start">
            <div className="w-full lg:w-1/2 flex flex-col gap-3 mt-[140px] lg:mt-[10px]">
              {featureCards.map((item) => (
                <FeatureCard key={item.href} {...item} />
              ))}
            </div>

            <div className="w-full lg:w-1/2 mt-12 lg:mt-4">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
                <span
                  className="text-(--landing-title-primary-color)"
                  style={{ textShadow: 'var(--landing-title-shadow)' }}
                >
                  {t('marketing.page.general.title1')}
                </span>

                <br />

                <span
                  className="bg-linear-to-r from-(--landing-title-primary-color) to-(--landing-title-secondary-color) bg-clip-text text-transparent"
                  style={{ filter: 'var(--landing-title-filter)' }}
                >
                  {t('marketing.page.general.title2')}
                </span>
              </h1>

              <p
                className="mt-4 text-lg sm:text-xl font-semibold text-slate-700 light:text-(--landing-subtitle-light-text) dark:text-white"
                style={{ textShadow: 'var(--landing-copy-shadow)' }}
              >
                {t('marketing.page.general.subtitle1')}
              </p>

              <p
                className="mt-2 text-md sm:text-lg font-semibold text-slate-600 light:text-(--landing-subtitle-light-text) dark:text-white"
                style={{ textShadow: 'var(--landing-copy-shadow-soft)' }}
              >
                {t('marketing.page.general.subtitle2')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-[220px] lg:mt-[70px] mb-20px">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="kisodesk-surface light:border-(--landing-card-border) p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-6 lg:gap-0">
              <StatItem
                icon={BookOpen}
                value={t('marketing.page.general.learn')}
                label={t('marketing.page.general.guidedLessons')}
                color="blue"
              />

              <StatItem
                icon={Keyboard}
                value={t('marketing.page.general.practiceAction')}
                label={t('marketing.page.general.typingExercises')}
                color="purple"
              />

              <StatItem
                icon={TrendingUp}
                value={t('marketing.page.general.track')}
                label={t('marketing.page.general.progressAndStats')}
                color="blue"
              />

              <StatItem
                icon={Trophy}
                value={t('marketing.page.general.compete')}
                label={t('marketing.page.general.globalRanking')}
                color="purple"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
