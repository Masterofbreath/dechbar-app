/**
 * ProfilPage - User Profile (Placeholder)
 * 
 * Future: Complete profile with:
 * - Personal information
 * - Avatar upload
 * - Level & achievements
 * - KP stats summary
 * - Account settings
 * 
 * Opened from TOP NAV Avatar click.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 0.1.0
 */

import { EmptyState } from '@/platform/components/EmptyState';

/**
 * ProfilPage - Placeholder for user profile
 */
export function ProfilPage() {
  return (
    <EmptyState
      icon="👤"
      title="Profil"
      message="Tvůj profil bude dostupný brzy."
      subtext="Zde upravíš své údaje, avatar a uvidíš svou úroveň (level)."
    />
  );
}
