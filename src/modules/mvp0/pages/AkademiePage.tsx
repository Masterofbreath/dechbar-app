/**
 * AkademiePage - Education & Modules (Placeholder)
 * 
 * Future: Complete academy with:
 * - Free science articles
 * - DechBar STUDIO (locked - 990 Kč)
 * - Výzvy (locked - 490 Kč)
 * - Courses & educational content
 * 
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 0.1.0
 */

import { EmptyState } from '@/platform/components/EmptyState';

/**
 * AkademiePage - Placeholder for education content
 */
export function AkademiePage() {
  return (
    <EmptyState
      icon="🎓"
      title="Akademie"
      message="Vzdělávací obsah bude dostupný brzy."
      subtext="Zde najdeš vědecké články, kurzy a prémiové moduly (Studio, Výzvy)."
    />
  );
}
