/**
 * Environment Detection Utilities
 * 
 * Detects:
 * - Platform: Web vs. iOS vs. Android
 * - Device: Desktop vs. Tablet vs. Mobile
 * 
 * @package DechBar_App
 * @subpackage Platform/Utils
 * @since 0.2.0
 */

import { Capacitor } from '@capacitor/core';

// ============================================
// PLATFORM DETECTION (Web vs. Native)
// ============================================

/**
 * Check if running in native app (iOS/Android)
 * 
 * @returns true if iOS or Android native app
 * @example
 * if (isNativeApp()) {
 *   // Native-specific logic
 * }
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running in web browser
 * 
 * @returns true if web browser (desktop or mobile)
 * @example
 * if (isWebApp()) {
 *   window.location.href = '/';
 * }
 */
export const isWebApp = (): boolean => {
  return !isNativeApp();
};

/**
 * Check if running on iOS (native app only)
 * 
 * @returns true if iOS native app
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running on Android (native app only)
 * 
 * @returns true if Android native app
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

// ============================================
// DEVICE TYPE DETECTION (Screen Size)
// ============================================

/**
 * Breakpoints (matching Design Standards)
 * @see FOUNDATION/04_DESIGN_STANDARDS.md
 */
const BREAKPOINTS = {
  mobile: 768,    // < 768px = mobile
  tablet: 1024,   // 768-1023px = tablet
  desktop: 1024,  // >= 1024px = desktop
} as const;

/**
 * Check if device is mobile (screen < 768px)
 * 
 * @returns true if viewport width < 768px
 * @example
 * if (isMobile()) {
 *   // Show mobile UI
 * }
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.mobile;
};

/**
 * Check if device is tablet (screen 768-1023px)
 * 
 * @returns true if viewport width 768-1023px
 */
export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth >= BREAKPOINTS.mobile &&
    window.innerWidth < BREAKPOINTS.desktop
  );
};

/**
 * Check if device is desktop (screen >= 1024px)
 * 
 * @returns true if viewport width >= 1024px
 */
export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.desktop;
};

// ============================================
// COMPOSITE GETTERS
// ============================================

/**
 * Get complete environment info
 * 
 * @returns Environment object with all detection results
 * @example
 * const env = getEnvironmentInfo();
 * console.log(env.platform); // 'web' | 'ios' | 'android'
 * console.log(env.deviceType); // 'mobile' | 'tablet' | 'desktop'
 */
export const getEnvironmentInfo = () => {
  const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'
  const isNative = isNativeApp();
  
  let deviceType: 'mobile' | 'tablet' | 'desktop';
  if (isMobile()) {
    deviceType = 'mobile';
  } else if (isTablet()) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }
  
  return {
    // Platform
    platform,
    isNative,
    isWeb: !isNative,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    
    // Device Type
    deviceType,
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
  };
};

// ============================================
// DEBUG HELPERS
// ============================================

/**
 * Log environment info to console (dev only)
 * 
 * @example
 * useEffect(() => {
 *   logEnvironment();
 * }, []);
 */
export const logEnvironment = () => {
  const env = getEnvironmentInfo();
  console.group('🌍 Environment Detection');
  console.log('Platform:', env.platform);
  console.log('Is Native App:', env.isNative);
  console.log('Device Type:', env.deviceType);
  console.log('Screen Width:', window.innerWidth + 'px');
  console.groupEnd();
};
