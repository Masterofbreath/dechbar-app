/**
 * useNavigation Hook - Central Navigation State
 * 
 * Zustand store for managing app-wide navigation state.
 * Controls: Active tab, modal visibility, navigation history.
 * 
 * @package DechBar_App
 * @subpackage Platform/Hooks
 * @since 0.2.0
 */

import { create } from 'zustand';

/**
 * Navigation tab IDs
 */
export type NavTab = 'dnes' | 'cvicit' | 'akademie' | 'pokrok';

/**
 * Navigation state interface
 */
interface NavigationState {
  // Current active tab
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  
  // Modal states (for TOP NAV actions)
  isProfileOpen: boolean;
  isSettingsOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  
  // FAB pressed state (for animation feedback)
  isFABPressed: boolean;
  setFABPressed: (pressed: boolean) => void;
}

/**
 * Central navigation store
 * 
 * @example
 * const { currentTab, setCurrentTab } = useNavigation();
 * setCurrentTab('dnes');
 */
export const useNavigation = create<NavigationState>((set) => ({
  // Tab state
  currentTab: 'dnes',
  setCurrentTab: (tab) => set({ currentTab: tab }),
  
  // Profile modal
  isProfileOpen: false,
  openProfile: () => set({ isProfileOpen: true }),
  closeProfile: () => set({ isProfileOpen: false }),
  
  // Settings modal
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  
  // FAB animation
  isFABPressed: false,
  setFABPressed: (pressed) => set({ isFABPressed: pressed }),
}));
