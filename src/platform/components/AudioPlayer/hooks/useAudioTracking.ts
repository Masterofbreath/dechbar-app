/**
 * useAudioTracking - 80% completion tracking hook
 *
 * CRITICAL: Tracks listened segments with merge algorithm
 * - Detects seeks (time jump > 2s)
 * - Merges overlapping intervals (prevents double-counting!)
 * - Calculates total unique listened time
 * - Silent completion at 80% threshold (background DB save to user_lesson_progress)
 *
 * @version 2.46.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { akademieKeys } from '@/modules/akademie/api/keys';

interface UseAudioTrackingProps {
  trackId: string;
  albumId: string | null; // = series_id (set by lessonToTrack helper)
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  userId?: string;
}

interface UseAudioTrackingReturn {
  listenedSegments: Array<[number, number]>;
  isCompleted: boolean;
  calculateTotalListened: () => number;
  saveProgress: () => Promise<void>;
}

/**
 * Merge overlapping time intervals
 * CRITICAL: Prevents double-counting when user seeks backward
 *
 * Example: [[0,50], [30,80]] → [[0,80]]
 */
const mergeIntervals = (segments: Array<[number, number]>): Array<[number, number]> => {
  if (segments.length === 0) return [];

  const sorted = [...segments].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
};

export const useAudioTracking = ({
  trackId,
  albumId,
  duration,
  currentTime,
  isPlaying,
  userId,
}: UseAudioTrackingProps): UseAudioTrackingReturn => {
  const [listenedSegments, setListenedSegments] = useState<Array<[number, number]>>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const lastTimeRef = useRef<number>(0);
  const segmentStartRef = useRef<number>(0);

  // Stable ref to queryClient — safe to call in async callbacks
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  // Reset state when track changes — intentional synchronous reset on trackId change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setListenedSegments([]);
     
    setIsCompleted(false);
    lastTimeRef.current = 0;
    segmentStartRef.current = 0;
  }, [trackId]);

  // Track listened segments during playback
  useEffect(() => {
    if (!isPlaying) return;

    const lastTime = lastTimeRef.current;
    const timeDiff = Math.abs(currentTime - lastTime);

    // Detect seek (time jump > 2 seconds)
    if (timeDiff > 2) {
      if (segmentStartRef.current !== lastTime && lastTime > segmentStartRef.current) {
        setListenedSegments(prev => [...prev, [segmentStartRef.current, lastTime]]);
      }
      segmentStartRef.current = currentTime;
    }

    lastTimeRef.current = currentTime;
  }, [currentTime, isPlaying]);

  // Save segment when paused
  useEffect(() => {
    if (!isPlaying && lastTimeRef.current > segmentStartRef.current) {
      setListenedSegments(prev => [...prev, [segmentStartRef.current, lastTimeRef.current]]);
      segmentStartRef.current = lastTimeRef.current;
    }
  }, [isPlaying]);

  // Calculate total unique listened time
  const calculateTotalListened = useCallback((): number => {
    const merged = mergeIntervals(listenedSegments);
    return merged.reduce((sum, [start, end]) => sum + (end - start), 0);
  }, [listenedSegments]);

  // Write completion to user_lesson_progress (silent, background)
  const markAsCompleted = useCallback(async (
    lessonId: string,
    seriesId: string | null,
    listenTime: number,
  ) => {
    if (!userId || !lessonId) return;

    const { error } = await supabase
      .from('user_lesson_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
          play_duration_seconds: Math.floor(listenTime),
        },
        { onConflict: 'user_id,lesson_id' },
      );

    if (error) {
      console.error('[useAudioTracking] Failed to save completion:', error.message);
      return;
    }

    // Invalidate lesson cache so checkmarks update immediately
    if (seriesId) {
      queryClientRef.current.invalidateQueries({
        queryKey: akademieKeys.lessons(seriesId),
      });
    }
    // Invalidate daily program next-lesson cache for all users
    queryClientRef.current.invalidateQueries({
      queryKey: akademieKeys.all,
      predicate: (query) =>
        query.queryKey.includes('nextLesson') ||
        query.queryKey.includes('activeProgram'),
    });
  }, [userId]);

  // Check 80% completion threshold
  useEffect(() => {
    if (isCompleted || duration === 0 || !trackId) return;

    const totalListened = calculateTotalListened();
    const completionPercent = (totalListened / duration) * 100;

    if (completionPercent >= 80) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCompleted(true);
      markAsCompleted(trackId, albumId, totalListened);
    }
  }, [currentTime, duration, isCompleted, trackId, albumId, calculateTotalListened, markAsCompleted]);

  const saveProgress = useCallback(async () => {
    // Progress saving intentionally left as no-op (completion is the signal we use)
  }, []);

  return {
    listenedSegments,
    isCompleted,
    calculateTotalListened,
    saveProgress,
  };
};
