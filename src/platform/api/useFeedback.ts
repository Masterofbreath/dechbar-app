/**
 * useFeedback — React Query hook pro odeslání podnětu
 *
 * Umožňuje uživateli odeslat podnět ke zlepšení do user_feedback tabulky.
 * app_version se přidává automaticky z VITE_APP_VERSION.
 *
 * @package DechBar_App
 * @subpackage Platform/API
 * @since 2026-02-28
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuthStore } from '@/platform/auth/authStore';
import type { SubmitFeedbackPayload } from './feedbackTypes';

const APP_VERSION = import.meta.env.VITE_APP_VERSION as string | undefined;

async function submitFeedback(
  userId: string,
  payload: SubmitFeedbackPayload,
): Promise<void> {
  const { error } = await supabase.from('user_feedback').insert({
    user_id:     userId,
    category:    payload.category,
    message:     payload.message.trim(),
    image_url:   payload.image_url ?? null,
    app_version: payload.app_version ?? APP_VERSION ?? null,
  });

  if (error) throw error;
}

export function useSubmitFeedback() {
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (payload: SubmitFeedbackPayload) => {
      if (!user?.id) throw new Error('Uživatel není přihlášen.');
      return submitFeedback(user.id, payload);
    },
  });
}
