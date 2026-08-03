'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, CircleDot, Users } from 'lucide-react';

import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useFriendsData } from '@/hooks/useFriendsData';

export default function FriendsSnapshot() {
  const params = useParams();
  const lang = params.lang as string;
  const t = useTranslations(toSupportedLocale(lang));
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { friends, loading, error } = useFriendsData({
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) return null;

  const onlineCount = friends.filter((friend) => friend.online).length;
  const preview = friends.slice(0, 3);

  return (
    <section className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-(--text-primary)">
            {t('components.friends.friendsSnapshot.general.title')}
          </h3>

          <p className="text-sm text-(--text-secondary)">
            {t('components.friends.friendsSnapshot.general.description')}
          </p>
        </div>

        <Link
          href={`/${lang}/dashboard/friends`}
          className="inline-flex items-center gap-2 rounded-lg border border-(--accent-blue-border) bg-(--accent-blue-bg) px-3 py-2 text-sm font-medium text-(--accent-blue) transition-colors hover:brightness-110"
        >
          {t('components.friends.friendsSnapshot.general.openFriends')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-(--accent-red)">{error}</p>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex items-center gap-3 rounded-xl border border-(--border-card) bg-(--bg-secondary) px-4 py-3">
          <Users className="h-5 w-5 text-(--accent-blue)" />

          <div>
            <p className="text-sm text-(--text-secondary)">
              {t('components.friends.friendsSnapshot.general.totalFriends')}
            </p>

            <p className="text-xl font-bold text-(--text-primary)">
              {loading ? '—' : friends.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-(--text-secondary)">
          <CircleDot className="h-4 w-4 text-(--accent-green)" />

          <span>
            {loading
              ? '—'
              : `${onlineCount} ${t('components.friends.friendsSnapshot.general.onlineNow')}`}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {preview.length > 0 ? (
            preview.map((friend) => (
              <span
                key={friend.id}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                  friend.online
                    ? 'border-(--accent-green-border) bg-(--accent-green-bg) text-(--accent-green)'
                    : 'border-(--border-card) bg-(--bg-secondary) text-(--text-secondary)'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    friend.online ? 'bg-(--accent-green)' : 'bg-(--text-tertiary)'
                  }`}
                />

                {friend.name}
              </span>
            ))
          ) : (
            <p className="text-sm text-(--text-tertiary)">
              {t('components.friends.friendsSnapshot.general.noFriendsYet')}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
