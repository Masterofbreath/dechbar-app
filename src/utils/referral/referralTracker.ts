/**
 * Referral Tracker — Global URL Referral Code Capture & Storage
 *
 * HOW IT WORKS (end-to-end):
 *
 * 1. User A shares their referral link: https://www.dechbar.cz/?ref=847293
 *    (or https://www.dechbar.cz/vyzva?ref=847293 — works on ANY page)
 *
 * 2. User B opens the link → RootLayout fires `captureReferralFromUrl()` once.
 *    Code is stored in localStorage with a 7-day TTL.
 *
 * 3. User B registers (magic link, OAuth, challenge — any path):
 *    - Magic link: `referral_code` is passed in Supabase user metadata → DB trigger
 *      picks it up and writes to `referral_events` automatically.
 *    - OAuth: after auth returns, `getReferralCode()` is called and `record_referral_event()`
 *      RPC is invoked directly.
 *
 * 4. `clearReferralCode()` removes the code from localStorage after successful recording.
 *
 * WHY localStorage (not sessionStorage)?
 *   Magic links open in a NEW browser tab. SessionStorage doesn't survive tab switches.
 *   LocalStorage persists across tabs and survives the email → click journey.
 *
 * @package DechBar_App
 * @subpackage Utils/Referral
 * @since 0.4.1
 */

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'dechbar_ref';

/** How long to remember a referral code (7 days in ms) */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Query parameter name in URLs: ?ref=XXXXXX */
const URL_PARAM = 'ref';

/** Valid referral code format: exactly 6 digits */
const CODE_REGEX = /^\d{6}$/;

// ============================================================
// Types
// ============================================================

interface StoredReferral {
  /** The 6-digit referral code */
  code: string;
  /** When the code was captured (ISO string) */
  capturedAt: string;
  /** Which path the user landed on (e.g. '/vyzva', '/') */
  sourcePath: string;
  /** Full URL of the referral link for debugging */
  sourceUrl: string;
}

// ============================================================
// Capture — call this on every page load
// ============================================================

/**
 * Reads `?ref=XXXXXX` from the URL and stores it in localStorage.
 *
 * IMPORTANT: Pass `searchString` explicitly from React Router's `useLocation().search`
 * — do NOT rely on `window.location.search` inside a useEffect, because child
 * components (e.g. `<Navigate>`) fire their effects BEFORE the parent, and
 * `window.location` may already point to the redirected URL by then.
 *
 * @param searchString - URL search string to parse. Falls back to window.location.search
 *   only when called outside React (e.g. plain JS context). In React, always pass
 *   `location.search` from `useLocation()`, captured at render time.
 *
 * @example
 * // ✅ Correct (in React hook — render phase value):
 * captureReferralFromUrl(location.search);
 *
 * // ✅ Also correct (outside React):
 * captureReferralFromUrl(); // reads window.location.search
 */
export function captureReferralFromUrl(searchString?: string): void {
  if (typeof window === 'undefined') return;

  try {
    // Use the explicitly passed search string (from React Router, render-time capture)
    // or fall back to window.location.search only in non-React contexts
    const search = searchString ?? window.location.search;
    const params = new URLSearchParams(search);
    const code = params.get(URL_PARAM);

    if (!code || !CODE_REGEX.test(code)) return;

    const payload: StoredReferral = {
      code,
      capturedAt: new Date().toISOString(),
      sourcePath: window.location.pathname,
      sourceUrl: window.location.href,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    console.log(`[Referral] Code captured: ${code} from ${window.location.pathname}`);
  } catch {
    // localStorage not available (private browsing edge cases) — silent fail
  }
}

// ============================================================
// Read — call before registration to get the stored code
// ============================================================

/**
 * Returns the stored referral code if it exists and hasn't expired.
 * Returns null if absent, expired, or invalid.
 *
 * @example
 * const code = getReferralCode(); // '847293' or null
 */
export function getReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored: StoredReferral = JSON.parse(raw);

    // Check TTL — discard stale codes
    const capturedAt = new Date(stored.capturedAt).getTime();
    if (Date.now() - capturedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[Referral] Code expired, cleared from storage');
      return null;
    }

    // Validate format (defensive check)
    if (!CODE_REGEX.test(stored.code)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return stored.code;
  } catch {
    return null;
  }
}

/**
 * Returns the full stored referral data (code + source info).
 * Useful for analytics/debugging. Returns null if no valid code stored.
 */
export function getReferralData(): StoredReferral | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored: StoredReferral = JSON.parse(raw);
    const capturedAt = new Date(stored.capturedAt).getTime();
    if (Date.now() - capturedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

// ============================================================
// Clear — call after successful referral recording
// ============================================================

/**
 * Removes the referral code from localStorage.
 * Call this after successfully recording the referral event in DB,
 * so the code isn't re-used on subsequent logins.
 *
 * @example
 * await recordReferralEvent(...);
 * clearReferralCode();
 */
export function clearReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silent fail
  }
}
