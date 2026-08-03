'use client';

import { useCallback, useEffect, useState } from 'react';

import { APIError } from '@/lib/apiClient';
import {
  acceptFriendRequest,
  blockUser,
  getBlockedUsers,
  getFriendRequests,
  getFriends,
  pingPresence,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
  unblockUser,
} from '@/lib/friendsClient';
import type { BlockedUserCard, FriendCard, FriendsRequestsResponse } from '@/types/friends';

interface UseFriendsDataOptions {
  enabled?: boolean;
}

export function useFriendsData({ enabled = true }: UseFriendsDataOptions = {}) {
  const [friends, setFriends] = useState<FriendCard[]>([]);
  const [requests, setRequests] = useState<FriendsRequestsResponse>({
    incoming: [],
    outgoing: [],
  });
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const [friendsResponse, requestsResponse, blockedResponse] = await Promise.all([
        getFriends(),
        getFriendRequests(),
        getBlockedUsers(),
      ]);
      setFriends(friendsResponse.friends);
      setRequests(requestsResponse);
      setBlockedUsers(blockedResponse.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información de amigos');
      setFriends([]);
      setRequests({ incoming: [], outgoing: [] });
      setBlockedUsers([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      refresh();
    }
  }, [enabled, refresh]);

  const refreshAfterAction = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleAction = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null);
      try {
        await action();
        await refreshAfterAction();
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'No se pudo completar la acción');
        }
        throw err;
      }
    },
    [refreshAfterAction],
  );

  const createRequestActions = useCallback(
    (requestId: string) => ({
      accept: () => handleAction(() => acceptFriendRequest(requestId)),
      reject: () => handleAction(() => rejectFriendRequest(requestId)),
    }),
    [handleAction],
  );

  const createFriendActions = useCallback(
    (friendId: string) => ({
      remove: () => handleAction(() => removeFriend(friendId)),
      block: () => handleAction(() => blockUser(friendId)),
    }),
    [handleAction],
  );

  const createSearchActions = useCallback(
    (friendId: string) => ({
      sendRequest: () => handleAction(() => sendFriendRequest(friendId)),
      block: () => handleAction(() => blockUser(friendId)),
    }),
    [handleAction],
  );

  const ping = useCallback(async () => {
    try {
      await pingPresence();
    } catch {
      // No bloquea la UI si el ping falla.
    }
  }, []);

  return {
    friends,
    blockedUsers,
    requests,
    loading,
    error,
    refresh,
    ping,
    setFriends,
    setRequests,
    createRequestActions,
    createFriendActions,
    createSearchActions,
    unblockUser: (friendId: string) => handleAction(() => unblockUser(friendId)),
  };
}
