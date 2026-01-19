/**
 * useKeyboardShortcuts - Global Keyboard Navigation
 * 
 * Provides keyboard shortcuts for power users:
 * - Cmd/Ctrl + K → Open notifications
 * - Cmd/Ctrl + , → Open settings
 * - Escape → Close modals
 * - 1-4 → Navigate tabs (Dnes, Cvičit, Akademie, Pokrok)
 * 
 * @package DechBar_App
 * @subpackage Platform/Hooks
 * @since 0.2.0
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from './useNavigation';

/**
 * useKeyboardShortcuts - Global keyboard navigation
 * 
 * Automatically registers keyboard event listeners.
 * Call this hook once in your root App component.
 * 
 * @example
 * function App() {
 *   useKeyboardShortcuts();
 *   return <div>...</div>;
 * }
 */
export function useKeyboardShortcuts() {
  const { 
    openNotifications, 
    closeNotifications, 
    isNotificationsOpen,
    openSettings,
    closeSettings,
    isSettingsOpen,
    closeKPDetail,
    isKPDetailOpen
  } = useNavigation();
  
  const navigate = useNavigate();
  
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Cmd/Ctrl + K → Notifications
      if (modKey && e.key === 'k') {
        e.preventDefault();
        openNotifications();
      }
      
      // Cmd/Ctrl + , → Settings
      if (modKey && e.key === ',') {
        e.preventDefault();
        openSettings();
      }
      
      // Escape → Close any open modal
      if (e.key === 'Escape') {
        if (isNotificationsOpen) closeNotifications();
        if (isSettingsOpen) closeSettings();
        if (isKPDetailOpen) closeKPDetail();
      }
      
      // Number keys 1-4 → Navigate tabs (only if no modals open)
      if (!isNotificationsOpen && !isSettingsOpen && !isKPDetailOpen) {
        if (e.key === '1') navigate('/app');
        if (e.key === '2') navigate('/app/cvicit');
        if (e.key === '3') navigate('/app/akademie');
        if (e.key === '4') navigate('/app/pokrok');
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    openNotifications, 
    closeNotifications, 
    isNotificationsOpen,
    openSettings,
    closeSettings,
    isSettingsOpen,
    closeKPDetail,
    isKPDetailOpen,
    navigate
  ]);
}
