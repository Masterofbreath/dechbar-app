/**
 * PrivacyPage - Ochrana osobních údajů
 *
 * Route: /ochrana-osobnich-udaju
 * Design: Neutral, stabilní, přesný. Bez "dechového vibe" per brand guidelines.
 * Struktura: Header (landing) + LegalPageLayout + Footer (landing)
 *
 * Content is shared with AppPrivacyPage (/app/privacy) via PrivacyContent.tsx.
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Pages
 */

import { useEffect } from 'react';
import { Header } from '../components/landing/Header';
import { Footer } from '../components/landing/Footer';
import { LegalPageLayout } from '../components/legal/LegalPageLayout';
import { PRIVACY_SECTIONS, PRIVACY_LAST_UPDATED } from '../components/legal/PrivacyContent';

export function PrivacyPage() {
  useEffect(() => {
    document.title = 'Ochrana osobních údajů | DechBar';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <Header />
      <LegalPageLayout
        title="Ochrana osobních údajů"
        lastUpdated={PRIVACY_LAST_UPDATED}
        sections={PRIVACY_SECTIONS}
      />
      <Footer />
    </div>
  );
}
