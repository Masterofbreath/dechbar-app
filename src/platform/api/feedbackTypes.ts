/**
 * Feedback Types — "Sdílej podnět" systém
 *
 * Typy pro uživatelský feedback systém.
 * Sdíleno mezi FeedbackModal (user) a FeedbackAdmin (admin).
 *
 * @package DechBar_App
 * @subpackage Platform/API
 * @since 2026-02-28
 */

export type FeedbackCategory = 'napad' | 'chyba' | 'pochvala' | 'jine';
export type FeedbackStatus = 'new' | 'accepted' | 'done';

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  napad:    'Nápad',
  chyba:    'Chyba',
  pochvala: 'Pochvala',
  jine:     'Jiné',
};

export interface UserFeedback {
  id:              string;
  user_id:         string;
  feedback_number: number;
  category:        FeedbackCategory;
  message:         string;
  image_url:       string | null;
  app_version:     string | null;
  status:          FeedbackStatus;
  priority:        1 | 2 | 3 | null;
  created_at:      string;
  accepted_at:     string | null;
  done_at:         string | null;
}

export interface AdminFeedback extends UserFeedback {
  user_name:       string | null;
  user_email:      string | null;
  user_avatar_url: string | null;
}

export interface SubmitFeedbackPayload {
  category:    FeedbackCategory;
  message:     string;
  image_url?:  string | null;
  app_version?: string | null;
}

export interface FeedbackStats {
  user_id:         string;
  user_name:       string | null;
  user_avatar_url: string | null;
  // Počty celkové (všechny kategorie)
  total:           number;
  this_week:       number;
  this_month:      number;
  this_year:       number;
  // Počty per kategorie
  napad_count:     number;
  chyba_count:     number;
  pochvala_count:  number;
  jine_count:      number;
  // Hodnotové skóre = Σ priority (jen napad+chyba), pochvala se nezapočítává
  score:           number;
  score_week:      number;
  score_month:     number;
  score_year:      number;
}
