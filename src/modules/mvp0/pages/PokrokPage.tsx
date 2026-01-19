/**
 * PokrokPage - Progress & Stats (Placeholder)
 * 
 * Future: Complete progress dashboard with:
 * - KP graphs and trends
 * - Level & badges system
 * - Streaks and achievements
 * - Leaderboard (opt-in, SMART tier)
 * - Comprehensive statistics
 * 
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 0.1.0
 */

import { EmptyState } from '@/platform/components/EmptyState';

/**
 * PokrokPage - Placeholder for progress tracking
 */
export function PokrokPage() {
  return (
    <EmptyState
      icon="📊"
      title="Pokrok"
      message="Tvoje statistiky budou dostupné brzy."
      subtext="Zde uvidíš své KP trendy, level, badges a pokrok v čase."
    />
  );
}
