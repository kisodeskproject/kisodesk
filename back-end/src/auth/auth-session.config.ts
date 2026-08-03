export const ACCESS_TOKEN_TTL_SECONDS = 2 * 60 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const GOOGLE_REAUTH_MAX_AGE_SECONDS = 10 * 60;
export const GOOGLE_OAUTH_STATE_TTL_SECONDS = 10 * 60;

export const ACCESS_TOKEN_COOKIE_PATH = '/';
export const REFRESH_TOKEN_COOKIE_PATH = '/v1/auth';

export function getAuthCookieDomain(): string | undefined {
  return process.env.NODE_ENV === 'production' ? process.env.AUTH_COOKIE_DOMAIN : undefined;
}
