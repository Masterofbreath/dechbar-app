/**
 * AudioPlayerAdmin Page
 * 
 * Main admin page for managing audio tracks and albums.
 * Tab-based navigation for Tracks and Albums management.
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin
 * @since 2.47.0
 */

import { useState } from 'react';
import { TracksManager } from './components/TracksManager';
import { AlbumsManager } from './components/AlbumsManager';
import './AudioPlayerAdmin.css';

export default function AudioPlayerAdmin() {
  const [activeTab, setActiveTab] = useState<'tracks' | 'albums'>('tracks');

  return (
    <div className="audio-player-admin">
      <div className="audio-player-admin__header">
        <div>
          <h1 className="audio-player-admin__title">Media Management</h1>
          <p className="audio-player-admin__subtitle">
            Správa audio tracků a albumů
          </p>
        </div>
        
        <div className="audio-player-admin__tabs">
          <button
            className={`audio-player-admin__tab ${activeTab === 'tracks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracks')}
          >
            Tracks
          </button>
          <button
            className={`audio-player-admin__tab ${activeTab === 'albums' ? 'active' : ''}`}
            onClick={() => setActiveTab('albums')}
          >
            Albums
          </button>
        </div>
      </div>

      <div className="audio-player-admin__content">
        {activeTab === 'tracks' && <TracksManager />}
        {activeTab === 'albums' && <AlbumsManager />}
      </div>
    </div>
  );
}
