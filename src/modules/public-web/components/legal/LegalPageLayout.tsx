/**
 * LegalPageLayout Component
 *
 * Shared layout for all legal pages (/terms, /privacy).
 * Features: sticky TOC on desktop with active section highlighting.
 *
 * Design: Token-only, dark-first, Apple premium style.
 * Per brand book: Legal texts are neutral — no "dechový vibe".
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Legal
 */

import { useState, useEffect, useRef } from 'react';
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
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0 && visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // Trigger when section enters top 40% of viewport, below sticky header
        rootMargin: '-80px 0px -55% 0px',
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sections]);

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
            <a
              key={section.id}
              href={`#${section.id}`}
              className={[
                'legal-layout__toc-link',
                activeId === section.id ? 'legal-layout__toc-link--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
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
