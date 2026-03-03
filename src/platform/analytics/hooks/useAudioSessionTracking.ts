/**
 * useAudioSessionTracking — Audio Session Analytics Hook
 *
 * Manages full analytics lifecycle for a StickyPlayer session:
 *   1. play_started event on mount / track change
 *   2. paused / resumed events on isPlaying changes
 *   3. position_snapshot every 15s during playback
 *   4. Periodic upsert of audio_sessions every 15s
 *   5. completed event when 80% threshold hit (isCompleted)
 *   6. closed event + final upsert when logClose() called
 *   7. Streak update on completion
 *
 * Exposes:
 *   logSeek(from, to, position, listenPercent) — call from StickyPlayer handleSeekEnd
 *   logClose(position, listenPercent)           — call from StickyPlayer handleClose
 *
 * Design: Fire-and-forget — never blocks UI.
 *
 * @package DechBar_App
 * @subpackage Platform/Analytics
 */

import { useEffect, useRef, useCallback } from 'react';
import { upsertAudioSession, logAudioEvent, updateStreakOnActivity } from '../client';
import type { AudioSessionContext, Platform } from '../types';

function detectPlatform(): Platform {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Capacitor } = require('@capacitor/core');
    const p = Capacitor.getPlatform() as string;
    if (p === 'ios' || p === 'android') return p;
  } catch {
    // web
  }
  return 'web';
}

export interface UseAudioSessionTrackingProps {
  trackId: string;
  sessionContext: AudioSessionContext | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isCompleted: boolean;
  calculateTotalListened: () => number;
  pauseCount: number;
  userId?: string;
}

export interface UseAudioSessionTrackingReturn {
  logSeek: (fromSeconds: number, toSeconds: number, position: number, listenPercent: number) => void;
  logClose: (position: number, listenPercent: number) => void;
}

