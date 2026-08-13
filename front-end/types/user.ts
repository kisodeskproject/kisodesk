// types/user.ts
import type { ContentLanguage } from '@/lib/locales';
import type { BackendLayoutCode } from '@/lib/keyboardLayouts';

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role?: string;
  authProvider?: 'PASSWORD' | 'GOOGLE';
  layout?: BackendLayoutCode | null;
  interfaceLanguage?: ContentLanguage | null;
  countryCode?: string | null;
  publicAlias?: string | null;
  showInRanking?: boolean;
  searchableByAlias?: boolean;
  showPresenceToFriends?: boolean;
  shareStatsWithFriends?: boolean;
  allowFriendRequests?: boolean;
  dailyGoalMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileUser extends User {
  accessibility?: Record<string, unknown> | null;
  lastLoginAt?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken?: string;
}
