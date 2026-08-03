// components/dashboard/PracticeCalendar.tsx

'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';

import { TranslationKey, toSupportedLocale, useTranslations } from '@/lib/i18n';

interface PracticeDay {
  date: string;
  minutes: number;
}

interface PracticeCalendarProps {
  data: PracticeDay[];
  weeks?: number;
  showStatusBadge?: boolean;
}

function getIntensityClass(minutes: number, isFuture: boolean): string {
  if (isFuture) return 'bg-transparent';
  if (minutes === 0) return 'bg-slate-600';
  if (minutes < 5) return 'bg-green-300';
  if (minutes < 10) return 'bg-green-500';
  if (minutes < 15) return 'bg-green-700';

  return 'bg-green-900';
}

function formatMinutes(minutes: number, t: (key: TranslationKey) => string): string {
  if (minutes === 0) {
    return t('components.dashboard.practiceCalendar.general.noPractice' as TranslationKey);
  }

  if (minutes < 60) {
    return `${minutes} ${t(
      'components.dashboard.practiceCalendar.general.minutesShort' as TranslationKey,
    )}`;
  }

  const hoursValue = Math.floor(minutes / 60);
  const minutesValue = minutes % 60;

  const hoursLabel = t(
    'components.dashboard.practiceCalendar.general.hoursShort' as TranslationKey,
  );

  const minutesLabel = t(
    'components.dashboard.practiceCalendar.general.minutesShort' as TranslationKey,
  );

  return minutesValue > 0
    ? `${hoursValue}${hoursLabel} ${minutesValue}${minutesLabel}`
    : `${hoursValue}${hoursLabel}`;
}

export default function PracticeCalendar({
  data,
  weeks = 12,
  showStatusBadge = false,
}: PracticeCalendarProps) {
  const { lang } = useParams<{ lang: string }>();
  const locale = toSupportedLocale(lang);
  const t = useTranslations(locale);

  const { months, daysOfWeek } = useMemo(() => {
    const minutesMap = new Map(data.map((day) => [day.date.split('T')[0], day.minutes]));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    const days: {
      date: string;
      day: number;
      month: number;
      minutes: number;
      isFuture: boolean;
    }[] = [];

    for (let index = 0; index < totalDays; index++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);

      const dateString = date.toISOString().split('T')[0];

      days.push({
        date: dateString,
        day: date.getDay(),
        month: date.getMonth(),
        minutes: minutesMap.get(dateString) ?? 0,
        isFuture: date > today,
      });
    }

    const monthsData: {
      label: string;
      cols: number;
      offset: number;
      days: typeof days;
    }[] = [];

    let currentMonth = -1;
    let currentMonthDays: typeof days = [];
    let firstDayOfMonth = 0;

    for (const day of days) {
      if (day.month !== currentMonth) {
        if (currentMonth !== -1) {
          monthsData.push({
            label: new Intl.DateTimeFormat(locale, {
              month: 'short',
            }).format(new Date(2026, currentMonth)),
            cols: Math.ceil((firstDayOfMonth + currentMonthDays.length) / 7),
            offset: firstDayOfMonth,
            days: currentMonthDays,
          });
        }

        currentMonth = day.month;
        currentMonthDays = [];
        firstDayOfMonth = day.day;
      }

      currentMonthDays.push(day);
    }

    if (currentMonth !== -1) {
      monthsData.push({
        label: new Intl.DateTimeFormat(locale, {
          month: 'short',
        }).format(new Date(2026, currentMonth)),
        cols: Math.ceil((firstDayOfMonth + currentMonthDays.length) / 7),
        offset: firstDayOfMonth,
        days: currentMonthDays,
      });
    }

    const dayFormatter = new Intl.DateTimeFormat(locale, {
      weekday: 'narrow',
    });

    const weekDays = Array.from({ length: 7 }, (_, day) =>
      dayFormatter.format(new Date(2026, 0, 4 + day)),
    );

    return {
      months: monthsData,
      daysOfWeek: weekDays,
    };
  }, [data, locale, weeks]);

  return (
    <div className="rounded-xl border border-(--border-card) bg-(--bg-card) p-6 backdrop-blur-sm light:backdrop-blur-none">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-(--text-primary)">
          {t('components.dashboard.practiceCalendar.general.title' as TranslationKey)}
        </h3>

        {showStatusBadge && (
          <span className="rounded bg-(--dashboard-sign-in-badge-background) px-2 py-1 text-xs text-(--dashboard-sign-in-badge-text)">
            {t('components.dashboard.practiceCalendar.general.noData' as TranslationKey)}
          </span>
        )}
      </div>

      <div className="-mx-6 overflow-x-auto px-6">
        <div className="flex gap-4">
          {months.map((month, monthIndex) => (
            <div key={`${month.label}-${monthIndex}`} className="flex flex-col gap-1">
              <span className="mb-1 text-xs text-(--text-secondary)">{month.label}</span>

              <div className="flex gap-1">
                {monthIndex === 0 && (
                  <div className="mr-2 flex flex-col gap-1">
                    {daysOfWeek.map((day, index) => (
                      <div key={`${day}-${index}`} className="flex h-3 w-3 items-center">
                        <span className="text-[10px] leading-none text-(--text-tertiary)">
                          {day}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${month.cols}, 12px)`,
                    gridTemplateRows: 'repeat(7, 12px)',
                    gridAutoFlow: 'column',
                  }}
                >
                  {Array.from({ length: month.offset }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-3 w-3" />
                  ))}

                  {month.days.map((cell) => (
                    <div
                      key={cell.date}
                      className={`h-3 w-3 rounded-sm ${getIntensityClass(
                        cell.minutes,
                        cell.isFuture,
                      )}`}
                      title={
                        cell.isFuture ? '' : `${formatMinutes(cell.minutes, t)} - ${cell.date}`
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-slate-600" />
            <span className="text-[10px] text-(--text-tertiary)">
              {t('components.dashboard.practiceCalendar.general.noActivity' as TranslationKey)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-green-300" />
            <span className="text-[10px] text-(--text-tertiary)">
              {t('components.dashboard.practiceCalendar.general.fiveMinutes' as TranslationKey)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-green-500" />
            <span className="text-[10px] text-(--text-tertiary)">
              {t('components.dashboard.practiceCalendar.general.tenMinutes' as TranslationKey)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-green-900" />
            <span className="text-[10px] text-(--text-tertiary)">
              {t('components.dashboard.practiceCalendar.general.fifteenMinutes' as TranslationKey)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
