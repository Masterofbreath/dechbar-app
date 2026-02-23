/**
 * LegalPageLayout Component
 *
 * Shared layout for all legal pages (/terms, /privacy).
 * Features: sticky TOC on desktop, readable max-width, back nav.
 *
 * Design: Token-only, dark-first, Apple premium style.
 * Per brand book: Legal texts are neutral — no "dechový vibe".
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Legal
 */

import type { ReactNode } from 'react';

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

export interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalPageLayout({ title, subtitle, lastUpdated, sections }: LegalPageLayoutProps) {
  return (
    <div className="legal-layout">
      <header className="legal-layout__header">
        <h1 className="legal-layout__title">{title}</h1>
        {subtitle && <p className="legal-layout__subtitle">{subtitle}</p>}
        <p className="legal-layout__meta">Poslední aktualizace: {lastUpdated}</p>
      </header>

      <div className="legal-layout__content">
        <nav className="legal-layout__toc" aria-label="Obsah">
          <p className="legal-layout__toc-title">Obsah</p>
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="legal-layout__toc-link">
              {section.title}
            </a>
          ))}
        </nav>

        <div className="legal-layout__sections">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="legal-layout__section">
              <h2 className="legal-layout__section-title">{section.title}</h2>
              <div className="legal-layout__section-content">{section.content}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
