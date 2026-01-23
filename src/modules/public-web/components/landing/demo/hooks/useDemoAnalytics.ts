/**
 * useDemoAnalytics Hook
 * 
 * Analytics tracking for demo interactions.
 * Tracks: clicks, modal opens, conversions.
 * 
 * Integration: Google Analytics (gtag)
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { DEMO_CONFIG } from '../data/demoConfig';
import type { DemoEvent } from '../types/demo.types';

export function useDemoAnalytics() {
  const track = (event: DemoEvent) => {
    // Check feature flags
    if (!DEMO_CONFIG.analytics.trackClicks && event.action === 'exercise_click') return;
    if (!DEMO_CONFIG.analytics.trackModalOpens && event.action === 'modal_open') return;
    if (!DEMO_CONFIG.analytics.trackConversions && event.action === 'registration_complete') return;
    
    // Google Analytics (if available)
    if (typeof window !== 'undefined' && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as Window & { gtag: (...args: unknown[]) => void }).gtag('event', 'demo_interaction', {
        action: event.action,
        view: event.view,
        exercise_name: event.exercise?.name,
        exercise_id: event.exercise?.id,
        method: event.method,
        timestamp: event.timestamp,
      });
    }
    
    // Console log (development only)
    if (import.meta.env.DEV) {
      console.log('[Demo Analytics]', {
        action: event.action,
        exercise: event.exercise?.name,
        view: event.view,
        method: event.method,
      });
    }
  };
  
  return { track };
}
