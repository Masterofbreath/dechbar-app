/**
 * CvicitPage - Exercise Library (Placeholder)
 * 
 * Future: Complete exercise library with:
 * - Tab: Preset exercises
 * - Tab: Custom exercises (if Studio module owned)
 * - Tab: SMART recommendations (if SMART tier)
 * - History
 * 
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 0.1.0
 */

import { EmptyState } from '@/platform/components/EmptyState';

/**
 * CvicitPage - Placeholder for exercise library
 */
export function CvicitPage() {
  return (
    <EmptyState
      icon="🏋️"
      title="Cvičit"
      message="Knihovna cvičení bude dostupná brzy."
      subtext="Zde najdeš všechna dechová cvičení (preset i vlastní)."
    />
  );
}
