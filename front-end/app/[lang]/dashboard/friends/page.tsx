'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CircleDot, Search, UserPlus, Users } from 'lucide-react';

import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Input from '@/components/ui/Input';
import DashboardBackground from '@/components/layout/DashboardBackground';
import { useAuth } from '@/hooks/useAuth';
import { useFriendsData } from '@/hooks/useFriendsData';
import { searchFriends } from '@/lib/friendsClient';
import { useTranslations } from '@/lib/i18n';
import type { SearchUserCard } from '@/types/friends';

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

function FriendshipBadge({
  status,
  text,
}: {
  status: SearchUserCard['friendshipStatus'];
  text: string;
}) {
  const styles = {
    friends: 'border-(--accent-green-border) bg-(--accent-green-bg) text-(--accent-green)',
    pending_outgoing: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    pending_incoming: 'border-(--accent-blue-border) bg-(--accent-blue-bg) text-(--accent-blue)',
    none: 'border-(--border-card) bg-(--bg-secondary) text-(--text-secondary)',
  } as const;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {text}
    </span>
  );
}

export default function FriendsPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const t = useTranslations(lang as never);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    friends,
    blockedUsers,
    requests,
    error,
    refresh,
    createRequestActions,
    createFriendActions,
    createSearchActions,
    unblockUser,
  } = useFriendsData({ enabled: isAuthenticated });

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchUserCard[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  const onlineFriends = useMemo(() => friends.filter((friend) => friend.online), [friends]);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setSearching(true);
    setSearchError(null);
    try {
      const response = await searchFriends(trimmed, 12);
      setSearchResults(response.users);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : t('friends.general.searchError'));
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [query, t]);

  const handleFriendAction = useCallback(async (id: string, action: () => Promise<unknown>) => {
    setActionPendingId(id);
    try {
      await action();
    } finally {
      setActionPendingId(null);
    }
  }, []);

  if (authLoading) {
    return (
      <DashboardBackground>
        <div className="space-y-6 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-(--bg-secondary)" />
          <div className="h-32 animate-pulse rounded-2xl border border-(--border-card) bg-(--bg-card)" />
        </div>
      </DashboardBackground>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardBackground>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold text-(--text-primary)">{t('friends.general.title')}</h1>
          </div>
          <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-6">
            <p className="text-(--text-secondary)">{t('friends.general.guestModeMessage')}</p>
            <Link
              href={`/${lang}/login`}
              className="inline-flex mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              {t('friends.general.signIn')}
            </Link>
          </div>
        </div>
      </DashboardBackground>
    );
  }

  const incomingCount = requests.incoming.length;
  const outgoingCount = requests.outgoing.length;

  return (
    <DashboardBackground>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-(--text-primary)">{t('friends.general.title')}</h1>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-lg border border-(--border-card) bg-(--bg-card) px-4 py-2 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-secondary)"
          >
            {t('friends.general.refresh')}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5">
            <p className="text-sm text-(--text-secondary)">{t('friends.general.totalFriends')}</p>
            <p className="mt-2 text-3xl font-bold text-(--text-primary)">{friends.length}</p>
          </div>
          <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5">
            <p className="text-sm text-(--text-secondary)">{t('friends.general.onlineNow')}</p>
            <p className="mt-2 text-3xl font-bold text-(--text-primary)">{onlineFriends.length}</p>
          </div>
          <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5">
            <p className="text-sm text-(--text-secondary)">{t('friends.general.requests')}</p>
            <p className="mt-2 text-3xl font-bold text-(--text-primary)">
              {incomingCount + outgoingCount}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-(--accent-blue)" />
            <h2 className="text-lg font-semibold text-(--text-primary)">
              {t('friends.general.searchTitle')}
            </h2>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              label={t('friends.general.searchLabel')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('friends.general.searchPlaceholder')}
            />
            <div className="md:self-end">
              <Button onClick={() => void handleSearch()} loading={searching}>
                {t('friends.general.searchButton')}
              </Button>
            </div>
          </div>

          {searchError && <ErrorMessage error={searchError} className="mt-4" />}

          <div className="mt-5 space-y-3">
            {searchResults.map((user) => {
              const statusText =
                user.friendshipStatus === 'friends'
                  ? t('friends.general.statusFriends')
                  : user.friendshipStatus === 'pending_outgoing'
                    ? t('friends.general.statusPendingOutgoing')
                    : user.friendshipStatus === 'pending_incoming'
                      ? t('friends.general.statusPendingIncoming')
                      : t('friends.general.statusNotConnected');
              const canSendRequest = user.friendshipStatus === 'none';

              return (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-(--text-primary)">{user.name}</p>
                      <FriendshipBadge status={user.friendshipStatus} text={statusText} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.friendshipStatus === 'friends' && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/${lang}/dashboard/friends/${user.id}`)}
                      >
                        {t('friends.general.viewStats')}
                      </Button>
                    )}
                    {canSendRequest && (
                      <Button
                        icon={<UserPlus className="h-4 w-4" />}
                        onClick={() =>
                          void handleFriendAction(user.id, () =>
                            createSearchActions(user.id).sendRequest(),
                          ).catch(() => undefined)
                        }
                      >
                        {t('friends.general.sendRequest')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() =>
                        void handleFriendAction(user.id, () =>
                          createSearchActions(user.id).block(),
                        ).catch(() => undefined)
                      }
                    >
                      {t('friends.general.block')}
                    </Button>
                  </div>
                </div>
              );
            })}

            {query.trim() && !searching && searchResults.length === 0 && !searchError && (
              <p className="text-sm text-(--text-tertiary)">{t('friends.general.noSearchResults')}</p>
            )}
          </div>
        </section>

        {error && (
          <ErrorMessage
            error={error}
            onRetry={() => void refresh()}
            retryText={t('friends.general.retry')}
          />
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-(--text-primary)">
                {t('friends.general.incomingRequests')}
              </h2>
              <span className="text-sm text-(--text-secondary)">{incomingCount}</span>
            </div>
            <div className="space-y-3">
              {requests.incoming.map((request) => {
                const actions = createRequestActions(request.id);
                const busy = actionPendingId === request.id;
                return (
                  <div
                    key={request.id}
                    className="rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4"
                  >
                    <p className="font-medium text-(--text-primary)">{request.name}</p>
                    <p className="mt-1 text-xs text-(--text-tertiary)">
                      {t('friends.general.requestedAt')}: {formatLastSeen(request.createdAt, lang)}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        loading={busy}
                        onClick={() =>
                          void handleFriendAction(request.id, actions.accept).catch(() => undefined)
                        }
                      >
                        {t('friends.general.accept')}
                      </Button>
                      <Button
                        variant="outline"
                        loading={busy}
                        onClick={() =>
                          void handleFriendAction(request.id, actions.reject).catch(() => undefined)
                        }
                      >
                        {t('friends.general.reject')}
                      </Button>
                      <Button
                        variant="ghost"
                        loading={busy}
                        onClick={() =>
                          void handleFriendAction(
                            request.userId,
                            createSearchActions(request.userId).block,
                          ).catch(() => undefined)
                        }
                      >
                        {t('friends.general.block')}
                      </Button>
                    </div>
                  </div>
                );
              })}
              {requests.incoming.length === 0 && (
                <p className="text-sm text-(--text-tertiary)">{t('friends.general.noIncomingRequests')}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-(--text-primary)">
                {t('friends.general.outgoingRequests')}
              </h2>
              <span className="text-sm text-(--text-secondary)">{outgoingCount}</span>
            </div>
            <div className="space-y-3">
              {requests.outgoing.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4"
                >
                  <p className="font-medium text-(--text-primary)">{request.name}</p>
                  <p className="mt-1 text-xs text-(--text-tertiary)">
                    {t('friends.general.requestedAt')}: {formatLastSeen(request.createdAt, lang)}
                  </p>
                </div>
              ))}
              {requests.outgoing.length === 0 && (
                <p className="text-sm text-(--text-tertiary)">{t('friends.general.noOutgoingRequests')}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-(--accent-blue)" />
            <h2 className="text-lg font-semibold text-(--text-primary)">
              {t('friends.general.myFriends')}
            </h2>
          </div>

          <div className="space-y-3">
            {friends.map((friend) => {
              const actions = createFriendActions(friend.id);
              return (
                <div
                  key={friend.id}
                  className="rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-(--text-primary)">{friend.name}</p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                            friend.online
                              ? 'border-(--accent-green-border) bg-(--accent-green-bg) text-(--accent-green)'
                              : 'border-(--border-card) bg-(--bg-card) text-(--text-secondary)'
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
                      {friend.presenceVisible && (
                        <p className="mt-1 text-xs text-(--text-tertiary)">
                          {t('friends.general.lastSeen')}: {formatLastSeen(friend.lastSeenAt, lang)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/${lang}/dashboard/friends/${friend.id}`)}
                      >
                        {t('friends.general.viewStats')}
                      </Button>
                      <Button
                        variant="ghost"
                        loading={actionPendingId === friend.id}
                        onClick={() =>
                          void handleFriendAction(friend.id, actions.remove).catch(() => undefined)
                        }
                      >
                        {t('friends.general.remove')}
                      </Button>
                      <Button
                        variant="ghost"
                        loading={actionPendingId === friend.id}
                        onClick={() =>
                          void handleFriendAction(friend.id, actions.block).catch(() => undefined)
                        }
                      >
                        {t('friends.general.block')}
                      </Button>
                    </div>
                  </div>

                  {friend.practiceStats ? (
                    <>
                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <FriendMetric
                          label={t('friends.general.totalSessions')}
                          value={friend.practiceStats.totalSessions}
                        />
                        <FriendMetric
                          label={t('friends.general.averageWpm')}
                          value={friend.practiceStats.averageNetWpm}
                        />
                        <FriendMetric
                          label={t('friends.general.averageAccuracy')}
                          value={`${friend.practiceStats.averageAccuracy}%`}
                        />
                        <FriendMetric
                          label={t('friends.general.bestWpm')}
                          value={friend.practiceStats.bestNetWpm}
                        />
                      </div>
                      <div className="mt-3 text-sm text-(--text-secondary)">
                        {t('friends.general.totalPracticeTime')}:{' '}
                        {formatMinutes(friend.practiceStats.totalTimeElapsed)}
                      </div>
                    </>
                  ) : (
                    <p className="mt-4 text-sm text-(--text-tertiary)">
                      {t('friends.general.statsHidden')}
                    </p>
                  )}
                </div>
              );
            })}

            {friends.length === 0 && (
              <p className="text-sm text-(--text-tertiary)">{t('friends.general.noFriendsYet')}</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5">
          <h2 className="text-lg font-semibold text-(--text-primary)">
            {t('friends.general.blockedUsers')}
          </h2>
          <p className="mt-1 text-sm text-(--text-secondary)">
            {t('friends.general.blockedUsersDescription')}
          </p>
          <div className="mt-4 space-y-3">
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4"
              >
                <span className="font-medium text-(--text-primary)">{user.name}</span>
                <Button
                  variant="outline"
                  onClick={() => void unblockUser(user.id).catch(() => undefined)}
                >
                  {t('friends.general.unblock')}
                </Button>
              </div>
            ))}
            {blockedUsers.length === 0 && (
              <p className="text-sm text-(--text-tertiary)">{t('friends.general.noBlockedUsers')}</p>
            )}
          </div>
        </section>
      </div>
    </DashboardBackground>
  );
}

function FriendMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-(--border-card) bg-(--bg-card) px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-(--text-tertiary)">{label}</p>
      <p className="mt-1 text-lg font-semibold text-(--text-primary)">{value}</p>
    </div>
  );
}
