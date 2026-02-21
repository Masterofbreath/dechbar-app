/**
 * AkademiePage — vstupní bod sekce Akademie.
 *
 * Renderuje AkademieRoot z modulu akademie.
 * Navigace uvnitř sekce je řízena useAkademieNav (Zustand drill-down store).
 *
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 1.0.0 — Akademie modul (Program REŽIM)
 */

import { AkademieRoot } from '@/modules/akademie/components/AkademieRoot';

export function AkademiePage() {
  return <AkademieRoot />;
}
