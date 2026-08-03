// app/[lang]/(marketing)/terms/page.tsx

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
  eyebrow: string;
  title: string;
  description: string;
  introduction: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  contentsLabel: string;
  relatedLabel: string;
  relatedLinks: LegalLink[];
  sections: LegalSection[];
}

function getTermsContent(locale: LegalLocale): LegalDocumentContent {
  const t = (key: string) => getTranslation(locale, key);

  return {
    eyebrow: t('marketing.terms.general.eyebrow'),
    title: t('marketing.terms.general.title'),
    description: t('marketing.terms.general.description'),
    introduction: t('marketing.terms.general.introduction'),
    lastUpdatedLabel: t('marketing.terms.general.lastUpdatedLabel'),
    lastUpdated: t('marketing.terms.general.lastUpdated'),
    contentsLabel: t('marketing.terms.general.contentsLabel'),
    relatedLabel: t('marketing.terms.general.relatedLabel'),
    relatedLinks: [
      {
        label: t('marketing.terms.general.relatedPrivacy'),
        path: 'privacy',
      },
      {
        label: t('marketing.terms.general.relatedCookies'),
        path: 'cookies',
      },
    ],
    sections: [
      {
        id: 'servicio',
        title: t('marketing.terms.service.title'),
        paragraphs: [
          t('marketing.terms.service.paragraph1'),
          t('marketing.terms.service.paragraph2'),
          t('marketing.terms.service.paragraph3'),
        ],
      },
      {
        id: 'elegibilidad',
        title: t('marketing.terms.eligibility.title'),
        paragraphs: [
          t('marketing.terms.eligibility.paragraph1'),
          t('marketing.terms.eligibility.paragraph2'),
          t('marketing.terms.eligibility.paragraph3'),
        ],
      },
      {
        id: 'cuenta',
        title: t('marketing.terms.account.title'),
        items: [
          t('marketing.terms.account.item1'),
          t('marketing.terms.account.item2'),
          t('marketing.terms.account.item3'),
          t('marketing.terms.account.item4'),
        ],
      },
      {
        id: 'uso',
        title: t('marketing.terms.acceptableUse.title'),
        paragraphs: [t('marketing.terms.acceptableUse.intro')],
        items: [
          t('marketing.terms.acceptableUse.item1'),
          t('marketing.terms.acceptableUse.item2'),
          t('marketing.terms.acceptableUse.item3'),
          t('marketing.terms.acceptableUse.item4'),
          t('marketing.terms.acceptableUse.item5'),
        ],
      },
      {
        id: 'social',
        title: t('marketing.terms.social.title'),
        paragraphs: [
          t('marketing.terms.social.paragraph1'),
          t('marketing.terms.social.paragraph2'),
          t('marketing.terms.social.paragraph3'),
        ],
      },
      {
        id: 'propiedad',
        title: t('marketing.terms.intellectualProperty.title'),
        paragraphs: [
          t('marketing.terms.intellectualProperty.paragraph1'),
          t('marketing.terms.intellectualProperty.paragraph2'),
          t('marketing.terms.intellectualProperty.paragraph3'),
        ],
      },
      {
        id: 'disponibilidad',
        title: t('marketing.terms.availability.title'),
        paragraphs: [
          t('marketing.terms.availability.paragraph1'),
          t('marketing.terms.availability.paragraph2'),
          t('marketing.terms.availability.paragraph3'),
        ],
      },
      {
        id: 'suspension',
        title: t('marketing.terms.suspension.title'),
        paragraphs: [
          t('marketing.terms.suspension.paragraph1'),
          t('marketing.terms.suspension.paragraph2'),
          t('marketing.terms.suspension.paragraph3'),
          t('marketing.terms.suspension.paragraph4'),
        ],
      },
      {
        id: 'responsabilidad',
        title: t('marketing.terms.liability.title'),
        paragraphs: [
          t('marketing.terms.liability.paragraph1'),
          t('marketing.terms.liability.paragraph2'),
          t('marketing.terms.liability.paragraph3'),
          t('marketing.terms.liability.paragraph4'),
        ],
      },
      {
        id: 'ley',
        title: t('marketing.terms.law.title'),
        paragraphs: [
          t('marketing.terms.law.paragraph1'),
          t('marketing.terms.law.paragraph2'),
          t('marketing.terms.law.paragraph3'),
        ],
      },
    ],
  };
}

interface TermsPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  return localizedMetadata(lang, '/terms', {
    [locale]: {
      title: getTranslation(locale, 'marketing.terms.metadata.title'),
      description: getTranslation(locale, 'marketing.terms.metadata.description'),
    },
  });
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);
  const content = getTermsContent(locale);

  return <LegalDocument content={content} lang={locale} />;
}
