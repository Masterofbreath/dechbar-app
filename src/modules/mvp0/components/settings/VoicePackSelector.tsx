/**
 * VoicePackSelector - Voice Pack Selector for Vocal Guidance
 *
 * Lists available voice packs from DB with tier-gating.
 * Locked packs show an upcell badge instead of being selectable.
 *
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/platform/api/supabase';
import type { VoicePack } from '../../types/audio';

const TIER_LEVEL: Record<string, number> = {
  ZDARMA: 0,
  SMART: 1,
  AI_COACH: 2,
};

function canAccess(required: string, userTier: string): boolean {
  return (TIER_LEVEL[userTier] ?? 0) >= (TIER_LEVEL[required] ?? 0);
}

const TIER_UPCELL: Record<string, string> = {
  SMART: 'Dostupné v SMART',
  AI_COACH: 'Dostupné v AI Coach',
};

const LANG_FLAG: Record<string, string> = {
  cs: '🇨🇿',
  en: '🇬🇧',
  de: '🇩🇪',
};

export interface VoicePackSelectorProps {
  selectedId: string | null;
  onChange: (id: string | null) => void;
  userTier: 'ZDARMA' | 'SMART' | 'AI_COACH';
}

export function VoicePackSelector({ selectedId, onChange, userTier }: VoicePackSelectorProps) {
  const [packs, setPacks] = useState<VoicePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('voice_packs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setPacks((data as VoicePack[]) ?? []);
        setIsLoading(false);
      });
  }, []);

  const handlePreview = (pack: VoicePack) => {
    if (!pack.preview_url) return;

    if (playingId === pack.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(pack.preview_url);
    audioRef.current = audio;
    audio.play().catch(() => null);
    setPlayingId(pack.id);
    audio.addEventListener('ended', () => setPlayingId(null), { once: true });
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  if (isLoading) {
    return (
      <p className="settings-card__info">Načítám hlasové průvodce...</p>
    );
  }

  if (packs.length === 0) {
    return (
      <p className="settings-card__info">
        Žádné hlasové průvodce zatím nejsou k dispozici.
      </p>
    );
  }

  return (
    <div className="voice-pack-selector">
      {/* "None" option */}
      <label className={`voice-pack-selector__item ${selectedId === null ? 'voice-pack-selector__item--selected' : ''}`}>
        <input
          type="radio"
          name="voice-pack"
          checked={selectedId === null}
          onChange={() => onChange(null)}
          className="voice-pack-selector__radio"
        />
        <span className="voice-pack-selector__name">Bez hlasového průvodce</span>
      </label>

      {packs.map(pack => {
        const accessible = canAccess(pack.required_tier, userTier);
        return (
          <div
            key={pack.id}
            className={`voice-pack-selector__item ${!accessible ? 'voice-pack-selector__item--locked' : ''} ${selectedId === pack.id ? 'voice-pack-selector__item--selected' : ''}`}
          >
            {accessible ? (
              <input
                type="radio"
                name="voice-pack"
                checked={selectedId === pack.id}
                onChange={() => onChange(pack.id)}
                className="voice-pack-selector__radio"
              />
            ) : (
              <span className="voice-pack-selector__lock-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
            )}

            <div className="voice-pack-selector__info">
              <span className="voice-pack-selector__name">
                {LANG_FLAG[pack.language] ?? '🌐'} {pack.name}
              </span>
              {pack.author && (
                <span className="voice-pack-selector__author">{pack.author}</span>
              )}
              {!accessible && (
                <span className="voice-pack-selector__upcell">
                  {TIER_UPCELL[pack.required_tier] ?? pack.required_tier}
                </span>
              )}
            </div>

            {pack.preview_url && accessible && (
              <button
                className="voice-pack-selector__preview"
                onClick={() => handlePreview(pack)}
                type="button"
                title="Přehrát ukázku"
                aria-label={`Přehrát ukázku ${pack.name}`}
              >
                {playingId === pack.id ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
