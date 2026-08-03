import {
  DEFAULT_KEYBOARD_LAYOUT_ID,
  fromBackendLayoutCode,
  toBackendLayoutCode,
  type KeyboardLayoutId,
} from '@/lib/keyboardLayouts';
import type { ProfileUser } from '@/types/user';
import type { ContentLanguage } from '@/lib/locales';
export type ProfileFormData = {
  name: string;
  interfaceLanguage: ContentLanguage;
  layoutId: KeyboardLayoutId;
  countryCode: string;
  publicAlias: string;
  showInRanking: boolean;
  searchableByAlias: boolean;
  showPresenceToFriends: boolean;
  shareStatsWithFriends: boolean;
  allowFriendRequests: boolean;
};

export function profileToFormData(profile: ProfileUser): ProfileFormData {
  return {
    name: profile.name ?? '',
    interfaceLanguage: profile.interfaceLanguage ?? 'es',
    layoutId: fromBackendLayoutCode(profile.layout) ?? DEFAULT_KEYBOARD_LAYOUT_ID,
    countryCode: profile.countryCode ?? '',
    publicAlias: profile.publicAlias ?? '',
    showInRanking: profile.showInRanking ?? true,
    searchableByAlias: profile.searchableByAlias ?? true,
    showPresenceToFriends: profile.showPresenceToFriends ?? true,
    shareStatsWithFriends: profile.shareStatsWithFriends ?? true,
    allowFriendRequests: profile.allowFriendRequests ?? true,
  };
}

export function getProfileChanges(profile: ProfileUser, formData: ProfileFormData) {
  const normalizedAlias = formData.publicAlias.trim().toLowerCase();

  return {
    ...(formData.name.trim() !== (profile.name ?? '').trim() ? { name: formData.name.trim() } : {}),
    ...(formData.interfaceLanguage !== (profile.interfaceLanguage ?? 'es')
      ? { interfaceLanguage: formData.interfaceLanguage }
      : {}),
    ...(formData.layoutId !== (fromBackendLayoutCode(profile.layout) ?? DEFAULT_KEYBOARD_LAYOUT_ID)
      ? { layout: toBackendLayoutCode(formData.layoutId) }
      : {}),
    ...(formData.countryCode !== (profile.countryCode ?? '')
      ? { countryCode: formData.countryCode || null }
      : {}),
    ...(normalizedAlias !== (profile.publicAlias ?? '').toLowerCase()
      ? { publicAlias: normalizedAlias || null }
      : {}),
    ...(formData.showInRanking !== (profile.showInRanking ?? true)
      ? { showInRanking: formData.showInRanking }
      : {}),
    ...(formData.searchableByAlias !== (profile.searchableByAlias ?? true)
      ? { searchableByAlias: formData.searchableByAlias }
      : {}),
    ...(formData.showPresenceToFriends !== (profile.showPresenceToFriends ?? true)
      ? { showPresenceToFriends: formData.showPresenceToFriends }
      : {}),
    ...(formData.shareStatsWithFriends !== (profile.shareStatsWithFriends ?? true)
      ? { shareStatsWithFriends: formData.shareStatsWithFriends }
      : {}),
    ...(formData.allowFriendRequests !== (profile.allowFriendRequests ?? true)
      ? { allowFriendRequests: formData.allowFriendRequests }
      : {}),
  };
}
