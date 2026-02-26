/**
 * TermsPage - Obchodní podmínky
 *
 * Route: /obchodni-podminky
 * Design: Neutral, stabilní, přesný. Bez "dechového vibe" per brand guidelines.
 * Struktura: Header (landing) + LegalPageLayout + Footer (landing)
 *
 * Content is shared with AppTermsPage (/app/terms) via TermsContent.tsx.
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Pages
 */

import { useEffect } from 'react';
import { Header } from '../components/landing/Header';
import { Footer } from '../components/landing/Footer';
import { LegalPageLayout } from '../components/legal/LegalPageLayout';
import { TERMS_SECTIONS, TERMS_LAST_UPDATED } from '../components/legal/TermsContent';

export function TermsPage() {
  useEffect(() => {
    document.title = 'Obchodní podmínky | DechBar';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <Header />
      <LegalPageLayout
        title="Obchodní podmínky"
        lastUpdated={TERMS_LAST_UPDATED}
        sections={TERMS_SECTIONS}
      />
      <Footer />
    </div>
  );
}
