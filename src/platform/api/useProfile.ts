/**
 * useProfile - User Profile API Hook
 *
 * Reads and updates user profile data from the `profiles` table.
 * Auth metadata (email, avatar_url) is synced via supabase.auth.updateUser.
 * Avatar upload goes to the public `avatars` storage bucket.
 *
 * @package DechBar_App
 * @subpackage Platform/API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuthStore } from '@/platform/auth/authStore';
import { getVocative } from '@/utils/inflection';

// ============================================================
// Types
// ============================================================

export interface ProfileData {
  user_id: string;
  email: string;
  full_name: string | null;
  nickname: string | null;
  vocative_override: string | null;
  avatar_url: string | null;
}

export interface UpdateProfilePayload {
  full_name?: string;
  nickname?: string;
  vocative_override?: string;
}

// ============================================================
// Query keys
// ============================================================

const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
};

// ============================================================
// Nickname availability check (exported standalone)
// ============================================================

/**
 * Check if a nickname is available (case-insensitive).
 * Returns true if available, false if taken.
 */
export async function checkNicknameAvailable(
  nickname: string,
  currentUserId: string
): Promise<boolean> {
  if (!nickname.trim()) return true;
  const { data } = await supabase
    .from('profiles')
    .select('user_id')
    .ilike('nickname', nickname.trim())
    .neq('user_id', currentUserId)
    .maybeSingle();
  return data === null;
}

// ============================================================
// Fetch profile from DB
// ============================================================

async function fetchProfile(userId: string): Promise<ProfileData> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, full_name, avatar_url, nickname, vocative_override')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  // Profile row may not exist yet for very new users
  if (!data) {
    return {
      user_id: userId,
      email: '',
      full_name: null,
      nickname: null,
      vocative_override: null,
      avatar_url: null,
    };
  }

  return data as ProfileData;
}

// ============================================================
// Main hook
// ============================================================

export function useProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  // ── Read ──────────────────────────────────────────────────
  const profileQuery = useQuery({
    queryKey: profileKeys.detail(userId ?? ''),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Merge DB data with auth store data (auth store is source of truth for email/avatar)
  const profile: ProfileData | null = profileQuery.data
    ? {
        ...profileQuery.data,
        email: user?.email ?? profileQuery.data.email,
        full_name: profileQuery.data.full_name ?? user?.full_name ?? null,
        avatar_url: profileQuery.data.avatar_url ?? user?.avatar_url ?? null,
      }
    : null;

  // ── Update Profile ────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      if (!userId) throw new Error('Not authenticated');

      // 1. Update profiles table.
      // Profile row is always created by on_auth_user_created_profile trigger on registration.
      // We use update() (not upsert) because:
      //   - upsert generates INSERT ... ON CONFLICT DO UPDATE
      //   - INSERT requires email (NOT NULL, no default) → 400 if email not in payload
      //   - update() only modifies the columns we pass, no NOT NULL check on omitted cols
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...(payload.full_name !== undefined && { full_name: payload.full_name }),
          ...(payload.nickname !== undefined && {
            nickname: payload.nickname.trim() || null,
            nickname_set_at: payload.nickname.trim() ? new Date().toISOString() : null,
          }),
          ...(payload.vocative_override !== undefined && {
            vocative_override: payload.vocative_override.trim() || null,
          }),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // 2. Sync to auth user_metadata for real-time access in auth store
      const vocativeName =
        payload.vocative_override?.trim() ||
        (payload.full_name
          ? (getVocative(payload.full_name.trim().split(/\s+/)[0]) ?? undefined)
          : undefined);

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          ...(payload.full_name !== undefined && { full_name: payload.full_name }),
          ...(vocativeName !== undefined && { vocative_name: vocativeName }),
        },
      });

      if (authError) throw authError;
    },
    onSuccess: async () => {
      // 1. Invalidate React Query cache — triggers refetch wherever useProfile is mounted
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId ?? '') });

      // 2. Directly refresh auth store after auth metadata update.
      //    supabase.auth.updateUser() fires USER_UPDATED → onAuthStateChange, but that
      //    async event may not propagate to other instances (e.g. Capacitor native app).
      //    Calling _setUser() here guarantees user.full_name / user.vocative_name update
      //    immediately in the same session — no WebSocket or auth event needed.
      try {
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        if (freshUser) {
          useAuthStore.getState()._setUser({
            id: freshUser.id,
            email: freshUser.email!,
            full_name: freshUser.user_metadata.full_name,
            vocative_name: freshUser.user_metadata.vocative_name,
            avatar_url: freshUser.user_metadata.avatar_url,
            created_at: freshUser.created_at,
          });
        }
      } catch {
        // Non-blocking — onAuthStateChange handles this as fallback
      }
    },
  });

  // ── Upload Avatar ─────────────────────────────────────────
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error('Not authenticated');

      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      // Upload to Supabase Storage (public bucket)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL (bucket is public → no expiry)
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Update profiles table — use update() not upsert() because email is NOT NULL
      // and upsert would fail with 400 (INSERT ... ON CONFLICT requires all NOT NULL cols)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Sync to auth metadata
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId ?? '') });
    },
  });

  return {
    profile,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,

    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    uploadError: uploadAvatarMutation.error,
  };
}
