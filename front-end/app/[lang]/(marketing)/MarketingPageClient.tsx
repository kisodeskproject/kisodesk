// front-typing/app/[lang]/marketing/MarketingPageClient.tsx

'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import {
  Trophy,
  BookOpen,
  BookOpenText,
  Keyboard,
  Languages,
  ChartNoAxesColumnIncreasing,
  Gift,
  UserRoundX,
  AppWindow,
  Gauge,
  Target,
  BadgeAlert,
  ChartNoAxesCombined,
} from 'lucide-react';
import FeatureCard from '@/components/marketing/FeatureCard';
import StatItem from '@/components/marketing/StatItem';

export default function MarketingPage() {
  const params = useParams();
  const lang = toSupportedLocale(params.lang);
  const t = useTranslations(lang);

  const altNight = t('marketing.page.general.altNight');
  const altDay = t('marketing.page.general.altDay');
  const benefits = [
    {
      Icon: Gift,
      label: t('marketing.page.general.benefitFree'),
      color: '#34D399',
      backgroundColor: 'rgba(52, 211, 153, 0.14)',
    },
    {
      Icon: UserRoundX,
      label: t('marketing.page.general.benefitNoRegistration'),
      color: '#A3E635',
      backgroundColor: 'rgba(163, 230, 53, 0.14)',
    },
    {
      Icon: AppWindow,
      label: t('marketing.page.general.benefitBrowser'),
      color: '#60A5FA',
      backgroundColor: 'rgba(96, 165, 250, 0.14)',
    },
    {
      Icon: Keyboard,
      label: t('marketing.page.general.benefitLanguageKeyboard'),
      color: '#A78BFA',
      backgroundColor: 'rgba(167, 139, 250, 0.14)',
    },
  ];
  const resultsMetrics = [
    {
      Icon: Gauge,
      label: t('marketing.page.general.metricWpm'),
      color: '#60A5FA',
      backgroundColor: 'rgba(96, 165, 250, 0.14)',
    },
    {
      Icon: Target,
      label: t('marketing.page.general.metricAccuracy'),
      color: '#34D399',
      backgroundColor: 'rgba(52, 211, 153, 0.14)',
    },
    {
      Icon: BadgeAlert,
      label: t('marketing.page.general.metricErrors'),
      color: '#FBBF24',
      backgroundColor: 'rgba(251, 191, 36, 0.14)',
    },
    {
      Icon: ChartNoAxesCombined,
      label: t('marketing.page.general.metricHistory'),
      color: '#A78BFA',
      backgroundColor: 'rgba(167, 139, 250, 0.14)',
    },
  ];
  const languageKeyboardItems = [
    {
      Icon: Languages,
      label: t('marketing.page.general.languageKeyboardInterface'),
      color: '#60A5FA',
      backgroundColor: 'rgba(96, 165, 250, 0.14)',
    },
    {
      Icon: BookOpenText,
      label: t('marketing.page.general.languageKeyboardContent'),
      color: '#A78BFA',
      backgroundColor: 'rgba(167, 139, 250, 0.14)',
    },
    {
      Icon: Keyboard,
      label: t('marketing.page.general.languageKeyboardLayouts'),
      color: '#34D399',
      backgroundColor: 'rgba(52, 211, 153, 0.14)',
    },
  ];

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
      title: t('marketing.page.general.coursesTitle'),
      desc: t('marketing.page.general.interactiveLessonsDescription'),
      color: 'blue' as const,
    },
    {
      href: `/${lang}/dashboard`,
      icon: ChartNoAxesColumnIncreasing,
      title: t('marketing.page.general.dashboardTitle'),
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
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-[220px] lg:mt-[70px] mb-20px">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="kisodesk-surface light:border-(--landing-card-border) p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-6 lg:gap-0">
              <StatItem
                align="start"
                value={t('marketing.page.general.learningTitle')}
                label={t('marketing.page.general.learningDescription')}
                color="blue"
              />

              <div className="flex-1 border-b border-(--border-card) px-1 pb-4 lg:border-r lg:border-b-0 lg:pb-0">
                <h2 className="text-center text-lg font-semibold text-(--text-primary) sm:text-xl light:text-white">
                  {t('marketing.page.general.languageKeyboardTitle')}
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm text-(--text-tertiary)">
                  {languageKeyboardItems.map(({ Icon, label, color, backgroundColor }) => (
                    <li key={label} className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor, color }}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 border-b border-(--border-card) px-1 pb-4 lg:border-r lg:border-b-0 lg:pb-0">
                <h2 className="text-center text-lg font-semibold text-(--text-primary) sm:text-xl light:text-white">
                  {t('marketing.page.general.resultsTitle')}
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm text-(--text-tertiary)">
                  {resultsMetrics.map(({ Icon, label, color, backgroundColor }) => (
                    <li key={label} className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor, color }}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-1 px-1">
                <h2 className="min-h-14 text-center text-lg font-semibold text-(--text-primary) sm:text-xl light:text-white">
                  {t('marketing.page.general.immediateAccessTitle')}
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm text-(--text-tertiary)">
                  {benefits.map(({ Icon, label, color, backgroundColor }) => (
                    <li key={label} className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor, color }}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
