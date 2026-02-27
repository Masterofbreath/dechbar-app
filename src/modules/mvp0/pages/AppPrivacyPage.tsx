/**
 * AppPrivacyPage - Ochrana osobních údajů (in-app view)
 *
 * Route: /app/privacy
 * Layout: Back button + LegalPageLayout — NO landing Header/Footer.
 * Content: Shared from PrivacyContent.tsx (same as public /ochrana-osobnich-udaju).
 *
 * @package DechBar_App
 * @subpackage MVP0/Pages
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LegalPageLayout } from '@/modules/public-web/components/legal/LegalPageLayout';
import { PRIVACY_SECTIONS, PRIVACY_LAST_UPDATED } from '@/modules/public-web/components/legal/PrivacyContent';
import { useSwipeBack } from '@/platform/hooks/useSwipeBack';

export function AppPrivacyPage() {
  const navigate = useNavigate();
  const swipeRef = useSwipeBack<HTMLDivElement>();

  useEffect(() => {
    document.title = 'Ochrana osobních údajů | DechBar';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app-legal-page" ref={swipeRef}>
      <button
        className="app-legal-page__back"
        onClick={() => navigate(-1)}
        aria-label="Zpět"
      >
        ← Zpět
      </button>
      <LegalPageLayout
        title="Ochrana osobních údajů"
        lastUpdated={PRIVACY_LAST_UPDATED}
        sections={PRIVACY_SECTIONS}
      />
    </div>
  );
}
