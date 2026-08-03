import type { ContentLanguage } from '@/lib/locales';

export type FriendshipStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'friends';

export interface PracticeByLanguageStat {
  language: ContentLanguage;
  totalSessions: number;
  averageNetWpm: number;
  averageAccuracy: number;
}

export interface PracticeStats {
  totalSessions: number;
  averageNetWpm: number;
  averageAccuracy: number;
  bestNetWpm: number;
  totalTimeElapsed: number;
  byLanguage: PracticeByLanguageStat[];
}

export interface FriendCard {
  id: string;
  name: string;
  online: boolean;
  lastSeenAt: string | null;
  presenceVisible: boolean;
  statsVisible: boolean;
  friendshipId: string;
  acceptedAt: string | null;
  practiceStats: PracticeStats | null;
}

export interface FriendRequestCard {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface SearchUserCard {
  id: string;
  name: string;
  friendshipStatus: FriendshipStatus;
}

export interface BlockedUserCard {
  id: string;
  name: string;
}

export interface FriendsSearchResponse {
  users: SearchUserCard[];
}

export interface FriendsRequestsResponse {
  incoming: FriendRequestCard[];
  outgoing: FriendRequestCard[];
}

export interface FriendsResponse {
  friends: FriendCard[];
}

export interface BlockedUsersResponse {
  users: BlockedUserCard[];
}
