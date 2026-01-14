/**
 * HeroMockup Component
 * 
 * SVG placeholder mockup for hero section
 * Phone frame with gradient placeholder until real screenshot available
 * Includes subtle floating animation (respects prefers-reduced-motion)
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

export function HeroMockup() {
  return (
    <div className="hero-mockup">
      <div className="hero-mockup__phone">
        <svg viewBox="0 0 300 600" className="hero-mockup__frame" role="img" aria-label="DechBar aplikace mockup">
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
          
          {/* Placeholder screen content - Breathing visualization */}
          {/* Large breathing circle (teal) */}
          <circle 
            cx="150" 
            cy="200" 
            r="60" 
            fill="var(--color-primary)" 
            opacity="0.15"
          >
            <animate
              attributeName="r"
              values="60;70;60"
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
          
          {/* Inner circle */}
          <circle 
            cx="150" 
            cy="200" 
            r="40" 
            stroke="var(--color-primary)" 
            stroke-width="2" 
            fill="none"
            opacity="0.4"
          />
          
          {/* Placeholder UI elements */}
          {/* Top bar */}
          <rect 
            x="40" 
            y="60" 
            width="80" 
            height="16" 
            rx="8" 
            fill="var(--color-text-tertiary)" 
            opacity="0.2"
          />
          <rect 
            x="220" 
            y="60" 
            width="40" 
            height="16" 
            rx="8" 
            fill="var(--color-text-tertiary)" 
            opacity="0.2"
          />
          
          {/* Program title placeholder */}
          <rect 
            x="80" 
            y="300" 
            width="140" 
            height="20" 
            rx="10" 
            fill="var(--color-text-tertiary)" 
            opacity="0.3"
          />
          
          {/* Subtitle placeholder */}
          <rect 
            x="60" 
            y="340" 
            width="180" 
            height="16" 
            rx="8" 
            fill="var(--color-text-tertiary)" 
            opacity="0.2"
          />
          
          {/* Button placeholder (gold) */}
          <rect 
            x="75" 
            y="480" 
            width="150" 
            height="48" 
            rx="12" 
            fill="var(--color-accent)" 
            opacity="0.6"
          />
          
          {/* Status bar (top of phone) */}
          <rect 
            x="80" 
            y="30" 
            width="60" 
            height="4" 
            rx="2" 
            fill="var(--color-text-tertiary)" 
            opacity="0.4"
          />
          <rect 
            x="230" 
            y="30" 
            width="30" 
            height="4" 
            rx="2" 
            fill="var(--color-text-tertiary)" 
            opacity="0.4"
          />
        </svg>
      </div>
    </div>
  );
}
