'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { CONTENT_LANGUAGE_OPTIONS } from '@/lib/locales';
import { getCountryOptions } from '@/lib/countries';
import { useAuth } from '@/hooks/useAuth';
import { deleteMyAccount, loginWithGoogle, updateMyPreferences } from '@/lib/authClient';
import type { Locale } from '@/lib/locales';
import { APIError, apiGet } from '@/lib/apiClient';
import {
  DEFAULT_KEYBOARD_LAYOUT_ID,
  getEnabledLayouts,
  type KeyboardLayoutId,
} from '@/lib/keyboardLayouts';
import {
  getProfileChanges,
  profileToFormData,
  type ProfileFormData,
} from '@/lib/profilePreferences';
import {
  canContinueProfileNavigation,
  hasPendingProfileChanges,
  registerBeforeUnloadWarning,
} from '@/lib/profilePendingChanges';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ErrorMessage from '@/components/ui/ErrorMessage';
import DashboardBackground from '@/components/layout/DashboardBackground';
import {
  readCookieConsent,
  saveCookieConsent,
  type CookieConsent,
  type CookieConsentDecision,
} from '@/components/legal/cookieConsent';
import type { ProfileUser } from '@/types/user';
import { Award, Edit3, Save, Trash2, X } from 'lucide-react';

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getAccessibilityLabel(accessibility?: Record<string, unknown> | null): string {
  if (!accessibility) return '—';
  const keys = Object.keys(accessibility);
  if (keys.length === 0) return '—';
  return `${keys.length} ajuste${keys.length === 1 ? '' : 's'}`;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const t = useTranslations(lang as never);
  const { isAuthenticated, loading: authLoading, checkAuth, updateUser } = useAuth();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    interfaceLanguage: 'es',
    layoutId: DEFAULT_KEYBOARD_LAYOUT_ID,
    countryCode: '',
    publicAlias: '',
    showInRanking: true,
    searchableByAlias: true,
    showPresenceToFriends: true,
    shareStatsWithFriends: true,
    allowFriendRequests: true,
  });
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [accountActionError, setAccountActionError] = useState<string | null>(null);
  const [requiresGoogleReauth, setRequiresGoogleReauth] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setCookieConsent(readCookieConsent());
  }, []);

  const updateCookieConsent = (status: CookieConsentDecision) => {
    try {
      setCookieConsent(saveCookieConsent(status));
    } catch {
      setAccountActionError(t('profile.general.cookieConsentSaveError'));
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('deleteAccount') === '1') {
      setDeleteOpen(true);
      setAccountActionError(null);
    } else if (query.get('googleReauth') === 'failed') {
      setAccountActionError(t('profile.general.googleReauthFailed'));
    }
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet<ProfileUser>('/users/me');
        setProfile(data);
        setFormData(profileToFormData(data));
      } catch (err) {
        if (err instanceof APIError && err.status === 401) {
          await checkAuth();
          return;
        }
        setError(err instanceof Error ? err.message : t('profile.general.loadErrorText'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [checkAuth, isAuthenticated, t]);

  const layoutOptions = useMemo(() => getEnabledLayouts(), []);

  const validateName = (value: string) => value.trim().length > 0;
  const validateAlias = (value: string) => /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/.test(value);

  const changedFields = useMemo(
    () => (profile ? getProfileChanges(profile, formData) : {}),
    [formData, profile],
  );
  const hasChanges = Object.keys(changedFields).length > 0;
  const hasPendingChanges = editing && hasPendingProfileChanges(hasChanges, saving);

  useEffect(() => {
    if (!hasPendingChanges) return;

    const message = 'Tienes cambios sin guardar. ¿Quieres descartarlos?';
    const removeBeforeUnload = registerBeforeUnloadWarning(true);
    const interceptLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element | null)?.closest('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank') return;
      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        destination.pathname === window.location.pathname
      )
        return;
      if (!canContinueProfileNavigation(true, () => window.confirm(message)))
        event.preventDefault();
    };
    const interceptHistory = () => {
      if (!canContinueProfileNavigation(true, () => window.confirm(message))) window.history.go(1);
    };

    document.addEventListener('click', interceptLink, true);
    window.addEventListener('popstate', interceptHistory);
    return () => {
      removeBeforeUnload();
      document.removeEventListener('click', interceptLink, true);
      window.removeEventListener('popstate', interceptHistory);
    };
  }, [hasPendingChanges]);

  const handleSave = async () => {
    if (!profile || savingRef.current || !hasChanges) return;

    if (!validateName(formData.name)) {
      setError(t('profile.general.nameRequired'));
      return;
    }

    const socialFeatureEnabled =
      formData.showInRanking ||
      formData.searchableByAlias ||
      formData.showPresenceToFriends ||
      formData.shareStatsWithFriends ||
      formData.allowFriendRequests;
    if (socialFeatureEnabled && !validateAlias(formData.publicAlias.trim())) {
      setError(t('profile.general.publicAliasInvalid'));
      return;
    }

    savingRef.current = true;
    setError(null);
    setSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await updateMyPreferences({ ...changedFields, updatedAt: profile.updatedAt });

      const nextProfile: ProfileUser = {
        ...profile,
        ...updated,
        layout: updated.layout ?? profile.layout,
        interfaceLanguage: updated.interfaceLanguage ?? profile.interfaceLanguage,
      };

      setProfile(nextProfile);
      setFormData(profileToFormData(nextProfile));
      updateUser(updated);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err instanceof APIError && err.status === 401) {
        await checkAuth();
        return;
      }
      if (err instanceof APIError && err.status === 409) {
        setError(t('profile.general.conflictError'));
        return;
      }
      setError(err instanceof Error ? err.message : t('profile.general.saveError'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData(profileToFormData(profile));
    }
    setEditing(false);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setDeletePassword('');
    setDeleteEmail('');
    setRequiresGoogleReauth(false);
    setAccountActionError(null);
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;

    if (deleteEmail.trim().toLowerCase() !== profile.email.toLowerCase()) {
      setAccountActionError(t('profile.general.deleteEmailMismatch'));
      return;
    }
    const isGoogleAccount = profile.authProvider === 'GOOGLE';
    if (!isGoogleAccount && deletePassword.length < 8) {
      setAccountActionError(t('profile.general.deletePasswordRequired'));
      return;
    }

    setDeleting(true);
    setAccountActionError(null);
    try {
      await deleteMyAccount(deletePassword, deleteEmail.trim());
      updateUser(null);
      router.replace(`/${lang}/login?accountDeleted=1`);
      router.refresh();
    } catch (err) {
      const errorCode =
        err instanceof APIError && err.data && typeof err.data === 'object'
          ? (err.data as { code?: string }).code
          : undefined;
      if (errorCode === 'GOOGLE_REAUTH_REQUIRED') {
        setRequiresGoogleReauth(true);
        setAccountActionError(t('profile.general.googleReauthRequired'));
      } else if (err instanceof APIError && err.status === 401) {
        setAccountActionError(t('profile.general.deleteInvalidPassword'));
      } else if (err instanceof APIError && err.status === 400) {
        setAccountActionError(t('profile.general.deleteEmailMismatch'));
      } else {
        setAccountActionError(t('profile.general.deleteError'));
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleGoogleReauthentication = async () => {
    setAccountActionError(null);
    await loginWithGoogle(lang as Locale, undefined, 'delete-account');
  };

  const headingClasses =
    'text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 light:from-(--page-title-primary-color) light:to-(--page-title-secondary-color) bg-clip-text text-transparent';
  const cardClasses =
    'bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none rounded-xl border border-(--border-card)';
  const sectionBg = 'bg-(--bg-secondary)';
  const displayLayout = layoutOptions.find((layout) => layout.id === formData.layoutId);
  const countryOptions = useMemo(() => getCountryOptions(lang), [lang]);
  const displayLayoutDescription = displayLayout?.description ?? null;
  const accountAge = formatDate(profile?.createdAt, lang);
  const lastAccess = formatDate(profile?.lastLoginAt, lang);
  const lastUpdate = formatDate(profile?.updatedAt, lang);

  if (authLoading || loading) {
    return (
      <DashboardBackground>
        <div className="space-y-6 p-6">
          <div>
            <div className="h-8 bg-(--bg-secondary) rounded w-48 animate-pulse mb-2" />
          </div>
          <div className={`${cardClasses} p-6 animate-pulse`}>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-(--bg-secondary) rounded-full" />
              <div className="space-y-2">
                <div className="h-5 bg-(--bg-secondary) rounded w-32" />
                <div className="h-4 bg-(--bg-secondary) rounded w-48" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-(--bg-secondary) rounded w-24 mb-2" />
                  <div className="h-5 bg-(--bg-secondary) rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardBackground>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardBackground>
        <div className="space-y-6 p-6">
          <div>
            <h1 className={headingClasses}>{t('profile.general.title')}</h1>
          </div>
          <div className={`${cardClasses} p-6`}>
            <p className="text-(--text-secondary)">{t('profile.general.guestModeMessage')}</p>
            <Link
              href={`/${lang}/login`}
              className="inline-flex mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              {t('profile.general.signIn')}
            </Link>
          </div>
        </div>
      </DashboardBackground>
    );
  }

  if (!profile) {
    return (
      <DashboardBackground>
        <div className="p-6 text-center py-12">
          <ErrorMessage error={error || t('profile.general.loadError')} />
          <Button onClick={() => window.location.reload()} variant="secondary" className="mt-4">
            {t('profile.general.retry')}
          </Button>
        </div>
      </DashboardBackground>
    );
  }

  return (
    <DashboardBackground>
      <div className="space-y-6 p-6">
        <div>
          <h1 className={headingClasses}>{t('profile.general.title')}</h1>
        </div>

        {saveSuccess && (
          <div
            aria-live="polite"
            className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2"
          >
            <Award className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-300">{t('profile.general.savedSuccessfully')}</span>
          </div>
        )}

        {error && <ErrorMessage error={error} />}

        <div className={`${cardClasses} overflow-hidden`}>
          <div className="border-b border-(--border-card) bg-linear-to-r from-blue-500/20 via-sky-500/15 to-indigo-500/20 light:bg-none px-6 py-8 dark:from-blue-600/30 dark:via-blue-500/20 dark:to-purple-600/30">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {profile.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-(--text-primary)">
                  {profile.name ?? '—'}
                </h2>
                <p className="text-(--text-secondary)">{profile.email}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-400 font-semibold rounded text-sm uppercase">
                    {profile.role === 'ADMIN' ? t('profile.general.adminRole') : t('profile.general.userRole')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {editing ? (
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="profile-name"
                    label={t('profile.general.name')}
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={!formData.name.trim() ? (t('profile.general.required') as string) : undefined}
                  />

                  <div>
                    <label
                      htmlFor="profile-email"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      {t('profile.general.email')}
                    </label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={profile.email}
                      disabled
                      className="w-full rounded-md border border-(--border-card) bg-(--bg-card-hover) px-3 py-2 text-sm text-(--text-tertiary)"
                    />
                    <p className="mt-1.5 text-xs text-(--text-tertiary)">
                      {t('profile.general.emailReadOnly')}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="profile-country"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      País
                    </label>
                    <select
                      id="profile-country"
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      className="w-full rounded-md border border-(--border-card) bg-(--bg-secondary) px-3 py-2 text-sm text-(--text-primary) shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-(--accent-blue-border) focus:border-(--accent-blue)"
                    >
                      <option value="">Sin especificar</option>
                      {countryOptions.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="profile-interface-language"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      {t('profile.general.interfaceLanguage')}
                    </label>
                    <select
                      id="profile-interface-language"
                      name="interfaceLanguage"
                      value={formData.interfaceLanguage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          interfaceLanguage:
                            e.target.value as (typeof CONTENT_LANGUAGE_OPTIONS)[number]['code'],
                        })
                      }
                      className="w-full rounded-md border border-(--border-card) bg-(--bg-secondary) px-3 py-2 text-sm text-(--text-primary) shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-(--accent-blue-border) focus:border-(--accent-blue)"
                    >
                      {CONTENT_LANGUAGE_OPTIONS.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="profile-keyboard-layout"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      {t('profile.general.keyboardLayout')}
                    </label>
                    <select
                      id="profile-keyboard-layout"
                      name="layout"
                      value={formData.layoutId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          layoutId: e.target.value as KeyboardLayoutId,
                        })
                      }
                      className="w-full rounded-md border border-(--border-card) bg-(--bg-secondary) px-3 py-2 text-sm text-(--text-primary) shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-(--accent-blue-border) focus:border-(--accent-blue)"
                    >
                      {layoutOptions.map((layout) => (
                        <option key={layout.id} value={layout.id}>
                          {layout.name}
                        </option>
                      ))}
                    </select>
                    {displayLayoutDescription && (
                      <p className="mt-1.5 text-xs text-(--text-tertiary)">
                        {displayLayoutDescription}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4">
                  <div>
                    <h3 className="font-semibold text-(--text-primary)">
                      {t('profile.general.socialPrivacyTitle')}
                    </h3>
                  </div>

                  <Input
                    id="profile-public-alias"
                    label={t('profile.general.publicAlias')}
                    name="publicAlias"
                    autoComplete="username"
                    spellCheck={false}
                    value={formData.publicAlias}
                    onChange={(event) =>
                      setFormData({ ...formData, publicAlias: event.target.value })
                    }
                    placeholder={t('profile.general.publicAliasPlaceholder')}
                    error={
                      formData.publicAlias && !validateAlias(formData.publicAlias)
                        ? t('profile.general.publicAliasInvalid')
                        : undefined
                    }
                  />
                  <p className="text-xs text-(--text-tertiary)">{t('profile.general.publicAliasHelp')}</p>

                  <div className="grid gap-3 md:grid-cols-2">
                    <PrivacyToggle
                      checked={formData.showInRanking}
                      label={t('profile.general.showInRanking')}
                      description={t('profile.general.showInRankingHelp')}
                      onChange={(checked) => setFormData({ ...formData, showInRanking: checked })}
                    />
                    <PrivacyToggle
                      checked={formData.searchableByAlias}
                      label={t('profile.general.searchableByAlias')}
                      description={t('profile.general.searchableByAliasHelp')}
                      onChange={(checked) =>
                        setFormData({ ...formData, searchableByAlias: checked })
                      }
                    />
                    <PrivacyToggle
                      checked={formData.allowFriendRequests}
                      label={t('profile.general.allowFriendRequests')}
                      description={t('profile.general.allowFriendRequestsHelp')}
                      onChange={(checked) =>
                        setFormData({ ...formData, allowFriendRequests: checked })
                      }
                    />
                    <PrivacyToggle
                      checked={formData.showPresenceToFriends}
                      label={t('profile.general.showPresenceToFriends')}
                      description={t('profile.general.showPresenceToFriendsHelp')}
                      onChange={(checked) =>
                        setFormData({ ...formData, showPresenceToFriends: checked })
                      }
                    />
                    <PrivacyToggle
                      checked={formData.shareStatsWithFriends}
                      label={t('profile.general.shareStatsWithFriends')}
                      description={t('profile.general.shareStatsWithFriendsHelp')}
                      onChange={(checked) =>
                        setFormData({ ...formData, shareStatsWithFriends: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
                    <Save size={16} className="mr-1" />
                    {saving ? t('profile.general.savingText') : t('profile.general.save')}
                  </Button>
                  <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                    <X size={16} className="mr-1" />
                    {t('profile.general.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-(--text-primary)">
                      {t('profile.general.accountSection')}
                    </h3>
                    <div
                      className={`${sectionBg} rounded-lg border border-(--border-card) p-4 space-y-4`}
                    >
                      <ProfileItem label={t('profile.general.name')} value={profile.name ?? '—'} />
                      <ProfileItem label={t('profile.general.email')} value={profile.email} />
                      <ProfileItem label={t('profile.general.memberSince')} value={accountAge} />
                      <ProfileItem label={t('profile.general.lastLogin')} value={lastAccess} />
                      <ProfileItem label={t('profile.general.lastUpdate')} value={lastUpdate} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-(--text-primary)">
                      {t('profile.general.preferencesSection')}
                    </h3>
                    <div
                      className={`${sectionBg} rounded-lg border border-(--border-card) p-4 space-y-4`}
                    >
                      <ProfileItem
                        label={t('profile.general.interfaceLanguage')}
                        value={
                          CONTENT_LANGUAGE_OPTIONS.find(
                            (language) => language.code === profile.interfaceLanguage,
                          )?.label ?? '—'
                        }
                      />
                      <ProfileItem
                        label={t('profile.general.keyboardLayout')}
                        value={displayLayout?.name ?? '—'}
                      />
                      <ProfileItem
                        label={t('profile.general.accessibility')}
                        value={getAccessibilityLabel(profile.accessibility)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-(--border-card) bg-(--bg-secondary) p-4">
                  <div>
                    <h3 className="font-semibold text-(--text-primary)">
                      {t('profile.general.socialPrivacyTitle')}
                    </h3>
                  </div>
                  <ProfileItem
                    label={t('profile.general.publicAlias')}
                    value={profile.publicAlias ?? t('profile.general.notConfigured')}
                  />
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <PrivacyStatus
                      label={t('profile.general.showInRanking')}
                      enabled={profile.showInRanking ?? true}
                      enabledText={t('profile.general.enabled')}
                      disabledText={t('profile.general.disabled')}
                    />
                    <PrivacyStatus
                      label={t('profile.general.searchableByAlias')}
                      enabled={profile.searchableByAlias ?? true}
                      enabledText={t('profile.general.enabled')}
                      disabledText={t('profile.general.disabled')}
                    />
                    <PrivacyStatus
                      label={t('profile.general.allowFriendRequests')}
                      enabled={profile.allowFriendRequests ?? true}
                      enabledText={t('profile.general.enabled')}
                      disabledText={t('profile.general.disabled')}
                    />
                    <PrivacyStatus
                      label={t('profile.general.showPresenceToFriends')}
                      enabled={profile.showPresenceToFriends ?? true}
                      enabledText={t('profile.general.enabled')}
                      disabledText={t('profile.general.disabled')}
                    />
                    <PrivacyStatus
                      label={t('profile.general.shareStatsWithFriends')}
                      enabled={profile.shareStatsWithFriends ?? true}
                      enabledText={t('profile.general.enabled')}
                      disabledText={t('profile.general.disabled')}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-(--border-card)">
                  <Button onClick={() => setEditing(true)}>
                    <Edit3 size={16} className="mr-1" />
                    {t('profile.general.editProfile')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={`${cardClasses} p-6`}>
            <h2 className="text-lg font-semibold text-(--text-primary)">
              {t('profile.general.privacyCookiesTitle')}
            </h2>
            <p className="mt-1 text-sm text-(--text-secondary)">
              {t('profile.general.privacyCookiesDescription')}
            </p>
            <p className="mt-4 text-sm text-(--text-secondary)">
              {cookieConsent?.status === 'accepted'
                ? t('profile.general.cookieConsentAccepted')
                : cookieConsent?.status === 'rejected'
                  ? t('profile.general.cookieConsentRejected')
                  : t('profile.general.cookieConsentUnset')}
              {cookieConsent?.updatedAt
                ? ` ${t('profile.general.cookieConsentUpdatedAt')} ${formatDate(cookieConsent.updatedAt, lang)}`
                : ''}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => updateCookieConsent('accepted')}>
                {t('profile.general.cookieConsentAccept')}
              </Button>
              <Button variant="secondary" onClick={() => updateCookieConsent('rejected')}>
                {t('profile.general.cookieConsentReject')}
              </Button>
            </div>
          </div>

          <div className={`${cardClasses} p-6`}>
            <h2 className="text-lg font-semibold text-(--text-primary)">
              {t('profile.general.dataControlsTitle')}
            </h2>

            {accountActionError && (
              <div className="mt-4">
                <ErrorMessage error={accountActionError} />
              </div>
            )}

            <div className="mt-5 rounded-lg border border-(--accent-red-border) bg-red-500/5 p-4">
              <Trash2 className="h-5 w-5 text-red-400" />
              <h3 className="mt-3 font-medium text-(--text-primary)">{t('profile.general.deleteTitle')}</h3>
              <p className="mt-1 text-sm text-(--text-secondary)">
                {t('profile.general.deleteDescription')}
              </p>
              <Button
                variant="danger"
                className="mt-4"
                onClick={() => {
                  setAccountActionError(null);
                  setDeleteOpen(true);
                }}
              >
                {t('profile.general.deleteButton')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteOpen}
        onClose={closeDeleteModal}
        title={t('profile.general.deleteModalTitle')}
        hideFooter
      >
        <div className="space-y-4">
          <p className="text-sm">{t('profile.general.deleteModalDescription')}</p>
          <p className="text-sm font-medium text-(--text-primary)">
            {t('profile.general.deleteConfirmEmailInstruction')} <strong>{profile.email}</strong>
          </p>
          <Input
            type="email"
            label={t('profile.general.deleteConfirmEmail')}
            value={deleteEmail}
            onChange={(event) => setDeleteEmail(event.target.value)}
            autoComplete="email"
            disabled={deleting}
          />
          {profile.authProvider !== 'GOOGLE' && (
            <Input
              type="password"
              label={t('profile.general.deleteCurrentPassword')}
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              autoComplete="current-password"
              disabled={deleting}
            />
          )}
          {accountActionError && <ErrorMessage error={accountActionError} />}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeDeleteModal} disabled={deleting}>
              {t('profile.general.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={deleting}
              disabled={
                deleteEmail.trim().toLowerCase() !== profile.email.toLowerCase() ||
                (profile.authProvider !== 'GOOGLE' && deletePassword.length < 8)
              }
            >
              {deleting ? t('profile.general.deleting') : t('profile.general.deleteConfirmButton')}
            </Button>
            {requiresGoogleReauth && profile.authProvider === 'GOOGLE' && (
              <Button variant="secondary" onClick={handleGoogleReauthentication} disabled={deleting}>
                {t('profile.general.googleReauthButton')}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </DashboardBackground>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="block text-sm font-medium text-(--text-secondary)">{label}</p>
      <p className="mt-1 text-(--text-primary) font-semibold">{value}</p>
    </div>
  );
}

function PrivacyToggle({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-(--border-card) bg-(--bg-card) p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <span>
        <span className="block text-sm font-medium text-(--text-primary)">{label}</span>
        <span className="mt-1 block text-xs text-(--text-tertiary)">{description}</span>
      </span>
    </label>
  );
}

function PrivacyStatus({
  label,
  enabled,
  enabledText,
  disabledText,
}: {
  label: string;
  enabled: boolean;
  enabledText: string;
  disabledText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-(--border-card) bg-(--bg-card) px-3 py-2">
      <span className="text-(--text-secondary)">{label}</span>
      <span className={enabled ? 'text-green-400' : 'text-(--text-tertiary)'}>
        {enabled ? enabledText : disabledText}
      </span>
    </div>
  );
}
