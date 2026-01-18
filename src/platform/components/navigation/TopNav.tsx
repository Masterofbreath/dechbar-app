/**
 * TopNav Component - Minimalist Top Navigation
 * 
 * Brand Book 2.0: Balanced Minimal (Avatar + Settings)
 * - Transparent background
 * - iOS safe area support
 * - Touch-friendly (44x44px targets)
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Navigation
 * @since 0.2.0
 */

import { NavIcon } from '../NavIcon';
import { useNavigation } from '@/platform/hooks';
import { useAuth } from '@/platform/auth';

export interface TopNavProps {
  /**
   * Transparent background (for special screens like landing)
   * @default false
   */
  transparent?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TopNav - Minimalist top navigation bar
 * 
 * @example
 * <TopNav />
 * <TopNav transparent />
 */
export function TopNav({ transparent = false, className = '' }: TopNavProps) {
  const { user } = useAuth();
  const { openProfile, openSettings } = useNavigation();
  
  const navClass = [
    'top-nav',
    transparent && 'top-nav--transparent',
    className
  ].filter(Boolean).join(' ');
  
  // Avatar display logic
  const avatarUrl = user?.avatar_url;
  const userName = user?.full_name || user?.email || '';
  const avatarInitial = userName.charAt(0).toUpperCase() || '?';
  
  return (
    <nav className={navClass} role="banner">
      {/* Left: Avatar */}
      <button
        className="top-nav__avatar-button"
        onClick={openProfile}
        aria-label="Otevřít profil"
        type="button"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName}
            className="top-nav__avatar"
          />
        ) : (
          <div className="top-nav__avatar top-nav__avatar--placeholder">
            {avatarInitial}
          </div>
        )}
      </button>
      
      {/* Right: Settings */}
      <button
        className="top-nav__settings-button"
        onClick={openSettings}
        aria-label="Nastavení"
        type="button"
      >
        <NavIcon name="settings" size={24} />
      </button>
    </nav>
  );
}
