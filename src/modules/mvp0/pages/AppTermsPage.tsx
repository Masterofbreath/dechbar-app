/**
 * AppTermsPage - Obchodní podmínky (in-app view)
 *
 * Route: /app/terms
 * Layout: Back button + LegalPageLayout — NO landing Header/Footer.
 * Content: Shared from TermsContent.tsx (same as public /obchodni-podminky).
 *
 * @package DechBar_App
 * @subpackage MVP0/Pages
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LegalPageLayout } from '@/modules/public-web/components/legal/LegalPageLayout';
import { TERMS_SECTIONS, TERMS_LAST_UPDATED } from '@/modules/public-web/components/legal/TermsContent';

export function AppTermsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Obchodní podmínky | DechBar';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app-legal-page">
      <button
        className="app-legal-page__back"
        onClick={() => navigate(-1)}
        aria-label="Zpět"
      >
        ← Zpět
      </button>
      <LegalPageLayout
        title="Obchodní podmínky"
        lastUpdated={TERMS_LAST_UPDATED}
        sections={TERMS_SECTIONS}
      />
    </div>
  );
}
