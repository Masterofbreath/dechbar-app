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
import type { Exercise } from '../../modules/mvp0/types/exercise';

/**
 * Navigation tab IDs
 */
export type NavTab = 'dnes' | 'cvicit' | 'akademie' | 'pokrok';

/**
 * Exercise Creator mode
 */
export type ExerciseCreatorMode = 'create' | 'edit' | 'duplicate';

/**
 * Exercise Creator options (for edit/duplicate mode)
 */
export interface ExerciseCreatorOptions {
  mode: ExerciseCreatorMode;
  exerciseId?: string; // For edit/duplicate mode
  sourceExercise?: Exercise; // For duplicate mode (Exercise object)
}

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
  
  // Exercise Creator Modal (NEW)
  isExerciseCreatorOpen: boolean;
  exerciseCreatorOptions: ExerciseCreatorOptions | null;
  openExerciseCreator: (options?: ExerciseCreatorOptions) => void;
  closeExerciseCreator: () => void;
  
  // Delete Confirmation Dialog (NEW)
  isDeleteConfirmOpen: boolean;
  deleteConfirmData: { exerciseId: string; exerciseName: string; onConfirm: () => void } | null;
  openDeleteConfirm: (data: { exerciseId: string; exerciseName: string; onConfirm: () => void }) => void;
  closeDeleteConfirm: () => void;
  
  // Notification state
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  
  // Global modal actions (NEW - close all modals)
  closeAllModals: () => void;
}

/**
 * Central navigation store
 * 
 * @example
 * const { currentTab, setCurrentTab } = useNavigation();
 * setCurrentTab('dnes');
 * 
 * @example
 * const { openExerciseCreator } = useNavigation();
 * openExerciseCreator(); // Create mode
 * openExerciseCreator({ mode: 'edit', exerciseId: '123' }); // Edit mode
 */
export const useNavigation = create<NavigationState>((set) => ({
  // Tab state
  currentTab: 'dnes',
  setCurrentTab: (tab) => set({ currentTab: tab }),
  
  // Profile modal
  isProfileOpen: false,
  openProfile: () => set({ 
    isProfileOpen: true,
    // Close other modals for focus
    isExerciseCreatorOpen: false,
  }),
  closeProfile: () => set({ isProfileOpen: false }),
  
  // Settings modal
  isSettingsOpen: false,
  openSettings: () => set({ 
    isSettingsOpen: true,
    // Close other modals for focus
    isExerciseCreatorOpen: false,
  }),
  closeSettings: () => set({ isSettingsOpen: false }),
  
  // KP Detail modal/view
  isKPDetailOpen: false,
  openKPDetail: () => set({ 
    isKPDetailOpen: true,
    // Close other modals for focus
    isExerciseCreatorOpen: false,
  }),
  closeKPDetail: () => set({ isKPDetailOpen: false }),
  
  // Notifications center
  isNotificationsOpen: false,
  openNotifications: () => set({ 
    isNotificationsOpen: true,
    // Don't close other modals - notifications are overlay
  }),
  closeNotifications: () => set({ isNotificationsOpen: false }),
  
  // Exercise Creator Modal (NEW)
  isExerciseCreatorOpen: false,
  exerciseCreatorOptions: null,
  openExerciseCreator: (options) => set({ 
    isExerciseCreatorOpen: true,
    exerciseCreatorOptions: options || { mode: 'create' },
    // Close other modals for focus
    isProfileOpen: false,
    isKPDetailOpen: false,
  }),
  closeExerciseCreator: () => set({ 
    isExerciseCreatorOpen: false,
    exerciseCreatorOptions: null,
  }),
  
  // Delete Confirmation Dialog (NEW)
  isDeleteConfirmOpen: false,
  deleteConfirmData: null,
  openDeleteConfirm: (data) => set({
    isDeleteConfirmOpen: true,
    deleteConfirmData: data,
  }),
  closeDeleteConfirm: () => set({
    isDeleteConfirmOpen: false,
    deleteConfirmData: null,
  }),
  
  // Notification state
  unreadNotifications: 0,
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  
  // Close all modals (NEW - for emergency situations)
  closeAllModals: () => set({
    isProfileOpen: false,
    isSettingsOpen: false,
    isKPDetailOpen: false,
    isNotificationsOpen: false,
    isExerciseCreatorOpen: false,
    exerciseCreatorOptions: null,
    isDeleteConfirmOpen: false,
    deleteConfirmData: null,
  }),
}));
