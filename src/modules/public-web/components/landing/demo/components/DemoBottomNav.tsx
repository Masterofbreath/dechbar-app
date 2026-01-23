/**
 * DemoBottomNav - Demo Bottom Navigation
 * 
 * 4-tab navigation with FAB (Floating Action Button) - MATCHES REAL APP:
 * - Dnes (Home)
 * - Cvičit (FAB - gold, elevated) ⚠️ CRITICAL: FAB position, not regular tab
 * - Akademie (Disabled)
 * - Pokrok (Disabled)
 * 
 * Design: Dark-first, TEAL active state (not gold!), FAB gold accent
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { NavIcon } from '@/platform/components';
import type { DemoView } from '../types/demo.types';

export interface DemoBottomNavProps {
  activeView: DemoView;
  onViewChange: (view: DemoView) => void;
}

/**
 * DemoBottomNav - Navigation between demo views
 * 
 * @example
 * <DemoBottomNav activeView="dnes" onViewChange={handleChange} />
 */
export function DemoBottomNav({ activeView, onViewChange }: DemoBottomNavProps) {
  return (
    <nav className="demo-bottom-nav" role="navigation" aria-label="Demo navigace">
      {/* Tab 1: Dnes (Home) */}
      <button
        className={`demo-bottom-nav__tab ${activeView === 'dnes' ? 'demo-bottom-nav__tab--active' : ''}`}
        onClick={() => onViewChange('dnes')}
        type="button"
        aria-label="Dnes"
        aria-current={activeView === 'dnes' ? 'page' : undefined}
      >
        <div className="demo-bottom-nav__icon">
          <NavIcon name="home" size={24} />
        </div>
        <span className="demo-bottom-nav__label">Dnes</span>
      </button>
      
      {/* Tab 2: Cvičit (FAB - elevated gold button) */}
      <button
        className={`demo-bottom-nav__tab demo-bottom-nav__tab--fab ${activeView === 'cvicit' ? 'demo-bottom-nav__tab--active' : ''}`}
        onClick={() => onViewChange('cvicit')}
        type="button"
        aria-label="Cvičit"
        aria-current={activeView === 'cvicit' ? 'page' : undefined}
      >
        <div className="demo-bottom-nav__fab-icon">
          <NavIcon name="dumbbell" size={28} />
        </div>
        <span className="demo-bottom-nav__label">Cvičit</span>
      </button>
      
      {/* Tab 3: Akademie (Disabled) */}
      <div 
        className="demo-bottom-nav__tab demo-bottom-nav__tab--disabled" 
        title="Akademie dostupná po registraci"
        role="button"
        aria-disabled="true"
      >
        <div className="demo-bottom-nav__icon">
          <NavIcon name="graduation-cap" size={24} />
        </div>
        <span className="demo-bottom-nav__label">Akademie</span>
      </div>
      
      {/* Tab 4: Pokrok (Disabled) */}
      <div 
        className="demo-bottom-nav__tab demo-bottom-nav__tab--disabled" 
        title="Pokrok dostupný po registraci"
        role="button"
        aria-disabled="true"
      >
        <div className="demo-bottom-nav__icon">
          <NavIcon name="chart-line" size={24} />
        </div>
        <span className="demo-bottom-nav__label">Pokrok</span>
      </div>
    </nav>
  );
}
