import { describe, expect, it } from '@jest/globals';

import { getProfileChanges, profileToFormData } from './profilePreferences';
import type { ProfileUser } from '@/types/user';

const profile: ProfileUser = {
  id: 'profile-user',
  email: 'profile@example.test',
  name: 'Ana',
  interfaceLanguage: 'es',
  layout: 'QWERTY_LATAM',
  publicAlias: 'ana_typing',
  showInRanking: true,
  searchableByAlias: true,
  showPresenceToFriends: true,
  shareStatsWithFriends: true,
  allowFriendRequests: true,
};

describe('profile preferences form', () => {
  it('does not send unchanged values', () => {
    expect(getProfileChanges(profile, profileToFormData(profile))).toEqual({});
  });

  it('normalizes changed aliases and preserves every changed preference', () => {
    const form = profileToFormData(profile);
    form.name = ' Ana María ';
    form.publicAlias = 'ANA_MARIA';
    form.interfaceLanguage = 'en';
    form.layoutId = 'qwerty-en';
    form.showInRanking = false;
    form.searchableByAlias = false;
    form.showPresenceToFriends = false;
    form.shareStatsWithFriends = false;
    form.allowFriendRequests = false;

    expect(getProfileChanges(profile, form)).toEqual({
      name: 'Ana María',
      publicAlias: 'ana_maria',
      interfaceLanguage: 'en',
      layout: 'QWERTY_US',
      showInRanking: false,
      searchableByAlias: false,
      showPresenceToFriends: false,
      shareStatsWithFriends: false,
      allowFriendRequests: false,
    });
  });

  it('represents a deliberate alias removal as null', () => {
    const form = profileToFormData({ ...profile, showInRanking: false, searchableByAlias: false, showPresenceToFriends: false, shareStatsWithFriends: false, allowFriendRequests: false });
    form.publicAlias = '  ';

    expect(getProfileChanges({ ...profile, showInRanking: false, searchableByAlias: false, showPresenceToFriends: false, shareStatsWithFriends: false, allowFriendRequests: false }, form)).toEqual({ publicAlias: null });
  });
});
