/**
 * TrustSignals Component
 * 
 * Displays certification, community size, and track count
 * Uses dynamic data from usePublicStats hook with fallback
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { usePublicStats } from '@/platform';

export function TrustSignals() {
  const { data: stats, isLoading } = usePublicStats();

  // Skeleton loader
  if (isLoading) {
    return (
      <div className="trust-signals">
        <div className="trust-signal skeleton" style={{ width: '200px', height: '24px' }} />
        <div className="trust-signal skeleton" style={{ width: '180px', height: '24px' }} />
        <div className="trust-signal skeleton" style={{ width: '220px', height: '24px' }} />
      </div>
    );
  }

  return (
    <div className="trust-signals">
      {/* Certification */}
      {stats?.certification_valid && (
        <div className="trust-signal">
          <svg 
            className="trust-signal__icon" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <path 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              stroke="var(--color-primary)"
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="trust-signal__text">Certifikováno odborníky</span>
        </div>
      )}

      {/* Community members */}
      <div className="trust-signal">
        <svg 
          className="trust-signal__icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            stroke="var(--color-primary)"
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span className="trust-signal__text">
          {stats?.community_members.toLocaleString('cs-CZ')}+ členů
        </span>
      </div>

      {/* Audio tracks */}
      <div className="trust-signal">
        <svg 
          className="trust-signal__icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            stroke="var(--color-primary)"
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span className="trust-signal__text">
          {stats?.total_audio_tracks}+ dechových tréninků
        </span>
      </div>
    </div>
  );
}
