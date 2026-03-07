/**
 * VoicePacksManager
 *
 * Placeholder — full implementation in future phase.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/ExercisesAdmin
 * @since 2.48.0
 */

export function VoicePacksManager() {
  return (
    <div className="exercises-manager">
      <div className="exercises-manager__section">
        <h2 className="exercises-manager__section-title">Hlasové průvodce</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Správa voice packů a vocal snippetů pro Vocal Guidance System bude dostupná v příští verzi.
        </p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Databázové tabulky <code>voice_packs</code> a <code>vocal_snippets</code> jsou připraveny.
        </p>
      </div>
    </div>
  );
}
