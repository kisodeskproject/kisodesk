// lib/authClient.ts
import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient';
import type { AuthResponse, ProfileUser, User } from '@/types/user';
import { toContentLanguage, type ContentLanguage, type Locale } from './locales';

// Inicia sesión con email y contraseña
export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', { email, password });
}

// Inicia sesión con Google
export async function loginWithGoogle(
  lang: Locale = 'es-latam',
  consent?: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
  },
  intent: 'login' | 'delete-account' = 'login',
): Promise<void> {
  const params = new URLSearchParams({ lang: toContentLanguage(lang) });

  if (consent) {
    params.set('termsAccepted', String(consent.termsAccepted));
    params.set('privacyAccepted', String(consent.privacyAccepted));
  }
  if (intent === 'delete-account') params.set('intent', intent);

  window.location.href = `${API_BASE_URL}/auth/google?${params.toString()}`;
}

// Registra un nuevo usuario
export async function register(
  name: string,
  email: string,
  password: string,
  turnstileToken: string | undefined,
  consent: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
  },
): Promise<AuthResponse> {
  const payload: {
    username: string;
    email: string;
    password: string;
    turnstileToken?: string;
    termsAccepted: boolean;
    privacyAccepted: boolean;
  } = {
    username: name,
    email,
    password,
    termsAccepted: consent.termsAccepted,
    privacyAccepted: consent.privacyAccepted,
  };

  const cleanTurnstileToken = turnstileToken?.trim();
  if (cleanTurnstileToken && cleanTurnstileToken.length >= 10) {
    payload.turnstileToken = cleanTurnstileToken;
  }

  return apiPost<AuthResponse>(
    '/auth/register',
    payload,
    { redirect: 'manual' },
  );
}

// Obtiene el usuario autenticado actual
export async function getCurrentUser(): Promise<User | null> {
  try {
    const data = await apiGet<{ authenticated: boolean; user: User | null }>('/auth/me');

    if (data.authenticated && data.user) {
      return data.user;
    }

    return null;
  } catch {
    return null;
  }
}

// Cierra sesión (invalida la cookie HttpOnly en el backend)
export async function logout(): Promise<void> {
  await apiPost('/auth/logout');
}

export async function updateMyPreferences(
  data: Partial<
    Pick<
      User,
      | 'layout'
      | 'interfaceLanguage'
      | 'countryCode'
      | 'name'
      | 'publicAlias'
      | 'showInRanking'
      | 'searchableByAlias'
      | 'showPresenceToFriends'
      | 'shareStatsWithFriends'
      | 'allowFriendRequests'
      | 'updatedAt'
    >
  >,
): Promise<ProfileUser> {
  return apiPatch<ProfileUser>('/users/me', data);
}

export async function exportMyData(): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>('/users/me/export');
}

export async function deleteMyAccount(
  currentPassword: string,
  confirmationEmail: string,
): Promise<void> {
  return apiDelete<void>('/users/me', {
    body: JSON.stringify({ currentPassword, confirmationEmail }),
  });
}

// Solicita recuperación de contraseña
export async function forgotPassword(
  email: string,
  locale: ContentLanguage,
): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/forgot-password', { email, locale });
}

// Restablece contraseña con token
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/reset-password', { token, newPassword });
}

// Re-exportar tipos para compatibilidad con código existente que importe desde authClient
export type { AuthResponse, ProfileUser, User } from '@/types/user';
