/**
 * SettingsDrawer - Premium Slide-in Settings Panel
 * 
 * Right-to-left slide animation with clean premium styling.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.3.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '@/platform/hooks';
import { useAuth, useIsAdmin } from '@/platform/auth';
import { CloseButton } from '@/components/shared';
import { NavIcon } from './NavIcon';

export function SettingsDrawer() {
  const { isSettingsOpen, closeSettings, openProfile } = useNavigation();
  const { signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  
  // Swipe-to-close gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Minimum swipe distance (50px = reasonable threshold)
  const MIN_SWIPE_DISTANCE = 50;
  
  // Add settings-open class for hover state management
  // NOTE: Do NOT use immersive-mode for Settings drawer
  // Settings is an overlay, not a fullscreen focused activity
  // TOP NAV and BOTTOM NAV should remain visible (like desktop)
  useEffect(() => {
    if (isSettingsOpen) {
      document.body.classList.add('settings-open');
    }
    return () => {
      document.body.classList.remove('settings-open');
    };
  }, [isSettingsOpen]);
  
  // Touch event handlers for swipe-to-close gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    
    // Only allow swipe RIGHT (left → right = close)
    if (diff > 0) {
      setDragOffset(diff);
      setTouchEnd(currentTouch);
    }
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchEnd - touchStart;
    const isRightSwipe = distance > MIN_SWIPE_DISTANCE;
    
    if (isRightSwipe) {
      // User swiped right → close drawer
      // IMPORTANT: Keep dragOffset for smooth animation exit
      // Don't reset it immediately - let it animate out from current position
      setIsDragging(false); // Stop drag tracking
      
      // Start closing animation
      handleClose();
      
      // Reset dragOffset AFTER animation completes
      setTimeout(() => {
        setDragOffset(0);
      }, 350); // 300ms animation + 50ms buffer
    } else {
      // Not enough swipe → snap back smoothly
      setIsDragging(false);
      setDragOffset(0);
    }
    
    // Reset touch tracking
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  if (!isSettingsOpen && !isClosing) return null;
  
  const handleClose = () => {
    setIsClosing(true);
    
    // Force blur all focused elements (removes sticky :hover on touch devices)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Force click on body to clear hover states (Safari iOS fix)
    document.body.click();
    
    // Add 'settings-closing' class to disable TopNav interactions
    // This prevents accidental hover on .top-nav__right pill
    // when CloseButton disappears during animation
    document.body.classList.add('settings-closing');
    
    setTimeout(() => {
      closeSettings();
      setIsClosing(false);
      
      // Remove 'settings-closing' after animation completes + buffer
      setTimeout(() => {
        document.body.classList.remove('settings-closing');
      }, 50);
    }, 300); // Match animation duration
  };
  
  const handleSignOut = async () => {
    await signOut();
    handleClose();
  };
  
  const handleProfileClick = () => {
    handleClose();
    openProfile();
  };
  
  const handleAdminClick = () => {
    handleClose();
    navigate('/app/admin');
  };
  
  const handleSettingsClick = () => {
    handleClose();
    navigate('/app/settings');
  };
  
  return (
    <>
      <div 
        className={`settings-drawer-overlay ${isClosing ? 'settings-drawer-overlay--closing' : ''}`}
        onClick={handleClose}
      />
      <div 
        className={`settings-drawer ${isClosing ? 'settings-drawer--closing' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          // Visual feedback during drag + smooth exit animation
          // Keep transform active during both dragging AND closing
          transform: (isDragging || isClosing) && dragOffset > 0 
            ? `translateX(${dragOffset}px)` 
            : undefined,
          // Transition: none during drag, smooth during snap-back or closing
          transition: isDragging 
            ? 'none' // No transition while actively dragging
            : isClosing
              ? 'transform 0.25s cubic-bezier(0.4, 0, 1, 1), opacity 0.25s ease' // Fast exit
              : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Snap back if swipe < 50px
          // Fade out during closing
          opacity: isClosing ? 0 : 1,
        }}
      >
        <div className="settings-drawer__header">
          <h2>Nastavení</h2>
          <CloseButton 
            onClick={handleClose}
            ariaLabel="Zavřít nastavení"
          />
        </div>
        
        <nav className="settings-drawer__menu">
          <button className="settings-menu-item" onClick={handleProfileClick}>
            <NavIcon name="user" size={20} />
            <span>Profil</span>
          </button>
          
          <button className="settings-menu-item">
            <NavIcon name="credit-card" size={20} />
            <span>Účet</span>
          </button>
          
          <button className="settings-menu-item" onClick={handleSettingsClick}>
            <NavIcon name="settings" size={20} />
            <span>Základní nastavení</span>
          </button>
          
          {isAdmin && (
            <button className="settings-menu-item settings-menu-item--admin" onClick={handleAdminClick}>
              <NavIcon name="shield" size={20} />
              <span>Administrace</span>
            </button>
          )}
          
          <button className="settings-menu-item">
            <NavIcon name="info" size={20} />
            <span>O aplikaci</span>
          </button>
          
          <div className="settings-menu-divider" />
          
          <button className="settings-menu-item settings-menu-item--danger" onClick={handleSignOut}>
            <NavIcon name="logout" size={20} />
            <span>Odhlásit se</span>
          </button>
        </nav>
      </div>
    </>
  );
}