export function useAudioSessionTracking({
  trackId,
  sessionContext,
  isPlaying,
  currentTime,
  duration,
  isCompleted,
  calculateTotalListened,
  pauseCount,
  userId,
}: UseAudioSessionTrackingProps): UseAudioSessionTrackingReturn {
  const sessionIdRef = useRef<string>('');
  const startedAtRef = useRef<string>('');
  const sessionStartedRef = useRef(false);
  const completedLoggedRef = useRef(false);
  const seekCountRef = useRef(0);
  const closedRef = useRef(false);
  const prevTrackIdRef = useRef('');

  // Keep mutable refs for frequently changing values so the interval
  // doesn't need them in its dependency array (avoids interval reset every second).
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const isPlayingRef = useRef(isPlaying);
  const isCompletedRef = useRef(isCompleted);
  const pauseCountRef = useRef(pauseCount);
  const calculateTotalListenedRef = useRef(calculateTotalListened);
  const sessionContextRef = useRef(sessionContext);
  const userIdRef = useRef(userId);

  useEffect(() => { currentTimeRef.current = currentTime; });
  useEffect(() => { durationRef.current = duration; });
  useEffect(() => { isPlayingRef.current = isPlaying; });
  useEffect(() => { isCompletedRef.current = isCompleted; });
  useEffect(() => { pauseCountRef.current = pauseCount; });
  useEffect(() => { calculateTotalListenedRef.current = calculateTotalListened; });
  useEffect(() => { sessionContextRef.current = sessionContext; });
  useEffect(() => { userIdRef.current = userId; });

  // Generate a new session when trackId changes
  useEffect(() => {
    if (!trackId || trackId === prevTrackIdRef.current) return;
    prevTrackIdRef.current = trackId;

    sessionIdRef.current = crypto.randomUUID();
    startedAtRef.current = new Date().toISOString();
    sessionStartedRef.current = false;
    completedLoggedRef.current = false;
    seekCountRef.current = 0;
    closedRef.current = false;
  }, [trackId]);

  // Kick off session on mount / when context is ready
  useEffect(() => {
    if (!userId || !sessionContext || !trackId || sessionStartedRef.current) return;
    sessionStartedRef.current = true;

    const platform = detectPlatform();

    upsertAudioSession({
      session_id: sessionIdRef.current,
      user_id: userId,
      lesson_id: sessionContext.lessonId,
      lesson_title: sessionContext.lessonTitle,
      series_id: sessionContext.seriesId,
      program_id: sessionContext.programId,
      program_title: sessionContext.programTitle,
      category_slug: sessionContext.categorySlug,
      category_title: sessionContext.categoryTitle,
      started_at: startedAtRef.current,
      audio_duration_seconds: sessionContext.audioDurationSeconds
        ? Math.round(sessionContext.audioDurationSeconds)
        : undefined,
      unique_listen_seconds: 0,
      completion_percent: 0,
      is_completed: false,
      seek_count: 0,
      pause_count: 0,
      platform,
    });

    logAudioEvent({
      session_id: sessionIdRef.current,
      user_id: userId,
      lesson_id: sessionContext.lessonId,
      event_type: 'play_started',
      position_seconds: 0,
      listen_percent: 0,
    });
  }, [userId, sessionContext, trackId]);

  // Track paused / resumed events — only isPlaying matters here
  const prevIsPlayingRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!userId || !sessionContext || !sessionStartedRef.current) return;
    if (prevIsPlayingRef.current === null) {
      prevIsPlayingRef.current = isPlaying;
      return;
    }
    if (prevIsPlayingRef.current === isPlaying) return;

    const eventType = isPlaying ? 'resumed' : 'paused';
    const totalListened = calculateTotalListened();
    const listenPercent = duration > 0
      ? Math.min(100, (totalListened / duration) * 100)
      : 0;

    logAudioEvent({
      session_id: sessionIdRef.current,
      user_id: userId,
      lesson_id: sessionContext.lessonId,
      event_type: eventType,
      position_seconds: currentTime,
      listen_percent: Math.round(listenPercent * 100) / 100,
    });

    prevIsPlayingRef.current = isPlaying;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // 15s periodic snapshot + upsert
  // CRITICAL: only stable refs in deps — avoids resetting the timer every second
  useEffect(() => {
    if (!userId || !sessionContext) return;

    const interval = setInterval(() => {
      if (!isPlayingRef.current || !sessionStartedRef.current) return;

      const ctx = sessionContextRef.current;
      const uid = userIdRef.current;
      if (!ctx || !uid) return;

      const totalListened = calculateTotalListenedRef.current();
      const dur = durationRef.current;
      const listenPercent = dur > 0
        ? Math.min(100, (totalListened / dur) * 100)
        : 0;
      const roundedPercent = Math.round(listenPercent * 100) / 100;

      logAudioEvent({
        session_id: sessionIdRef.current,
        user_id: uid,
        lesson_id: ctx.lessonId,
        event_type: 'position_snapshot',
        position_seconds: currentTimeRef.current,
        listen_percent: roundedPercent,
      });

      upsertAudioSession({
        session_id: sessionIdRef.current,
        user_id: uid,
        lesson_id: ctx.lessonId,
        lesson_title: ctx.lessonTitle,
        series_id: ctx.seriesId,
        program_id: ctx.programId,
        program_title: ctx.programTitle,
        category_slug: ctx.categorySlug,
        category_title: ctx.categoryTitle,
        started_at: startedAtRef.current,
        audio_duration_seconds: ctx.audioDurationSeconds
          ? Math.round(ctx.audioDurationSeconds)
          : undefined,
        unique_listen_seconds: Math.round(totalListened),
        completion_percent: roundedPercent,
        is_completed: isCompletedRef.current,
        seek_count: seekCountRef.current,
        pause_count: pauseCountRef.current,
      });
    }, 15_000);

    return () => clearInterval(interval);
   
  }, [userId, sessionContext]); // Stable deps only — refs handle the rest

  // Log completion once when 80% threshold hit
  useEffect(() => {
    if (!isCompleted || completedLoggedRef.current) return;
    if (!userId || !sessionContext || !sessionStartedRef.current) return;

    completedLoggedRef.current = true;

    const totalListened = calculateTotalListened();
    // Guard: pokud audio duration ještě není načteno (0), použij ref nebo sessionContext jako fallback.
    // Toto zamezuje zápisu unique_listen_seconds = 0 při race condition (isCompleted true před načtením duration).
    const effectiveDuration = durationRef.current > 0
      ? durationRef.current
      : (sessionContext.audioDurationSeconds ?? duration);
    // Pokud tracker vrátí 0 (audio se nestihlo spustit), použij currentTime jako dolní odhad.
    const effectiveListened = totalListened > 0 ? totalListened : currentTimeRef.current;
    const listenPercent = effectiveDuration > 0
      ? Math.min(100, (effectiveListened / effectiveDuration) * 100)
      : 0;

    logAudioEvent({
      session_id: sessionIdRef.current,
      user_id: userId,
      lesson_id: sessionContext.lessonId,
      event_type: 'completed',
      position_seconds: currentTime,
      listen_percent: Math.round(listenPercent * 100) / 100,
    });

    upsertAudioSession({
      session_id: sessionIdRef.current,
      user_id: userId,
      lesson_id: sessionContext.lessonId,
      lesson_title: sessionContext.lessonTitle,
      series_id: sessionContext.seriesId,
      program_id: sessionContext.programId,
      program_title: sessionContext.programTitle,
      category_slug: sessionContext.categorySlug,
      category_title: sessionContext.categoryTitle,
      started_at: startedAtRef.current,
      audio_duration_seconds: sessionContext.audioDurationSeconds
        ? Math.round(sessionContext.audioDurationSeconds)
        : undefined,
      unique_listen_seconds: Math.round(effectiveListened),
      completion_percent: Math.round(listenPercent * 100) / 100,
      is_completed: true,
      seek_count: seekCountRef.current,
      pause_count: pauseCount,
    });

    updateStreakOnActivity(userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted]);

  const logSeek = useCallback((
    fromSeconds: number,
    toSeconds: number,
    position: number,
    listenPercent: number,
  ) => {
    const uid = userIdRef.current;
    const ctx = sessionContextRef.current;
    if (!uid || !ctx) return;
    seekCountRef.current += 1;

    logAudioEvent({
      session_id: sessionIdRef.current,
      user_id: uid,
      lesson_id: ctx.lessonId,
      event_type: 'seeked',
      position_seconds: position,
      listen_percent: listenPercent,
      seek_from_seconds: fromSeconds,
      seek_to_seconds: toSeconds,
    });
  }, []);

  const logClose = useCallback((position: number, listenPercent: number) => {
    const uid = userIdRef.current;
    const ctx = sessionContextRef.current;
    if (!uid || !ctx || closedRef.current) return;
    closedRef.current = true;

    const totalListened = calculateTotalListenedRef.current();
    const wasAbandoned = !isCompletedRef.current;

    logAudioEvent({
      session_id: sessionIdRef.current,
      user_id: uid,
      lesson_id: ctx.lessonId,
      event_type: 'closed',
      position_seconds: position,
      listen_percent: listenPercent,
    });

    upsertAudioSession({
      session_id: sessionIdRef.current,
      user_id: uid,
      lesson_id: ctx.lessonId,
      lesson_title: ctx.lessonTitle,
      series_id: ctx.seriesId,
      program_id: ctx.programId,
      program_title: ctx.programTitle,
      category_slug: ctx.categorySlug,
      category_title: ctx.categoryTitle,
      started_at: startedAtRef.current,
      ended_at: new Date().toISOString(),
      audio_duration_seconds: ctx.audioDurationSeconds
        ? Math.round(ctx.audioDurationSeconds)
        : undefined,
      unique_listen_seconds: Math.round(totalListened),
      completion_percent: listenPercent,
      is_completed: isCompletedRef.current,
      was_abandoned: wasAbandoned,
      seek_count: seekCountRef.current,
      pause_count: pauseCountRef.current,
    });
  }, []);

  // Finální uložení při unmount (tab switch, navigace pryč, app zavření).
  // Zachytí všechny sessions kde uživatel nepoklepá X, ale prostě odejde.
  // Prázdné deps [] — záměrně čte jen refs (jsou vždy aktuální, bez stale closure).
  useEffect(() => {
    return () => {
      if (closedRef.current || !sessionStartedRef.current) return;
      const uid = userIdRef.current;
      const ctx = sessionContextRef.current;
      if (!uid || !ctx) return;

      closedRef.current = true;
      const totalListened = calculateTotalListenedRef.current();
      const dur = durationRef.current;
      // Guard: pokud duration není načteno, použij audioDurationSeconds z kontextu.
      const effectiveDur = dur > 0 ? dur : (ctx.audioDurationSeconds ?? 0);
      // Pokud tracker vrátí 0, použij currentTime jako dolní odhad.
      const effectiveListened = totalListened > 0 ? totalListened : currentTimeRef.current;
      const listenPercent = effectiveDur > 0
        ? Math.round(Math.min(100, (effectiveListened / effectiveDur) * 10000)) / 100
        : 0;
      const pos = currentTimeRef.current;

      logAudioEvent({
        session_id: sessionIdRef.current,
        user_id: uid,
        lesson_id: ctx.lessonId,
        event_type: 'closed',
        position_seconds: pos,
        listen_percent: listenPercent,
      });

      upsertAudioSession({
        session_id: sessionIdRef.current,
        user_id: uid,
        lesson_id: ctx.lessonId,
        lesson_title: ctx.lessonTitle,
        series_id: ctx.seriesId,
        program_id: ctx.programId,
        program_title: ctx.programTitle,
        category_slug: ctx.categorySlug,
        category_title: ctx.categoryTitle,
        started_at: startedAtRef.current,
        ended_at: new Date().toISOString(),
        audio_duration_seconds: ctx.audioDurationSeconds
          ? Math.round(ctx.audioDurationSeconds)
          : undefined,
        unique_listen_seconds: Math.round(effectiveListened),
        completion_percent: listenPercent,
        is_completed: isCompletedRef.current,
        was_abandoned: !isCompletedRef.current,
        seek_count: seekCountRef.current,
        pause_count: pauseCountRef.current,
      });
    };
   
  }, []);

  // Záloha: beforeunload/pagehide — pro případ zavření tab/browser/PWA.
  // Fetch nemá zaručené dokončení při unload → sendBeacon je spolehlivější,
  // ale vyžaduje serializaci. Zde používáme keepalive fetch (Supabase client
  // to interně dělá přes fetch — na mobilech dostačující).
  useEffect(() => {
    const handleUnload = () => {
      if (closedRef.current || !sessionStartedRef.current) return;
      const uid = userIdRef.current;
      const ctx = sessionContextRef.current;
      if (!uid || !ctx) return;

      closedRef.current = true;
      const totalListened = calculateTotalListenedRef.current();
      const dur = durationRef.current;
      const listenPercent = dur > 0
        ? Math.round(Math.min(100, (totalListened / dur) * 10000)) / 100
        : 0;

      upsertAudioSession({
        session_id: sessionIdRef.current,
        user_id: uid,
        lesson_id: ctx.lessonId,
        lesson_title: ctx.lessonTitle,
        series_id: ctx.seriesId,
        program_id: ctx.programId,
        program_title: ctx.programTitle,
        category_slug: ctx.categorySlug,
        category_title: ctx.categoryTitle,
        started_at: startedAtRef.current,
        ended_at: new Date().toISOString(),
        audio_duration_seconds: ctx.audioDurationSeconds
          ? Math.round(ctx.audioDurationSeconds)
          : undefined,
        unique_listen_seconds: Math.round(totalListened),
        completion_percent: listenPercent,
        is_completed: isCompletedRef.current,
        was_abandoned: !isCompletedRef.current,
        seek_count: seekCountRef.current,
        pause_count: pauseCountRef.current,
      });
    };

    // pagehide je spolehlivější než beforeunload na mobilních prohlížečích/PWA
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
   
  }, []);

  return { logSeek, logClose };
}
