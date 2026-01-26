/**
 * BottomNav Component - Main App Navigation
 * 
 * 4-tab navigation with dynamic FAB styling:
 * - Dnes (Home)
 * - Cvičit (Exercise)
 * - Akademie (Education)
 * - Pokrok (Progress)
 * 
 * Active tab receives gold FAB treatment (elevated, larger icon, gold circle).
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Navigation
 * @since 0.2.0
 */

import { NavIcon } from '../NavIcon';
import { useNavigation, type NavTab } from '@/platform/hooks';

/**
 * Navigation item configuration
 */
interface NavItem {
  id: NavTab;
  icon: 'home' | 'dumbbell' | 'graduation-cap' | 'chart-line';
  label: string;
}

/**
 * Navigation items (4 tabs)
 */
const NAV_ITEMS: NavItem[] = [
  { id: 'dnes', icon: 'home', label: 'Dnes' },
  { id: 'cvicit', icon: 'dumbbell', label: 'Cvičit' },
  { id: 'akademie', icon: 'graduation-cap', label: 'Akademie' },
  { id: 'pokrok', icon: 'chart-line', label: 'Pokrok' },
];

/**
 * BottomNav - Fixed bottom navigation bar
 * 
 * Active tab receives FAB styling (gold circle, elevation, larger icon).
 * 
 * @example
 * <BottomNav />
 */
export function BottomNav() {
  const { currentTab, setCurrentTab } = useNavigation();
  
  function handleTabClick(tabId: NavTab) {
    setCurrentTab(tabId);
  }
  
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Hlavní navigace">
      {NAV_ITEMS.map((item) => {
        const isActive = currentTab === item.id;
        
        const tabClass = [
          'bottom-nav__tab',
          isActive && 'bottom-nav__tab--active',
        ].filter(Boolean).join(' ');
        
        return (
          <button
            key={item.id}
            className={tabClass}
            onClick={() => handleTabClick(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            type="button"
          >
            <div className="bottom-nav__icon-wrapper">
              <NavIcon name={item.icon} size={isActive ? 28 : 24} />
            </div>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
