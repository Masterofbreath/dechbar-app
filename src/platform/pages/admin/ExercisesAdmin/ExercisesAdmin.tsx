/**
 * ExercisesAdmin Page
 *
 * Admin section for managing breathing exercises audio assets:
 * - Background Music (background_tracks table)
 * - Breathing Cues (breathing_cues table)
 * - Voice Packs (voice_packs table — future)
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin
 * @since 2.48.0
 */

import { useState } from 'react';
import { BackgroundMusicManager } from './components/BackgroundMusicManager';
import { BreathingCuesManager } from './components/BreathingCuesManager';
import { VoicePacksManager } from './components/VoicePacksManager';
import './ExercisesAdmin.css';

type ActiveTab = 'background' | 'cues' | 'voices';

export default function ExercisesAdmin() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('background');

  return (
    <div className="exercises-admin">
      <div className="exercises-admin__header">
        <div>
          <h1 className="exercises-admin__title">Cvičení &amp; Protokoly</h1>
          <p className="exercises-admin__subtitle">
            Správa audio assetů pro dechová cvičení
          </p>
        </div>

        <div className="exercises-admin__tabs">
          <button
            className={`exercises-admin__tab ${activeTab === 'background' ? 'exercises-admin__tab--active' : ''}`}
            onClick={() => setActiveTab('background')}
          >
            Hudba na pozadí
          </button>
          <button
            className={`exercises-admin__tab ${activeTab === 'cues' ? 'exercises-admin__tab--active' : ''}`}
            onClick={() => setActiveTab('cues')}
          >
            Dechové cues
          </button>
          <button
            className={`exercises-admin__tab ${activeTab === 'voices' ? 'exercises-admin__tab--active' : ''}`}
            onClick={() => setActiveTab('voices')}
          >
            Hlasové průvodce
          </button>
        </div>
      </div>

      <div className="exercises-admin__content">
        {activeTab === 'background' && <BackgroundMusicManager />}
        {activeTab === 'cues' && <BreathingCuesManager />}
        {activeTab === 'voices' && <VoicePacksManager />}
      </div>
    </div>
  );
}
