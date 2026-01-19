/**
 * SettingsDrawer - Premium Slide-in Settings Panel
 * 
 * Right-to-left slide animation with clean premium styling.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.3.0
 */

import { useState } from 'react';
import { useNavigation } from '@/platform/hooks';
import { useAuth } from '@/platform/auth';
import { CloseButton } from '@/components/shared';
import { NavIcon } from './NavIcon';

export function SettingsDrawer() {
  const { isSettingsOpen, closeSettings, openProfile } = useNavigation();
  const { signOut } = useAuth();
  const [isClosing, setIsClosing] = useState(false);
  
  if (!isSettingsOpen && !isClosing) return null;
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeSettings();
      setIsClosing(false);
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
  
  return (
    <>
      <div 
        className={`settings-drawer-overlay ${isClosing ? 'settings-drawer-overlay--closing' : ''}`}
        onClick={handleClose}
      />
      <div className={`settings-drawer ${isClosing ? 'settings-drawer--closing' : ''}`}>
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
          
          <button className="settings-menu-item">
            <NavIcon name="settings" size={20} />
            <span>Základní nastavení</span>
          </button>
          
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
