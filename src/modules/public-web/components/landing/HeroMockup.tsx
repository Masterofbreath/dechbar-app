/**
 * HeroMockup Component
 * 
 * Interactive phone mockup with real DechBar app demo inside.
 * Features:
 * - Lazy loading (Intersection Observer)
 * - Code splitting (React.lazy)
 * - Responsive scaling (mobile to desktop)
 * - Real app components (auto-sync with MVp0)
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { lazy, Suspense } from 'react';
import { useIntersectionLoad } from './demo/hooks/useIntersectionLoad';

// Lazy load demo for performance (code splitting)
const DemoApp = lazy(() => import('./demo').then(m => ({ default: m.DemoApp })));

/**
 * Loading skeleton (before lazy load completes)
 */
function DemoLoadingSkeleton() {
  return (
    <div className="demo-loading-skeleton">
      <div className="skeleton-pulse" style={{ width: '80%', height: '20px', marginBottom: '16px' }} />
      <div className="skeleton-pulse" style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '40px auto' }} />
      <div className="skeleton-pulse" style={{ width: '60%', height: '16px' }} />
    </div>
  );
}

/**
 * Placeholder (before intersection triggers lazy load)
 */
function DemoPlaceholder() {
  return (
    <div className="demo-placeholder">
      {/* Breathing circle animation */}
      <svg viewBox="0 0 100 100" className="demo-placeholder__breathing">
        <circle 
          cx="50" 
          cy="50" 
          r="30" 
          fill="var(--color-primary)" 
          opacity="0.15"
        >
          <animate
            attributeName="r"
            values="30;35;30"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.15;0.25;0.15"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

/**
 * HeroMockup - Interactive demo in phone frame
 */
export function HeroMockup() {
  const { ref, isVisible } = useIntersectionLoad(0.1);
  
  return (
    <div className="hero-mockup" ref={ref}>
      <div className="hero-mockup__phone">
        <svg 
          viewBox="0 0 300 600" 
          className="hero-mockup__frame" 
          role="img" 
          aria-label="DechBar aplikace - interaktivní demo"
        >
          {/* Phone frame (dark surface) */}
          <rect 
            x="10" 
            y="10" 
            width="280" 
            height="580" 
            rx="40" 
            fill="var(--color-surface)"
          />
          
          {/* Screen area (dark background) */}
          <rect 
            x="20" 
            y="20" 
            width="260" 
            height="560" 
            rx="30" 
            fill="var(--color-background)"
          />
          
          {/* Demo app inside foreignObject */}
          <foreignObject 
            x="20" 
            y="20" 
            width="260" 
            height="560"
          >
            <div className="demo-app-container">
              {isVisible ? (
                <Suspense fallback={<DemoLoadingSkeleton />}>
                  <DemoApp />
                </Suspense>
              ) : (
                <DemoPlaceholder />
              )}
            </div>
          </foreignObject>
        </svg>
      </div>
    </div>
  );
}
