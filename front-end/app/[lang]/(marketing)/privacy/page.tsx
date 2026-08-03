// app/[lang]/marketing/privacy/page.tsx

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

function getPrivacyContent(locale: LegalLocale): LegalDocumentContent {
  const t = (key: string) => getTranslation(locale, key);

  return {
    eyebrow: t('marketing.privacy.general.eyebrow'),
    title: t('marketing.privacy.general.title'),
    description: t('marketing.privacy.general.description'),
    introduction: t('marketing.privacy.general.introduction'),
    lastUpdatedLabel: t('marketing.privacy.general.lastUpdatedLabel'),
    lastUpdated: t('marketing.privacy.general.lastUpdated'),
    contentsLabel: t('marketing.privacy.general.contentsLabel'),
    relatedLabel: t('marketing.privacy.general.relatedLabel'),
    relatedLinks: [
      {
        label: t('marketing.privacy.general.relatedTerms'),
        path: 'terms',
      },
      {
        label: t('marketing.privacy.general.relatedCookies'),
        path: 'cookies',
      },
    ],
    sections: [
      {
        id: 'datos',
        title: t('marketing.privacy.data.title'),
        paragraphs: [t('marketing.privacy.data.sensitiveNote')],
        items: [
          t('marketing.privacy.data.item1'),
          t('marketing.privacy.data.item2'),
          t('marketing.privacy.data.item3'),
          t('marketing.privacy.data.item4'),
          t('marketing.privacy.data.item5'),
          t('marketing.privacy.data.item6'),
          t('marketing.privacy.data.item7'),
        ],
      },
      {
        id: 'finalidades',
        title: t('marketing.privacy.purposes.title'),
        items: [
          t('marketing.privacy.purposes.item1'),
          t('marketing.privacy.purposes.item2'),
          t('marketing.privacy.purposes.item3'),
          t('marketing.privacy.purposes.item4'),
          t('marketing.privacy.purposes.item5'),
          t('marketing.privacy.purposes.item6'),
          t('marketing.privacy.purposes.item7'),
          t('marketing.privacy.purposes.item8'),
          t('marketing.privacy.purposes.item9'),
          t('marketing.privacy.purposes.item10'),
          t('marketing.privacy.purposes.item11'),
        ],
      },
      {
        id: 'bases',
        title: t('marketing.privacy.legalBasis.title'),
        paragraphs: [
          t('marketing.privacy.legalBasis.paragraph1'),
          t('marketing.privacy.legalBasis.paragraph2'),
          t('marketing.privacy.legalBasis.paragraph3'),
          t('marketing.privacy.legalBasis.paragraph4'),
        ],
      },
      {
        id: 'destinatarios',
        title: t('marketing.privacy.recipients.title'),
        paragraphs: [
          t('marketing.privacy.recipients.paragraph1'),
          t('marketing.privacy.recipients.paragraph2'),
          t('marketing.privacy.recipients.paragraph3'),
          t('marketing.privacy.recipients.paragraph4'),
          t('marketing.privacy.recipients.paragraph5'),
          t('marketing.privacy.recipients.paragraph6'),
        ],
      },
      {
        id: 'transferencias',
        title: t('marketing.privacy.transfers.title'),
        paragraphs: [
          t('marketing.privacy.transfers.paragraph1'),
          t('marketing.privacy.transfers.paragraph2'),
          t('marketing.privacy.transfers.paragraph3'),
          t('marketing.privacy.transfers.paragraph4'),
        ],
      },
      {
        id: 'conservacion',
        title: t('marketing.privacy.retention.title'),
        items: [
          t('marketing.privacy.retention.item1'),
          t('marketing.privacy.retention.item2'),
          t('marketing.privacy.retention.item3'),
          t('marketing.privacy.retention.item4'),
          t('marketing.privacy.retention.item5'),
        ],
      },
      {
        id: 'derechos',
        title: t('marketing.privacy.rights.title'),
        paragraphs: [
          t('marketing.privacy.rights.paragraph1'),
          t('marketing.privacy.rights.paragraph2'),
          t('marketing.privacy.rights.paragraph3'),
          t('marketing.privacy.rights.paragraph4'),
        ],
      },
      {
        id: 'menores',
        title: t('marketing.privacy.children.title'),
        paragraphs: [
          t('marketing.privacy.children.paragraph1'),
          t('marketing.privacy.children.paragraph2'),
          t('marketing.privacy.children.paragraph3'),
        ],
      },
      {
        id: 'seguridad',
        title: t('marketing.privacy.security.title'),
        paragraphs: [
          t('marketing.privacy.security.paragraph1'),
          t('marketing.privacy.security.paragraph2'),
          t('marketing.privacy.security.paragraph3'),
        ],
      },
      {
        id: 'cambios',
        title: t('marketing.privacy.changes.title'),
        paragraphs: [
          t('marketing.privacy.changes.paragraph1'),
          t('marketing.privacy.changes.paragraph2'),
          t('marketing.privacy.changes.paragraph3'),
          t('marketing.privacy.changes.paragraph4'),
        ],
      },
      {
        id: 'responsable',
        title: t('marketing.privacy.responsible.title'),
        paragraphs: [t('marketing.privacy.responsible.paragraph3')],
      },
    ],
  };
}

interface PrivacyPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);

  return localizedMetadata(lang, '/privacy', {
    [locale]: {
      title: getTranslation(locale, 'marketing.privacy.metadata.title'),
      description: getTranslation(locale, 'marketing.privacy.metadata.description'),
    },
  });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { lang } = await params;
  const locale = toSupportedLocale(lang);
  const content = getPrivacyContent(locale);

  return <LegalDocument content={content} lang={locale} />;
}
