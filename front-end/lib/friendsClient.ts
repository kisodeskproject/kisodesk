import { apiDelete, apiGet, apiPost } from '@/lib/apiClient';
import type {
  FriendCard,
  FriendRequestCard,
  FriendsRequestsResponse,
  FriendsResponse,
  FriendsSearchResponse,
  SearchUserCard,
  PracticeStats,
  BlockedUsersResponse,
} from '@/types/friends';

export async function getFriends(): Promise<FriendsResponse> {
  return apiGet<FriendsResponse>('/friends');
}

export async function getFriendRequests(): Promise<FriendsRequestsResponse> {
  return apiGet<FriendsRequestsResponse>('/friends/requests');
}

export async function searchFriends(query: string, limit = 10): Promise<FriendsSearchResponse> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  params.set('limit', String(limit));
  return apiGet<FriendsSearchResponse>(`/friends/search?${params.toString()}`);
}

export async function sendFriendRequest(friendId: string): Promise<{ id: string }> {
  return apiPost<{ id: string }>('/friends/requests', { friendId });
}

export async function acceptFriendRequest(requestId: string): Promise<{ id: string }> {
  return apiPost<{ id: string }>(`/friends/requests/${requestId}/accept`);
}

export async function rejectFriendRequest(requestId: string): Promise<{ id: string }> {
  return apiPost<{ id: string }>(`/friends/requests/${requestId}/reject`);
}

export async function removeFriend(friendId: string): Promise<{ id: string }> {
  return apiDelete<{ id: string }>(`/friends/${friendId}`);
}

export async function getBlockedUsers(): Promise<BlockedUsersResponse> {
  return apiGet<BlockedUsersResponse>('/friends/blocked');
}

export async function blockUser(friendId: string): Promise<{ id: string }> {
  return apiPost<{ id: string }>(`/friends/${friendId}/block`);
}

export async function unblockUser(friendId: string): Promise<{ id: string }> {
  return apiDelete<{ id: string }>(`/friends/${friendId}/block`);
}

export async function getFriendPracticeStats(friendId: string): Promise<PracticeStats> {
  return apiGet<PracticeStats>(`/friends/${friendId}/practice-stats`);
}

export async function pingPresence(): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/friends/presence/ping');
}

export type {
  FriendCard,
  FriendRequestCard,
  FriendsRequestsResponse,
  FriendsResponse,
  FriendsSearchResponse,
  SearchUserCard,
  PracticeStats,
};
