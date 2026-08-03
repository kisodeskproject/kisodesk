export const AUTH_REDIRECT_LOCALES = [
  'cs',
  'da',
  'de',
  'en-US',
  'en-GB',
  'es-ES',
  'es-latam',
  'fr',
  'hr',
  'hu',
  'it',
  'nl',
  'no',
  'pl',
  'pt-BR',
  'pt-PT',
  'ro',
  'sv',
  'tr',
] as const;

export type AuthRedirectLocale = (typeof AUTH_REDIRECT_LOCALES)[number];

const CANONICAL_AUTH_REDIRECT_LOCALES: Readonly<Record<string, AuthRedirectLocale>> = {
  en: 'en-US',
  'en-us': 'en-US',
  'en-gb': 'en-GB',
  es: 'es-latam',
  'es-es': 'es-ES',
  'es-latam': 'es-latam',
  'es-419': 'es-latam',
  fr: 'fr',
  'fr-fr': 'fr',
  cs: 'cs',
  da: 'da',
  de: 'de',
  hr: 'hr',
  hu: 'hu',
  it: 'it',
  nl: 'nl',
  no: 'no',
  pl: 'pl',
  'pt-br': 'pt-BR',
  'pt-pt': 'pt-PT',
  ro: 'ro',
  sv: 'sv',
  tr: 'tr',
};

export function toAuthRedirectLocale(value: unknown): AuthRedirectLocale {
  if (typeof value !== 'string') return 'es-latam';
  return CANONICAL_AUTH_REDIRECT_LOCALES[value.trim().toLowerCase()] ?? 'es-latam';
}
