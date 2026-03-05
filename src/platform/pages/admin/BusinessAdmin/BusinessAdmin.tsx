/**
 * BusinessAdmin — Business metriky
 *
 * Obsahuje:
 *   FunnelSection  — Onboarding funnel + Retence D7/D30/D90/D180
 *   ChurnSection   — Protokoly + Churn risk
 *   ComingSoonSection — Placeholder budoucích metrik
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/BusinessAdmin
 */

import { FunnelSection } from './sections/FunnelSection';
import { ChurnSection } from './sections/ChurnSection';
import { ComingSoonSection } from './sections/ComingSoonSection';
import './BusinessAdmin.css';

export default function BusinessAdmin() {
  return (
    <div className="business-admin">

      <div className="business-admin__header">
        <div>
          <h1 className="business-admin__title">Business</h1>
          <div className="business-admin__subtitle">
            Konverzní metriky, retence, churn — kdo přichází, zůstává a odchází
          </div>
        </div>
      </div>

      {/* Onboarding funnel + Retence */}
      <FunnelSection />

      {/* Protokoly + Churn risk */}
      <ChurnSection />

      {/* Budoucí metriky */}
      <ComingSoonSection />

    </div>
  );
}
