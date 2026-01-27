/**
 * DemoTopNav - Simplified Top Navigation for Demo
 * 
 * Replicates real TopNav structure but simplified for demo:
 * - Avatar (fake user: Jakub_rozdycha_cesko)
 * - KP Display (39 seconds)
 * - Bell + Settings (disabled, visual only)
 * 
 * Design: Balanced Minimal (Brand Book 2.0), transparent, teal accents
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { NavIcon } from '@/platform/components';
import { useToast } from '@/platform/components/Toast';
import { DEMO_USER } from '../data/demoUser';

export interface DemoTopNavProps {
  onSettingsClick: (event?: React.MouseEvent) => void;
  onKPClick: (event?: React.MouseEvent) => void;
}

/* 
  ============================================================
  TODO: KP Measurement Feature (Phase 2)
  ============================================================
  
  When KPMeasurement component is ready in main app:
  (/app/components/KPMeasurement)
  
  IMPLEMENTATION PLAN:
  --------------------
  1. Import shared component:
     import { KPMeasurement } from '@/app/components/KPMeasurement';
  
  2. Add state for modal:
     const [showKPModal, setShowKPModal] = useState(false);
  
  3. On KP click → open measurement overlay:
     <KPDisplay 
       kpValue={kpValue} 
       onClick={() => setShowKPModal(true)}
     />
  
  4. Render measurement modal:
     {showKPModal && (
       <KPMeasurement 
         onClose={() => setShowKPModal(false)}
         onComplete={(result) => {
           // Show conversion modal
           openConversionModal({
             headline: `Tvoje KP: ${result} sekund`,
             subtitle: 'Chceš si měření uložit a sledovat pokrok?',
             cta: 'Uložit a registrovat se'
           });
         }}
       />
     )}
  
  5. Analytics tracking:
     - track('kp_measurement_started')
     - track('kp_measurement_completed', { value: result })
     - track('kp_measurement_conversion') // if user registers
  
  MARKETING USE CASES:
  --------------------
  - Seminars/workshops: "Změřte si KP na dechbar.cz"
  - Standalone utility: Works without registration (value-first)
  - Conversion trigger: User invests time → wants to save → registers
  - Viral potential: "Podívej, můžeš si změřit KP online!"
  
  CONVERSION PSYCHOLOGY:
  ----------------------
  - Endowment effect: User has "their result" → feels ownership
  - Loss aversion: "Don't want to lose my measurement" → registers
  - Commitment: Invested time (measured) → higher commitment
  
  DEPENDENCIES:
  -------------
  - KPMeasurement component (motor + UI) from main app
  - Shared CSS for timer design consistency
  - Conversion modal variant for post-measurement
  
  ESTIMATED EFFORT:
  -----------------
  1-2 hours (pure integration, no new component creation)
  
  ============================================================
*/

/**
 * DemoTopNav - Top navigation for demo mockup
 * 
 * @example
 * <DemoTopNav onSettingsClick={handleSettingsOpen} onKPClick={handleKPOpen} />
 */
export function DemoTopNav({ onSettingsClick, onKPClick }: DemoTopNavProps) {
  const { show } = useToast();
  
  // Fake user data
  const avatarInitial = DEMO_USER.name.charAt(0).toUpperCase();
  const kpValue = DEMO_USER.bolt_score; // Will be renamed to kpScore later
  
  return (
    <nav className="demo-top-nav" role="banner">
      {/* Left: Avatar + KP */}
      <div className="demo-top-nav__left">
        <button
          className="demo-top-nav__avatar-button"
          onClick={() => show('Profil dostupný po registraci', { icon: '🔒' })}
          type="button"
          aria-label="Profil (dostupný po registraci)"
        >
          <div className="demo-top-nav__avatar demo-top-nav__avatar--placeholder">
            {avatarInitial}
          </div>
        </button>
        
        <button
          className="kp-display kp-display--good"
          onTouchStart={(e) => {
            // iOS Safari Fix: Prevent Safari from preparing scroll on touch
            e.preventDefault();
          }}
          onTouchEnd={(e) => {
            // iOS Safari Fix: Prevent default BEFORE Safari scrolls (mobile)
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.blur(); // currentTarget = always button (not nested span)
            onKPClick(e as any);
          }}
          onClick={(e) => {
            // Desktop fallback
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.blur();
            onKPClick(e);
          }}
          type="button"
          aria-label="Změřit kontrolní pauzu"
        >
          <span className="kp-display__label">KP</span>
          <span className="kp-display__value">{kpValue}s</span>
        </button>
      </div>
      
      {/* Right: Bell + Settings (disabled) */}
      <div className="demo-top-nav__right">
        <button
          className="demo-top-nav__bell-button"
          onClick={() => show('Notifikace dostupné po registraci', { icon: '🔒' })}
          type="button"
          aria-label="Notifikace (dostupné po registraci)"
        >
          <NavIcon name="bell" size={24} />
        </button>
        
        <button
          className="demo-top-nav__settings-button"
          onTouchStart={(e) => {
            // iOS Safari Fix: Prevent Safari from preparing scroll on touch
            e.preventDefault();
          }}
          onTouchEnd={(e) => {
            // iOS Safari Fix: Prevent default BEFORE Safari scrolls (mobile)
            e.preventDefault();
            e.stopPropagation();
            (e.target as HTMLElement).blur();
            onSettingsClick(e as any);
          }}
          onClick={(e) => {
            // Desktop fallback
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.blur();
            onSettingsClick(e);
          }}
          type="button"
          aria-label="Nastavení"
        >
          <NavIcon name="settings" size={24} />
        </button>
      </div>
    </nav>
  );
}
