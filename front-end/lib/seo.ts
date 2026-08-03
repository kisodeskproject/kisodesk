import type { Metadata } from 'next';
import {
  getHreflangAlternates,
  OPEN_GRAPH_LOCALE_BY_LOCALE,
  SUPPORTED_LOCALES,
  toSupportedLocale,
  type Locale,
} from './locales';

export const siteUrl = 'https://kisodesk.online';

type SeoContent = { title: string; description: string };

type LocalizedSeo = Partial<Record<Locale, SeoContent>>;

export function localizedMetadata(lang: string, path: string, content: LocalizedSeo): Metadata {
  const locale = toSupportedLocale(lang);
  const localizedPath = `/${locale}${path}`;
  const fallbackContent = content['es-latam'] ?? content['en-US'] ?? Object.values(content)[0];
  const localeContent = content[locale] ?? fallbackContent;

  if (!localeContent) {
    throw new Error('Se requiere contenido SEO para generar los metadatos localizados');
  }
  const title = localeContent.title.replace(/\s*\|\s*Kiso\s?Desk\s*$/i, '');
  const description = localeContent.description;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${localizedPath}`,
      languages: getHreflangAlternates(path, siteUrl),
    },
    openGraph: {
      type: 'website',
      url: `${siteUrl}${localizedPath}`,
      title,
      description,
      locale: OPEN_GRAPH_LOCALE_BY_LOCALE[locale],
      alternateLocale: SUPPORTED_LOCALES.filter(
        (supportedLocale) => supportedLocale !== locale,
      ).map((supportedLocale) => OPEN_GRAPH_LOCALE_BY_LOCALE[supportedLocale]),
      siteName: 'Kiso Desk',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}
