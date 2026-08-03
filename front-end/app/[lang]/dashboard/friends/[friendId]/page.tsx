'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { CircleDot, ChevronLeft, Clock, Target, Zap } from 'lucide-react';

import ErrorMessage from '@/components/ui/ErrorMessage';
import DashboardBackground from '@/components/layout/DashboardBackground';
import { useAuth } from '@/hooks/useAuth';
import { useFriendsData } from '@/hooks/useFriendsData';
import { useTranslations } from '@/lib/i18n';

function formatLastSeen(value: string | null, lang: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatMinutes(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

export default function FriendDetailPage() {
  const params = useParams();
  const lang = params.lang as string;
  const friendId = params.friendId as string;
  const t = useTranslations(lang as never);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { friends, error, loading, refresh } = useFriendsData({ enabled: isAuthenticated });

  if (authLoading || loading) {
    return (
      <DashboardBackground>
        <div className="h-64 animate-pulse rounded-2xl border border-(--border-card) bg-(--bg-card)" />
      </DashboardBackground>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardBackground>
        <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-6">
          <p className="text-(--text-secondary)">{t('friends.general.guestModeMessage')}</p>
          <Link
            href={`/${lang}/login`}
            className="mt-4 inline-flex rounded-lg bg-(--accent-blue) px-4 py-2 text-sm font-medium text-(--text-inverse)"
          >
            {t('friends.general.signIn')}
          </Link>
        </div>
      </DashboardBackground>
    );
  }

  const friend = friends.find((item) => item.id === friendId);

  if (error && !friend) {
    return (
      <DashboardBackground>
        <ErrorMessage error={error} onRetry={() => void refresh()} retryText={t('friends.general.retry')} />
      </DashboardBackground>
    );
  }

  if (!friend) {
    return (
      <DashboardBackground>
        <div className="space-y-4">
          <Link
            href={`/${lang}/dashboard/friends`}
            className="inline-flex items-center gap-2 text-sm text-(--accent-blue)"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('friends.general.backToFriends')}
          </Link>
          <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-6">
            <p className="text-(--text-secondary)">{t('friends.general.friendNotFound')}</p>
          </div>
        </div>
      </DashboardBackground>
    );
  }

  return (
    <DashboardBackground>
      <div className="space-y-6">
      <Link
        href={`/${lang}/dashboard/friends`}
        className="inline-flex items-center gap-2 text-sm text-(--accent-blue)"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('friends.general.backToFriends')}
      </Link>

      <section className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-(--text-primary)">{friend.name}</h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                  friend.online
                    ? 'border-(--accent-green-border) bg-(--accent-green-bg) text-(--accent-green)'
                    : 'border-(--border-card) bg-(--bg-secondary) text-(--text-secondary)'
                }`}
              >
                <CircleDot className="h-3.5 w-3.5" />
                {friend.presenceVisible
                  ? friend.online
                    ? t('friends.general.online')
                    : t('friends.general.offline')
                  : t('friends.general.presenceHidden')}
              </span>
            </div>
            {friend.presenceVisible ? (
              <p className="mt-1 text-sm text-(--text-tertiary)">
                {t('friends.general.lastSeen')}: {formatLastSeen(friend.lastSeenAt, lang)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-(--text-tertiary)">{t('friends.general.presenceHidden')}</p>
            )}
          </div>
        </div>
      </section>

      {friend.practiceStats ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard
              icon={<Zap className="h-5 w-5" />}
              label={t('friends.general.totalSessions')}
              value={friend.practiceStats.totalSessions}
            />
            <MetricCard
              icon={<Target className="h-5 w-5" />}
              label={t('friends.general.averageAccuracy')}
              value={`${friend.practiceStats.averageAccuracy}%`}
            />
            <MetricCard
              icon={<Zap className="h-5 w-5" />}
              label={t('friends.general.averageWpm')}
              value={friend.practiceStats.averageNetWpm}
            />
            <MetricCard
              icon={<Clock className="h-5 w-5" />}
              label={t('friends.general.totalPracticeTime')}
              value={formatMinutes(friend.practiceStats.totalTimeElapsed)}
            />
          </section>

          <section className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-6">
            <h2 className="text-lg font-semibold text-(--text-primary)">
              {t('friends.general.byLanguage')}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {friend.practiceStats.byLanguage.map((entry) => (
                <div
                  key={entry.language}
                  className="rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4"
                >
                  <p className="font-medium text-(--text-primary)">
                    {entry.language.toUpperCase()}
                  </p>
                  <p className="mt-2 text-sm text-(--text-secondary)">
                    {t('friends.general.totalSessions')}: {entry.totalSessions}
                  </p>
                  <p className="text-sm text-(--text-secondary)">
                    {t('friends.general.averageWpm')}: {entry.averageNetWpm}
                  </p>
                  <p className="text-sm text-(--text-secondary)">
                    {t('friends.general.averageAccuracy')}: {entry.averageAccuracy}%
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-6">
          <p className="text-(--text-secondary)">{t('friends.general.statsHidden')}</p>
        </section>
      )}
      </div>
    </DashboardBackground>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5">
      <div className="mb-3 inline-flex rounded-full border border-(--border-card) bg-(--bg-secondary) p-2 text-(--accent-blue)">
        {icon}
      </div>
      <p className="text-sm text-(--text-secondary)">{label}</p>
      <p className="mt-1 text-2xl font-bold text-(--text-primary)">{value}</p>
    </div>
  );
}
