/**
 * DemoSettingsDrawer - Settings Preview Drawer for Demo
 * 
 * Premium slide-in settings panel with swipe-to-close gesture.
 * All menu items are locked (show toast on click).
 * 
 * Design: Matches real SettingsDrawer 1:1 (visual preview only)
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { useState, useEffect } from 'react';
import { NavIcon } from '@/platform/components';
import { CloseButton } from '@/components/shared';
import { useToast } from '@/platform/components/Toast';

export interface DemoSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DemoSettingsDrawer - Settings preview with locked menu items
 * 
 * @example
 * <DemoSettingsDrawer isOpen={isOpen} onClose={handleClose} />
 */
export function DemoSettingsDrawer({ isOpen, onClose }: DemoSettingsDrawerProps) {
  const { show } = useToast();
  const [isClosing, setIsClosing] = useState(false);
  
  // Swipe-to-close gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Minimum swipe distance (50px = reasonable threshold)
  const MIN_SWIPE_DISTANCE = 50;
  
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
      setIsDragging(false);
      handleClose();
      
      // Reset dragOffset AFTER animation completes
      setTimeout(() => {
        setDragOffset(0);
      }, 350);
    } else {
      // Not enough swipe → snap back smoothly
      setIsDragging(false);
      setDragOffset(0);
    }
    
    // Reset touch tracking
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen && !isClosing) return null;
  
  const handleClose = () => {
    setIsClosing(true);
    
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Match animation duration
  };
  
  const handleMenuClick = (itemName: string) => {
    show(`${itemName} dostupný po registraci`, { icon: '🔒' });
  };
  
  return (
    <>
      {/* Overlay */}
      <div 
        className={`demo-settings-overlay ${isClosing ? 'demo-settings-overlay--closing' : ''}`}
        onClick={handleClose}
      />
      
      {/* Drawer */}
      <div 
        className={`demo-settings-drawer ${isClosing ? 'demo-settings-drawer--closing' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          // Visual feedback during drag + smooth exit animation
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
        {/* Header */}
        <div className="demo-settings__header">
          <h2>Nastavení</h2>
          <CloseButton 
            onClick={handleClose}
            ariaLabel="Zavřít nastavení"
          />
        </div>
        
        {/* Menu */}
        <nav className="demo-settings__menu">
          <button 
            className="demo-settings__menu-item" 
            onClick={() => handleMenuClick('Profil')}
            type="button"
          >
            <NavIcon name="user" size={20} />
            <span>Profil</span>
          </button>
          
          <button 
            className="demo-settings__menu-item"
            onClick={() => handleMenuClick('Účet')}
            type="button"
          >
            <NavIcon name="credit-card" size={20} />
            <span>Účet</span>
          </button>
          
          <button 
            className="demo-settings__menu-item"
            onClick={() => handleMenuClick('Základní nastavení')}
            type="button"
          >
            <NavIcon name="settings" size={20} />
            <span>Základní nastavení</span>
          </button>
          
          <button 
            className="demo-settings__menu-item"
            onClick={() => handleMenuClick('O aplikaci')}
            type="button"
          >
            <NavIcon name="info" size={20} />
            <span>O aplikaci</span>
          </button>
          
          {/* Gold divider */}
          <div className="demo-settings__divider" />
          
          <button 
            className="demo-settings__menu-item demo-settings__menu-item--danger"
            onClick={() => handleMenuClick('Odhlásit se')}
            type="button"
          >
            <NavIcon name="logout" size={20} />
            <span>Odhlásit se</span>
          </button>
        </nav>
      </div>
    </>
  );
}
