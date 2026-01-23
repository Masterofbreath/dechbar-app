/**
 * HapticService - Singleton Service
 * 
 * Central haptic feedback manager for the entire app.
 * Handles vibration patterns, battery awareness, and user preferences.
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Haptic
 */

import type { HapticPattern, HapticConfig } from './types';
import { HAPTIC_PATTERNS, DEFAULT_HAPTIC_CONFIG } from './config';

const STORAGE_KEY = 'dechbar_haptic_config';

/**
 * HapticService - Singleton pattern for global haptic control
 */
class HapticService {
  private static instance: HapticService;
  private config: HapticConfig;
  private isLowBattery: boolean = false;
  
  private constructor() {
    this.config = this.loadConfig();
    this.initializeBatteryMonitoring();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): HapticService {
    if (!HapticService.instance) {
      HapticService.instance = new HapticService();
    }
    return HapticService.instance;
  }
  
  /**
   * Trigger haptic feedback
   * 
   * @param pattern - Haptic pattern to trigger
   * @param force - Force trigger even if disabled
   */
  public trigger(pattern: HapticPattern, force: boolean = false): void {
    // Check if enabled
    if (!this.config.enabled && !force) return;
    
    // Check battery level
    if (this.config.batteryAware && this.isLowBattery) return;
    
    // Check reduced motion
    if (this.config.reducedMotion) return;
    
    // Check browser support
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
    
    // Get pattern from config
    let vibrationPattern = HAPTIC_PATTERNS[pattern];
    
    // Apply intensity modifier
    if (typeof vibrationPattern === 'number') {
      vibrationPattern = this.applyIntensity(vibrationPattern);
    } else {
      vibrationPattern = vibrationPattern.map(v => this.applyIntensity(v));
    }
    
    // Trigger vibration
    try {
      navigator.vibrate(vibrationPattern);
      
      // Analytics
      if (this.config.analytics) {
        this.trackHaptic(pattern);
      }
    } catch (error) {
      // Silent fail - vibration not critical
      if (import.meta.env.DEV) {
        console.warn('[Haptic] Vibration failed:', error);
      }
    }
  }
  
  /**
   * Update configuration
   */
  public updateConfig(partial: Partial<HapticConfig>): void {
    this.config = { ...this.config, ...partial };
    this.saveConfig();
  }
  
  /**
   * Get current configuration
   */
  public getConfig(): HapticConfig {
    return { ...this.config };
  }
  
  /**
   * Apply intensity modifier to vibration value
   */
  private applyIntensity(value: number): number {
    const multiplier = {
      light: 0.7,
      medium: 1.0,
      heavy: 1.3,
    }[this.config.intensity];
    
    return Math.round(value * multiplier);
  }
  
  /**
   * Initialize battery monitoring
   */
  private async initializeBatteryMonitoring(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      // Battery API is experimental
      const nav = navigator as Navigator & { 
        getBattery?: () => Promise<{
          level: number;
          addEventListener: (type: string, listener: () => void) => void;
        }>;
      };
      
      if (nav.getBattery) {
        const battery = await nav.getBattery();
        
        // Check initial level
        this.isLowBattery = battery.level < 0.2;
        
        // Listen for changes
        battery.addEventListener('levelchange', () => {
          this.isLowBattery = battery.level < 0.2;
        });
      }
    } catch {
      // Battery API not supported - continue without it
      if (import.meta.env.DEV) {
        console.log('[Haptic] Battery API not supported');
      }
    }
  }
  
  /**
   * Track haptic event to analytics
   */
  private trackHaptic(pattern: HapticPattern): void {
    if (typeof window === 'undefined') return;
    
    // Google Analytics
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      try {
        ((window as unknown) as Window & { gtag: (...args: unknown[]) => void }).gtag('event', 'haptic_feedback', {
          pattern,
          intensity: this.config.intensity,
        });
      } catch (error) {
        // Silent fail
      }
    }
  }
  
  /**
   * Load config from localStorage
   */
  private loadConfig(): HapticConfig {
    if (typeof window === 'undefined') return DEFAULT_HAPTIC_CONFIG;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_HAPTIC_CONFIG, ...parsed };
      }
    } catch {
      // Invalid JSON - use defaults
      if (import.meta.env.DEV) {
        console.warn('[Haptic] Failed to load config');
      }
    }
    
    // Check reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    return {
      ...DEFAULT_HAPTIC_CONFIG,
      reducedMotion,
    };
  }
  
  /**
   * Save config to localStorage
   */
  private saveConfig(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      // Silent fail - not critical
      if (import.meta.env.DEV) {
        console.warn('[Haptic] Failed to save config:', error);
      }
    }
  }
}

export default HapticService;
