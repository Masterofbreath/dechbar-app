/**
 * feedback-status-notify — Supabase Edge Function
 *
 * Když admin změní status podnětu (accepted / done):
 *   1. Ověří admin / CEO roli volajícího uživatele
 *   2. Načte feedback record (user_id, current status)
 *   3. Validuje přechod stavu (new→accepted, accepted→done)
 *   4. Updatuje status + timestamp v user_feedback
 *   5. Vytvoří notifikaci v notifications tabulce
 *   6. Přidá ji do user_notifications pro konkrétního uživatele
 *
 * Notifikační texty:
 *   accepted → "Tvůj podnět jsme přijali" / "Díky! Rozdýcháváme to a brzy se k tomu dostaneme."
 *   done     → "Tvůj podnět je splněn"    / "Udělali jsme to pro tebe. Ať to dýchá!"
 *
 * @package DechBar_App
 * @subpackage Supabase/Functions
 * @since 2026-02-28
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Auth ────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Extrahuj JWT token z hlavičky
    const jwt = authHeader.replace('Bearer ', '').trim();

    const supabaseUrl        = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey    = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client — anon key + auth header (Deno pattern)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    // Admin client — service role pro DB operace (obchází RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // V Deno Edge Function prostředí předáváme JWT explicitně
    const { data: { user }, error: authError } = await userClient.auth.getUser(jwt);
    if (!user || authError) {
      console.error('auth.getUser failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Ověř admin / CEO roli ────────────────────────────────
    // user_roles používá role_id (ne role)
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id)
      .in('role_id', ['admin', 'ceo']);

    if (!roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin or CEO role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Parse body ───────────────────────────────────────────
    const body = await req.json();
    const feedbackId: string = body.feedback_id;
    const newStatus: 'accepted' | 'done' = body.new_status;

    if (!feedbackId || !['accepted', 'done'].includes(newStatus)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: feedback_id and new_status (accepted|done) required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Načti feedback ───────────────────────────────────────
    const { data: feedback, error: fetchError } = await adminClient
      .from('user_feedback')
      .select('id, user_id, status')
      .eq('id', feedbackId)
      .single();

    if (fetchError || !feedback) {
      return new Response(
        JSON.stringify({ error: 'Feedback not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Validuj přechod stavu (jednosměrný: new→accepted→done) ──
    const validTransitions: Record<string, string> = {
      new:      'accepted',
      accepted: 'done',
    };

    if (validTransitions[feedback.status] !== newStatus) {
      return new Response(
        JSON.stringify({ error: `Invalid status transition: ${feedback.status} → ${newStatus}` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Update status v DB ───────────────────────────────────
    const now = new Date().toISOString();
    const updatePayload: Record<string, string> = {
      status: newStatus,
      ...(newStatus === 'accepted' ? { accepted_at: now } : { done_at: now }),
    };

    const { error: updateError } = await adminClient
      .from('user_feedback')
      .update(updatePayload)
      .eq('id', feedbackId);

    if (updateError) throw updateError;

    // ── Notification texty ───────────────────────────────────
    const notifTexts: Record<string, { title: string; message: string }> = {
      accepted: {
        title:   'Tvůj podnět jsme přijali',
        message: 'Díky! Rozdýcháváme to a brzy se k tomu dostaneme.',
      },
      done: {
        title:   'Tvůj podnět je splněn',
        message: 'Udělali jsme to pro tebe. Ať to dýchá!',
      },
    };

    const { title, message } = notifTexts[newStatus];

    // ── Insert notifikaci ────────────────────────────────────
    const { data: notifData, error: notifError } = await adminClient
      .from('notifications')
      .insert({
        type:             'system',
        title,
        message,
        action_url:       null,
        action_label:     null,
        image_url:        null,
        target_audience:  'role',
        sent_at:          now,
        is_auto_generated: true,
        auto_trigger:     `feedback_${newStatus}`,
      })
      .select('id')
      .single();

    if (notifError) throw notifError;

    // ── Fanout do user_notifications pro konkrétního uživatele ──
    const { error: fanoutError } = await adminClient
      .from('user_notifications')
      .insert({
        user_id:         feedback.user_id,
        notification_id: notifData.id,
        read:            false,
      });

    if (fanoutError) throw fanoutError;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('feedback-status-notify error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
