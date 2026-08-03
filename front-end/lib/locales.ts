export const SUPPORTED_LOCALES = [
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

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type ContentLanguage =
  | 'cs'
  | 'da'
  | 'de'
  | 'en'
  | 'es'
  | 'fr'
  | 'hr'
  | 'hu'
  | 'it'
  | 'nl'
  | 'no'
  | 'pl'
  | 'pt'
  | 'ro'
  | 'sv'
  | 'tr';

export const DEFAULT_LOCALE: Locale = 'es-latam';
export const DEFAULT_CONTENT_LANGUAGE: ContentLanguage = 'en';

const CANONICAL_LOCALE_BY_NORMALIZED_VALUE: Readonly<Record<string, Locale>> = {
  cs: 'cs',
  da: 'da',
  de: 'de',
  en: 'en-US',
  'en-us': 'en-US',
  'en-gb': 'en-GB',
  es: 'es-latam',
  'es-es': 'es-ES',
  'es-latam': 'es-latam',
  'es-419': 'es-latam',
  fr: 'fr',
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

export const LOCALE_OPTIONS: ReadonlyArray<{ code: Locale; label: string }> = [
  { code: 'cs', label: 'Čeština' },
  { code: 'da', label: 'Dansk' },
  { code: 'de', label: 'Deutsch' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español (España)' },
  { code: 'es-latam', label: 'Español (Latinoamérica)' },
  { code: 'fr', label: 'Français' },
  { code: 'hr', label: 'Hrvatski' },
  { code: 'hu', label: 'Magyar' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'no', label: 'Norsk' },
  { code: 'pl', label: 'Polski' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'pt-PT', label: 'Português (Portugal)' },
  { code: 'ro', label: 'Română' },
  { code: 'sv', label: 'Svenska' },
  { code: 'tr', label: 'Türkçe' },
];

export const CONTENT_LANGUAGE_OPTIONS: ReadonlyArray<{
  code: ContentLanguage;
  label: string;
}> = [
  { code: 'cs', label: 'Čeština' },
  { code: 'da', label: 'Dansk' },
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español (Latinoamérica)' },
  { code: 'fr', label: 'Français' },
  { code: 'hr', label: 'Hrvatski' },
  { code: 'hu', label: 'Magyar' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'no', label: 'Norsk' },
  { code: 'pl', label: 'Polski' },
  { code: 'pt', label: 'Português' },
  { code: 'ro', label: 'Română' },
  { code: 'sv', label: 'Svenska' },
  { code: 'tr', label: 'Türkçe' },
];

export const OPEN_GRAPH_LOCALE_BY_LOCALE: Readonly<Record<Locale, string>> = {
  cs: 'cs_CZ',
  da: 'da_DK',
  de: 'de_DE',
  'en-US': 'en_US',
  'en-GB': 'en_GB',
  'es-ES': 'es_ES',
  'es-latam': 'es_419',
  fr: 'fr_FR',
  hr: 'hr_HR',
  hu: 'hu_HU',
  it: 'it_IT',
  nl: 'nl_NL',
  no: 'nb_NO',
  pl: 'pl_PL',
  'pt-BR': 'pt_BR',
  'pt-PT': 'pt_PT',
  ro: 'ro_RO',
  sv: 'sv_SE',
  tr: 'tr_TR',
};

// Route identifiers are product-facing and intentionally remain stable. Google
// hreflang supports ISO 639-1 plus an optional ISO 3166-1 alpha-2 region, not
// UN M49 codes such as 419. Keep the Latin America route, but target generic
// Spanish in its alternate annotation.
export const HREFLANG_BY_LOCALE: Readonly<Record<Locale, string>> = {
  cs: 'cs',
  da: 'da',
  de: 'de',
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  'es-ES': 'es-ES',
  'es-latam': 'es',
  fr: 'fr',
  hr: 'hr',
  hu: 'hu',
  it: 'it',
  nl: 'nl',
  no: 'no',
  pl: 'pl',
  'pt-BR': 'pt-BR',
  'pt-PT': 'pt-PT',
  ro: 'ro',
  sv: 'sv',
  tr: 'tr',
};

// HTML accepts BCP 47 tags. This is intentionally distinct from hreflang,
// whose Google-supported region syntax is more restrictive.
export const HTML_LANG_BY_LOCALE: Readonly<Record<Locale, string>> = {
  ...HREFLANG_BY_LOCALE,
  'es-latam': 'es-419',
};

export function getHrefLang(locale: Locale): string {
  return HREFLANG_BY_LOCALE[locale];
}

export function getHtmlLang(locale: Locale): string {
  return HTML_LANG_BY_LOCALE[locale];
}

export function getHreflangAlternates(path: string, siteUrl: string): Record<string, string> {
  return {
    ...Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => [getHrefLang(locale), `${siteUrl}/${locale}${path}`]),
    ),
    // Google recommends a generic English fallback when regional English
    // versions exist. en-US is the product's chosen generic English version.
    en: `${siteUrl}/en-US${path}`,
    'x-default': `${siteUrl}/es-latam${path}`,
  };
}

export function getCanonicalLocale(value: unknown): Locale | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return (
    CANONICAL_LOCALE_BY_NORMALIZED_VALUE[normalized] ??
    CANONICAL_LOCALE_BY_NORMALIZED_VALUE[normalized.split('-')[0]] ??
    null
  );
}

export function isSupportedLocale(value: unknown): value is Locale {
  return getCanonicalLocale(value) !== null;
}

export function toSupportedLocale(value: unknown): Locale {
  return getCanonicalLocale(value) ?? DEFAULT_LOCALE;
}

export function isContentLanguage(value: unknown): value is ContentLanguage {
  return CONTENT_LANGUAGE_OPTIONS.some((language) => language.code === value);
}

export function toContentLanguage(value: unknown): ContentLanguage {
  const locale = getCanonicalLocale(value);
  if (!locale) return DEFAULT_CONTENT_LANGUAGE;
  if (locale === 'es-ES' || locale === 'es-latam') return 'es';
  if (locale === 'en-US' || locale === 'en-GB') return 'en';
  if (locale === 'pt-BR' || locale === 'pt-PT') return 'pt';
  return locale;
}

export function resolveLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  const requestedLocales = header
    .split(',')
    .map((entry, index) => {
      const [tag, ...parameters] = entry.trim().split(';');
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().toLowerCase().startsWith('q='),
      );
      const quality = qualityParameter
        ? Number.parseFloat(qualityParameter.split('=')[1] ?? '0')
        : 1;
      return {
        locale: getCanonicalLocale(tag),
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .filter((entry): entry is { locale: Locale; quality: number; index: number } =>
      Boolean(entry.locale),
    )
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  return requestedLocales[0]?.locale ?? DEFAULT_LOCALE;
}
