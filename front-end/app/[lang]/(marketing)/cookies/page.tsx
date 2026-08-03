// app/[lang]/(marketing)/cookies/page.tsx

import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale, type Locale } from '@/lib/locales';

export type LegalDocumentKind = 'privacy' | 'terms' | 'cookies';
export type LegalLocale = Locale;

interface LegalTable {
  headers: string[];
  rows: string[][];
}

interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
  table?: LegalTable;
}

interface LegalLink {
  label: string;
  path: LegalDocumentKind;
}

export interface LegalDocumentContent {
  title: string;
  contentsLabel: string;
  relatedLabel: string;
  relatedLinks: LegalLink[];
  sections: LegalSection[];
}

const t = getTranslation;

function getCookiesContent(locale: LegalLocale): LegalDocumentContent {
  return {
    title: t(locale, 'marketing.cookies.general.title'),
    contentsLabel: t(locale, 'marketing.cookies.general.contentsLabel'),
    relatedLabel: t(locale, 'marketing.cookies.general.relatedLabel'),
    relatedLinks: [
      {
        label: t(locale, 'marketing.cookies.general.relatedPrivacy'),
        path: 'privacy',
      },
      {
        label: t(locale, 'marketing.cookies.general.relatedTerms'),
        path: 'terms',
      },
    ],
    sections: [
      {
        id: 'definicion',
        title: t(locale, 'marketing.cookies.definition.title'),
        paragraphs: [
          t(locale, 'marketing.cookies.definition.paragraph1'),
          t(locale, 'marketing.cookies.definition.paragraph2'),
          t(locale, 'marketing.cookies.definition.paragraph3'),
        ],
      },
      {
        id: 'datos-tecnicos',
        title: t(locale, 'marketing.cookies.data.title'),
        paragraphs: [
          t(locale, 'marketing.cookies.data.paragraph1'),
          t(locale, 'marketing.cookies.data.paragraph2'),
          t(locale, 'marketing.cookies.data.paragraph3'),
        ],
        items: [
          t(locale, 'marketing.cookies.data.item1'),
          t(locale, 'marketing.cookies.data.item2'),
          t(locale, 'marketing.cookies.data.item3'),
        ],
      },
      {
        id: 'cookies-necesarias',
        title: t(locale, 'marketing.cookies.necessaryCookies.title'),
        paragraphs: [
          t(locale, 'marketing.cookies.necessaryCookies.paragraph1'),
          t(locale, 'marketing.cookies.necessaryCookies.note'),
        ],
        table: {
          headers: [
            t(locale, 'marketing.cookies.necessaryCookies.tableHeaderName'),
            t(locale, 'marketing.cookies.necessaryCookies.tableHeaderPurpose'),
            t(locale, 'marketing.cookies.necessaryCookies.tableHeaderDuration'),
            t(locale, 'marketing.cookies.necessaryCookies.tableHeaderConfiguration'),
          ],
          rows: [
            [
              t(locale, 'marketing.cookies.necessaryCookies.accessTokenName'),
              t(locale, 'marketing.cookies.necessaryCookies.accessTokenPurpose'),
              t(locale, 'marketing.cookies.necessaryCookies.accessTokenDuration'),
              t(locale, 'marketing.cookies.necessaryCookies.accessTokenConfiguration'),
            ],
            [
              t(locale, 'marketing.cookies.necessaryCookies.refreshTokenName'),
              t(locale, 'marketing.cookies.necessaryCookies.refreshTokenPurpose'),
              t(locale, 'marketing.cookies.necessaryCookies.refreshTokenDuration'),
              t(locale, 'marketing.cookies.necessaryCookies.refreshTokenConfiguration'),
            ],
          ],
        },
      },
      {
        id: 'almacenamiento-local',
        title: t(locale, 'marketing.cookies.localStorage.title'),
        paragraphs: [
          t(locale, 'marketing.cookies.localStorage.paragraph1'),
          t(locale, 'marketing.cookies.localStorage.paragraph2'),
        ],
        table: {
          headers: [
            t(locale, 'marketing.cookies.localStorage.tableHeaderKey'),
            t(locale, 'marketing.cookies.localStorage.tableHeaderPurpose'),
            t(locale, 'marketing.cookies.localStorage.tableHeaderDuration'),
          ],
          rows: [
            [
              t(locale, 'marketing.cookies.localStorage.themeKey'),
              t(locale, 'marketing.cookies.localStorage.themePurpose'),
              t(locale, 'marketing.cookies.localStorage.themeDuration'),
            ],
            [
              t(locale, 'marketing.cookies.localStorage.keyboardLayoutKey'),
              t(locale, 'marketing.cookies.localStorage.keyboardLayoutPurpose'),
              t(locale, 'marketing.cookies.localStorage.keyboardLayoutDuration'),
            ],
            [
              t(locale, 'marketing.cookies.localStorage.typingFontKey'),
              t(locale, 'marketing.cookies.localStorage.typingFontPurpose'),
              t(locale, 'marketing.cookies.localStorage.typingFontDuration'),
            ],
            [
              t(locale, 'marketing.cookies.localStorage.typingFontSizeKey'),
              t(locale, 'marketing.cookies.localStorage.typingFontSizePurpose'),
              t(locale, 'marketing.cookies.localStorage.typingFontSizeDuration'),
            ],
          ],
        },
      },
      {
        id: 'proveedores',
        title: t(locale, 'marketing.cookies.providers.title'),
        paragraphs: [
          t(locale, 'marketing.cookies.providers.paragraph1'),
          t(locale, 'marketing.cookies.providers.paragraph2'),
          t(locale, 'marketing.cookies.providers.paragraph3'),
          t(locale, 'marketing.cookies.providers.paragraph4'),
          t(locale, 'marketing.cookies.providers.paragraph5'),
          t(locale, 'marketing.cookies.providers.paragraph6'),
          t(locale, 'marketing.cookies.providers.paragraph7'),
        ],
      },
      {
        id: 'base-legal',
        title: t(locale, 'marketing.cookies.legalBasis.title'),
        paragraphs: [
          t(locale, 'marketing.cookies.legalBasis.paragraph1'),
          t(locale, 'marketing.cookies.legalBasis.paragraph2'),
          t(locale, 'marketing.cookies.legalBasis.paragraph3'),
          t(locale, 'marketing.cookies.legalBasis.paragraph4'),
        ],
      },
      {
        id: 'arco-revocacion',
        title: t(locale, 'marketing.cookies.arco.title'),
        paragraphs: [
          t(locale, 'marketing.cookies.arco.paragraph1'),
          t(locale, 'marketing.cookies.arco.paragraph2'),
          t(locale, 'marketing.cookies.arco.paragraph3'),
          t(locale, 'marketing.cookies.arco.paragraph4'),
          t(locale, 'marketing.cookies.arco.paragraph5'),
        ],
        items: [
          t(locale, 'marketing.cookies.arco.item1'),
          t(locale, 'marketing.cookies.arco.item2'),
          t(locale, 'marketing.cookies.arco.item3'),
          t(locale, 'marketing.cookies.arco.item4'),
          t(locale, 'marketing.cookies.arco.item5'),
          t(locale, 'marketing.cookies.arco.item6'),
          t(locale, 'marketing.cookies.arco.item7'),
          t(locale, 'marketing.cookies.arco.item8'),
        ],
      },
      {
        id: 'gestion',
        title: t(locale, 'marketing.cookies.management.title'),
        paragraphs: [t(locale, 'marketing.cookies.management.paragraph1')],
        items: [
          t(locale, 'marketing.cookies.management.item1'),
          t(locale, 'marketing.cookies.management.item2'),
          t(locale, 'marketing.cookies.management.item3'),
        ],
      },
      {
        id: 'cambios',
        title: t(locale, 'marketing.cookies.changes.title'),
        paragraphs: [
          t(locale, 'marketing.cookies.changes.paragraph1'),
          t(locale, 'marketing.cookies.changes.paragraph2'),
        ],
      },
      {
        id: 'contacto',
        title: t(locale, 'marketing.cookies.contact.title'),
        paragraphs: [
          t(locale, 'marketing.cookies.contact.paragraph1'),
          t(locale, 'marketing.cookies.contact.paragraph2'),
        ],
      },
    ],
  };
}

interface CookiesPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: CookiesPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  return localizedMetadata(lang, '/cookies', {
    [locale]: {
      title: t(locale, 'marketing.cookies.metadata.title'),
      description: t(locale, 'marketing.cookies.metadata.description'),
    },
  });
}

export default async function CookiesPage({ params }: CookiesPageProps) {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);
  const content = getCookiesContent(locale);

  return <LegalDocument content={content} lang={locale} />;
}
