/**
 * Platform Hooks - Barrel Export
 * 
 * Global reusable hooks for DechBar App platform.
 * 
 * @package DechBar_App
 * @subpackage Platform/Hooks
 */

export { useScrollLock } from './useScrollLock';
export { useNavigation } from './useNavigation';
export type { NavTab } from './useNavigation';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useFocusTrap } from './useFocusTrap';
export { useSwipeToDismiss } from './useSwipeToDismiss';
export type { UseSwipeToDismissOptions } from './useSwipeToDismiss';
export { useChallenge } from './useChallenge';