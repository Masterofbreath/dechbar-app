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
  isKPDetailOpen: boolean;
  isNotificationsOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openKPDetail: () => void;
  closeKPDetail: () => void;
  openNotifications: () => void;
  closeNotifications: () => void;
  
  // Notification state
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  
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
  
  // KP Detail modal/view
  isKPDetailOpen: false,
  openKPDetail: () => set({ isKPDetailOpen: true }),
  closeKPDetail: () => set({ isKPDetailOpen: false }),
  
  // Notifications center
  isNotificationsOpen: false,
  openNotifications: () => set({ isNotificationsOpen: true }),
  closeNotifications: () => set({ isNotificationsOpen: false }),
  
  // Notification state
  unreadNotifications: 0,
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  
  // FAB animation
  isFABPressed: false,
  setFABPressed: (pressed) => set({ isFABPressed: pressed }),
}));
