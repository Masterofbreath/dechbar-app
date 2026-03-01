/**
 * usePlayerBroadcast — Cross-window StickyPlayer synchronizace
 *
 * Synchronizuje stav přehrávače mezi záložkami (tabs) ve stejném browseru.
 * Využívá nativní BroadcastChannel API (bez serveru, žádná latence).
 *
 * Co se synchronizuje:
 *   - currentTrack  (titulek, audio URL, cover)
 *   - isPlaying     (přehrává / pozastaveno)
 *   - mode          (sticky / fullscreen / null)
 *
 * Co se NESYNCHRONIZUJE (záměrně):
 *   - currentTime   — audio element je jen v jedné záložce, čas by byl nesmyslný
 *   - listenedSegments — tracking je lokální pro aktuální přehrávání
 *
 * Cross-device sync (telefon ↔ desktop): vyžaduje Supabase Realtime.
 * Tato verze pokrývá záložky ve stejném browseru (nejčastější use-case).
 *
 * @package DechBar_App
 * @subpackage Platform/Components/AudioPlayer
 */

import { useEffect, useRef } from 'react';
import { useAudioPlayerStore } from './store';
import type { Track } from './types';

const CHANNEL_NAME = 'dechbar:player-sync';
const BROADCAST_DEBOUNCE_MS = 800; // neposílat každý tick (jen meaningful changes)

type PlayerBroadcastPayload = {
  type: 'state-update';
  source: string;  // tab ID pro dedupl (nechceme přijímat vlastní zprávy)
  track: Track | null;
  isPlaying: boolean;
  mode: 'sticky' | 'fullscreen' | null;
  ts: number;
};

// Unikátní ID záložky — přežívá re-rendery, ne page reload
const TAB_ID = `tab-${Math.random().toString(36).slice(2)}`;

export function usePlayerBroadcast() {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const receivingRef = useRef(false); // přijímáme zprávu — neposílat zpět (loop guard)

  const track = useAudioPlayerStore((s) => s.currentTrack);
  const isPlaying = useAudioPlayerStore((s) => s.isPlaying);
  const mode = useAudioPlayerStore((s) => s.mode);

  // Přijímač: naslouchá na zprávy z ostatních záložek
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;

    ch.onmessage = (event: MessageEvent<PlayerBroadcastPayload>) => {
      const msg = event.data;
      if (msg.type !== 'state-update' || msg.source === TAB_ID) return;

      receivingRef.current = true;
      useAudioPlayerStore.setState(
        {
          currentTrack: msg.track,
          isPlaying: false, // V přijímající záložce nepřehráváme — jen zobrazíme stav
          mode: msg.mode,
        },
        false,
      );
      // Krátkým timeoutem povolíme opět odesílání (setState triggery useEffect)
      setTimeout(() => { receivingRef.current = false; }, 50);
    };

    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, []);

  // Odesílač: broadcastuje změny stavu ostatním záložkám (debounced)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    if (receivingRef.current) return; // nepřeposílat příchozí zprávy

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const ch = channelRef.current;
      if (!ch) return;

      ch.postMessage({
        type: 'state-update',
        source: TAB_ID,
        track,
        isPlaying,
        mode,
        ts: Date.now(),
      } satisfies PlayerBroadcastPayload);
    }, BROADCAST_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [track, isPlaying, mode]);
}
