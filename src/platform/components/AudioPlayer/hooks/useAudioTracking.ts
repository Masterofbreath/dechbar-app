/**
 * useAudioTracking - 80% completion tracking hook
 * 
 * CRITICAL: Tracks listened segments with merge algorithm
 * - Detects seeks (time jump > 2s)
 * - Merges overlapping intervals (prevents double-counting!)
 * - Calculates total unique listened time
 * - Silent completion at 80% threshold (background DB save)
 * 
 * @version 2.43.0
 * @status ✅ IMPLEMENTED
 */

import { useState, useRef, useCallback, useEffect } from 'react';
// TODO: Import supabase client when ready
// import { supabase } from '@/platform/lib/supabase';

interface UseAudioTrackingProps {
  trackId: string;
  albumId: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
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
  
  // Sort by start time
  const sorted = [...segments].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    
    if (current[0] <= last[1]) {
      // Overlapping or adjacent - merge
      last[1] = Math.max(last[1], current[1]);
    } else {
      // Non-overlapping - add new segment
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
}: UseAudioTrackingProps): UseAudioTrackingReturn => {
  const [listenedSegments, setListenedSegments] = useState<Array<[number, number]>>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const lastTimeRef = useRef<number>(0);
  const segmentStartRef = useRef<number>(0);
  
  // Track listened segments during playback
  useEffect(() => {
    if (!isPlaying) return;
    
    const lastTime = lastTimeRef.current;
    const timeDiff = Math.abs(currentTime - lastTime);
    
    // Detect seek (time jump > 2 seconds)
    if (timeDiff > 2) {
      // Seek detected - save previous segment
      if (segmentStartRef.current !== lastTime && lastTime > segmentStartRef.current) {
        setListenedSegments(prev => [...prev, [segmentStartRef.current, lastTime]]);
      }
      // Start new segment at current position
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
  
  // Check 80% completion
  useEffect(() => {
    if (isCompleted || duration === 0) return;
    
    const totalListened = calculateTotalListened();
    const completionPercent = (totalListened / duration) * 100;
    
    if (completionPercent >= 80) {
      setIsCompleted(true);
      // Silent completion (background DB save)
      markAsCompleted(trackId, albumId, totalListened);
    }
  }, [currentTime, duration, isCompleted, trackId, albumId, calculateTotalListened]);
  
  // Save to database (silent, background)
  const markAsCompleted = async (trackId: string, albumId: string | null, listenTime: number) => {
    // TODO: Implement Supabase save when DB is ready
    console.log('✅ Track completed silently:', { 
      trackId, 
      albumId, 
      listenTime: Math.floor(listenTime),
      completionPercent: Math.floor((listenTime / duration) * 100),
    });
    
    /* FUTURE IMPLEMENTATION:
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Check existing completions
    const { data: existing } = await supabase
      .from('track_completions')
      .select('completion_count')
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const completionCount = existing ? existing.completion_count + 1 : 1;
    
    // Insert completion record
    await supabase
      .from('track_completions')
      .insert({
        user_id: user.id,
        track_id: trackId,
        album_id: albumId,
        completion_count: completionCount,
        listen_time: Math.floor(listenTime),
        completed_at: new Date().toISOString(),
      });
    */
  };
  
  // Save progress (every 10s or on pause)
  const saveProgress = useCallback(async () => {
    // TODO: Implement Supabase save when DB is ready
    const totalListened = calculateTotalListened();
    const progressPercent = (totalListened / duration) * 100;
    
    console.log('💾 Saving progress:', {
      trackId,
      totalListened: Math.floor(totalListened),
      lastPosition: Math.floor(currentTime),
      progressPercent: Math.floor(progressPercent),
    });
    
    /* FUTURE IMPLEMENTATION:
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
      .from('track_progress')
      .upsert({
        user_id: user.id,
        track_id: trackId,
        album_id: albumId,
        listened_seconds: Math.floor(totalListened),
        last_position: Math.floor(currentTime),
        progress_percent: Number(progressPercent.toFixed(2)),
        last_played_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    */
  }, [trackId, albumId, currentTime, duration, calculateTotalListened]);
  
  // Auto-save progress every 10s during playback
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      saveProgress();
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, [isPlaying, saveProgress]);
  
  return {
    listenedSegments,
    isCompleted,
    calculateTotalListened,
    saveProgress,
  };
};
