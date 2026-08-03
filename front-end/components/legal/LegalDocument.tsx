// components/legal/LegalDocument.tsx
import Link from 'next/link';
import DashboardBackground from '@/components/layout/DashboardBackground';
import type { Locale } from '@/lib/locales';

// ============================================
// TYPES
// ============================================
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

// ============================================
// COMPONENT
// ============================================
interface LegalDocumentProps {
  content: LegalDocumentContent;
  lang: LegalLocale;
}

export default function LegalDocument({ content, lang }: LegalDocumentProps) {
  return (
    <DashboardBackground>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-10 border-b border-(--border-card) pb-8">
          <h1 className="text-3xl font-bold text-(--text-primary) sm:text-5xl">{content.title}</h1>
        </header>

        <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav
              aria-label={content.contentsLabel}
              className="rounded-2xl border border-(--border-card) bg-(--bg-card) p-5 shadow-(--shadow-card)"
            >
              <p className="mb-3 font-semibold text-(--text-primary)">{content.contentsLabel}</p>

              <ul className="space-y-2 text-sm">
                {content.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-(--text-secondary) transition-colors hover:text-(--accent-blue)"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="space-y-8">
            {content.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl border border-(--border-card) bg-(--bg-card) p-6 shadow-(--shadow-card) sm:p-8"
              >
                <h2 className="text-2xl font-semibold text-(--text-primary)">{section.title}</h2>

                {section.paragraphs?.map((paragraph, index) => (
                  <p
                    key={`${section.id}-p-${index}`}
                    className="mt-4 whitespace-pre-line leading-7 text-(--text-secondary)"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.items && (
                  <ul className="mt-4 space-y-3 pl-5 text-(--text-secondary)">
                    {section.items.map((item, index) => (
                      <li key={`${section.id}-item-${index}`} className="list-disc leading-7">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {section.table && (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr>
                          {section.table.headers.map((header, index) => (
                            <th
                              key={`${section.id}-th-${index}`}
                              className="border-b border-(--border-card) px-3 py-3 font-semibold text-(--text-primary)"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {section.table.rows.map((row, rowIndex) => (
                          <tr key={`${section.id}-row-${rowIndex}`} className="align-top">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={`${section.id}-cell-${rowIndex}-${cellIndex}`}
                                className="border-b border-(--border-card) px-3 py-3 leading-6 text-(--text-secondary)"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}

            <nav
              aria-label={content.relatedLabel}
              className="flex flex-wrap gap-3 border-t border-(--border-card) pt-6"
            >
              <span className="w-full text-sm font-semibold text-(--text-primary)">
                {content.relatedLabel}
              </span>

              {content.relatedLinks.map((link) => (
                <Link
                  key={link.path}
                  href={`/${lang}/${link.path}`}
                  className="rounded-lg border border-(--border-card) px-4 py-2 text-sm text-(--text-secondary) transition-colors hover:border-(--accent-blue-border) hover:text-(--accent-blue)"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </article>
        </div>
      </div>
    </DashboardBackground>
  );
}
