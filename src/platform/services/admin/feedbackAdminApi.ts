/**
 * Feedback Admin API
 *
 * Admin-only operace: seznam podnětů, změna statusu, statistiky přispěvatelů.
 *
 * Status změna probíhá přímým DB update — Postgres trigger
 * notify_user_on_feedback_status() automaticky odešle notifikaci
 * uživateli a nastaví accepted_at / done_at timestamp.
 *
 * @package DechBar_App
 * @subpackage Platform/Services/Admin
 * @since 2026-02-28
 */

import { supabase } from '@/platform/api/supabase';
import type {
  AdminFeedback,
  FeedbackCategory,
  FeedbackStatus,
  FeedbackStats,
  UserFeedback,
} from '@/platform/api/feedbackTypes';

// ============================================================
// Filters
// ============================================================

export interface FeedbackListFilters {
  status?:   FeedbackStatus;
  category?: FeedbackCategory;
  search?:   string;
}

// ============================================================
// getFeedbackList
// Načte všechny podněty + merge s profiles daty (jméno, email, avatar)
// ============================================================

export async function getFeedbackList(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters?: FeedbackListFilters,
): Promise<AdminFeedback[]> {
  // Seřazeno: priorita (3→1 first, null last), pak datum (nejnovější první)
  const { data: feedbackData, error: feedbackError } = await supabase
    .from('user_feedback')
    .select('*')
    .order('priority', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (feedbackError) throw feedbackError;
  if (!feedbackData || feedbackData.length === 0) return [];

  // Unikátní user_id pro fetch profiles
  const userIds = [...new Set((feedbackData as UserFeedback[]).map((f) => f.user_id))];

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('user_id, full_name, email, avatar_url')
    .in('user_id', userIds);

  const profileMap: Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }> = {};
  for (const p of profilesData ?? []) {
    profileMap[p.user_id] = {
      full_name:  p.full_name,
      email:      p.email,
      avatar_url: p.avatar_url,
    };
  }

  return (feedbackData as UserFeedback[]).map((f) => ({
    ...f,
    user_name:       profileMap[f.user_id]?.full_name  ?? null,
    user_email:      profileMap[f.user_id]?.email      ?? null,
    user_avatar_url: profileMap[f.user_id]?.avatar_url ?? null,
  }));
}

// ============================================================
// updateFeedbackStatus
// Přímý DB update — trigger notify_user_on_feedback_status()
// nastaví timestamp a insertne notifikaci pro uživatele.
// ============================================================

export async function updateFeedbackStatus(
  feedbackId: string,
  newStatus: 'accepted' | 'done',
): Promise<void> {
  // Status update přímo v DB — Postgres trigger notify_user_on_feedback_status()
  // automaticky odešle notifikaci uživateli a nastaví accepted_at/done_at timestamp.
  const { error } = await supabase
    .from('user_feedback')
    .update({ status: newStatus })
    .eq('id', feedbackId);

  if (error) throw error;
}

// ============================================================
// updateFeedbackPriority
// Nastaví prioritu podnětu: 1 (nízká), 2 (střední), 3 (vysoká), null (bez priority)
// Čistá DB operace — nevyžaduje Edge Function
// ============================================================

export async function updateFeedbackPriority(
  feedbackId: string,
  priority: 1 | 2 | 3 | null,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Nejsi přihlášen.');

  const { error } = await supabase
    .from('user_feedback')
    .update({ priority })
    .eq('id', feedbackId);

  if (error) throw error;
}

// ============================================================
// getFeedbackStats
// Agregace podnětů per user: celkem, týden, měsíc, rok
// Agregace probíhá client-side (bez RPC pro MVP)
// ============================================================

// Skóre jedné položky: napad+chyba dle priority, pochvala = 0
function itemScore(
  category: string,
  priority: number | null,
): number {
  if (category === 'pochvala') return 0;
  return priority ?? 1; // bez priority = 1 bod
}

export async function getFeedbackStats(): Promise<FeedbackStats[]> {
  const { data: feedbackData, error: feedbackError } = await supabase
    .from('user_feedback')
    .select('user_id, created_at, category, priority');

  if (feedbackError) throw feedbackError;
  if (!feedbackData || feedbackData.length === 0) return [];

  type FeedbackRow = {
    user_id:    string;
    created_at: string;
    category:   string;
    priority:   number | null;
  };

  const userIds = [...new Set((feedbackData as FeedbackRow[]).map((f) => f.user_id))];

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('user_id, full_name, avatar_url')
    .in('user_id', userIds);

  const profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  for (const p of profilesData ?? []) {
    profileMap[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
  }

  const now = new Date();
  // Pondělí aktuálního týdne
  const dow = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear  = new Date(now.getFullYear(), 0, 1);

  type UserStats = {
    total: number; this_week: number; this_month: number; this_year: number;
    napad_count: number; chyba_count: number; pochvala_count: number; jine_count: number;
    score: number; score_week: number; score_month: number; score_year: number;
  };

  const statsMap: Record<string, UserStats> = {};

  for (const row of feedbackData as FeedbackRow[]) {
    if (!statsMap[row.user_id]) {
      statsMap[row.user_id] = {
        total: 0, this_week: 0, this_month: 0, this_year: 0,
        napad_count: 0, chyba_count: 0, pochvala_count: 0, jine_count: 0,
        score: 0, score_week: 0, score_month: 0, score_year: 0,
      };
    }

    const s   = statsMap[row.user_id];
    const d   = new Date(row.created_at);
    const pts = itemScore(row.category, row.priority);

    s.total++;
    s.score += pts;

    if (d >= startOfWeek)  { s.this_week++;  s.score_week  += pts; }
    if (d >= startOfMonth) { s.this_month++; s.score_month += pts; }
    if (d >= startOfYear)  { s.this_year++;  s.score_year  += pts; }

    if (row.category === 'napad')    s.napad_count++;
    else if (row.category === 'chyba')    s.chyba_count++;
    else if (row.category === 'pochvala') s.pochvala_count++;
    else                                  s.jine_count++;
  }

  return Object.entries(statsMap)
    .map(([userId, stats]) => ({
      user_id:         userId,
      user_name:       profileMap[userId]?.full_name  ?? null,
      user_avatar_url: profileMap[userId]?.avatar_url ?? null,
      ...stats,
    }))
    .sort((a, b) => b.score - a.score);
}
