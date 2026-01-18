/**
 * BottomNav Component - Main App Navigation
 * 
 * 4-tab navigation with FAB (Floating Action Button):
 * - Dnes (Home)
 * - Cvičit (FAB - gold, elevated)
 * - Akademie (Education)
 * - Pokrok (Progress)
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
  isFAB?: boolean;
}

/**
 * Navigation items (4 tabs)
 */
const NAV_ITEMS: NavItem[] = [
  { id: 'dnes', icon: 'home', label: 'Dnes' },
  { id: 'cvicit', icon: 'dumbbell', label: 'Cvičit', isFAB: true },
  { id: 'akademie', icon: 'graduation-cap', label: 'Akademie' },
  { id: 'pokrok', icon: 'chart-line', label: 'Pokrok' },
];

/**
 * BottomNav - Fixed bottom navigation bar
 * 
 * @example
 * <BottomNav />
 */
export function BottomNav() {
  const { currentTab, setCurrentTab, isFABPressed, setFABPressed } = useNavigation();
  
  function handleTabClick(tabId: NavTab, isFAB: boolean) {
    setCurrentTab(tabId);
    
    // FAB press animation
    if (isFAB) {
      setFABPressed(true);
      setTimeout(() => setFABPressed(false), 200);
    }
  }
  
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Hlavní navigace">
      {NAV_ITEMS.map((item) => {
        const isActive = currentTab === item.id;
        
        const tabClass = [
          'bottom-nav__tab',
          item.isFAB && 'bottom-nav__tab--fab',
          isActive && 'bottom-nav__tab--active',
          item.isFAB && isFABPressed && 'bottom-nav__tab--pressed',
        ].filter(Boolean).join(' ');
        
        return (
          <button
            key={item.id}
            className={tabClass}
            onClick={() => handleTabClick(item.id, item.isFAB || false)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            type="button"
          >
            {item.isFAB ? (
              <div className="bottom-nav__fab-icon">
                <NavIcon name={item.icon} size={28} />
              </div>
            ) : (
              <div className="bottom-nav__icon">
                <NavIcon name={item.icon} size={24} />
              </div>
            )}
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
