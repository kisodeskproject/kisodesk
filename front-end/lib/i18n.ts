// lib/i18n.ts
import { useCallback } from 'react';
import cs from '../locales/cs.json';
import da from '../locales/da.json';
import de from '../locales/de.json';
import enUS from '../locales/en-US.json';
import enGb from '../locales/en-GB.json';
import esEs from '../locales/es-ES.json';
import esLatam from '../locales/es-latam.json';
import fr from '../locales/fr.json';
import hr from '../locales/hr.json';
import hu from '../locales/hu.json';
import it from '../locales/it.json';
import nl from '../locales/nl.json';
import no from '../locales/no.json';
import pl from '../locales/pl.json';
import ptBR from '../locales/pt-BR.json';
import ptPT from '../locales/pt-PT.json';
import ro from '../locales/ro.json';
import sv from '../locales/sv.json';
import tr from '../locales/tr.json';
import type { Locale } from './locales';

const translations = {
  cs,
  da,
  de,
  'en-US': enUS,
  'en-GB': enGb,
  'es-ES': esEs,
  'es-latam': esLatam,
  fr,
  hr,
  hu,
  it,
  nl,
  no,
  pl,
  'pt-BR': ptBR,
  'pt-PT': ptPT,
  ro,
  sv,
  tr,
};

export {
  DEFAULT_LOCALE,
  isSupportedLocale,
  SUPPORTED_LOCALES,
  toSupportedLocale,
  type Locale,
} from './locales';

// Missing or empty translations must remain visible as their keys so catalogs can be corrected.
// Keep calls type-safe at the value level without rejecting keys that exist only in another catalog.
export type TranslationKey = string;

type TranslationValues = Record<string, string | number>;

function getMessage(locale: Locale, keys: string[]): unknown {
  return keys.reduce<unknown>(
    (value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined),
    translations[locale],
  );
}

function getLocalizedMessage(locale: Locale, keys: string[]): string | undefined {
  const localized = getMessage(locale, keys);
  if (typeof localized === 'string' && localized.trim()) return localized;
  return undefined;
}

function interpolate(value: string, values?: TranslationValues): string {
  const interpolated = values
    ? value.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`))
    : value;

  return interpolated.replace(/\bKiso\s+Desk\b|\bKisodesk\b|\bKISO\s+DESK\b/g, 'KisoDesk');
}

export function useTranslations(lang: Locale) {
  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) => {
      const keys = key.split('.');
      return interpolate(getLocalizedMessage(lang, keys) ?? key, values);
    },
    [lang],
  );

  return t;
}

// ============================================
// FUNCIÓN PARA USO EN SERVER COMPONENTS
// ============================================
export function getTranslation(lang: Locale, key: string, values?: TranslationValues): string {
  const keys = key.split('.');
  return interpolate(getLocalizedMessage(lang, keys) ?? key, values);
}
