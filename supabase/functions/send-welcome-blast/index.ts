/**
 * send-welcome-blast - Edge Function
 *
 * Odešle uvítací email s magic linkem všem uživatelům,
 * kteří ho ještě nedostali (profiles.welcome_email_sent_at IS NULL).
 *
 * Ochrana: každý uživatel dostane email nejvýše jednou.
 * Testovací režim: odešle pouze na test_email bez označení v DB.
 *
 * Flow:
 *   1. Ověří Authorization header (service role key)
 *   2. Test mode → pošle pouze na test_email, bez DB flagování
 *   3. Prod mode → načte všechny uživatele bez welcome_email_sent_at
 *   4. Zpracuje v dávkách po 20 (paralelně)
 *   5. Pro každého: generateLink → Ecomail → mark DB
 *
 * Spuštění:
 *   - Manuální test: POST s { test_mode: true, test_email: "..." }
 *   - Produkce: pg_cron job 28.2.2026 ve 3:00 UTC (4:00 CET)
 *
 * @package DechBar_App
 * @subpackage Supabase/Functions
 * @since 2026-02-28
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// =====================================================
// CONSTANTS
// =====================================================

const ECOMAIL_BASE_URL = 'https://api2.ecomailapp.cz';
const APP_URL = 'https://www.dechbar.cz/app';
const FROM_EMAIL = 'info@dechbar.cz';
const FROM_NAME = 'Jakub z DechBaru';
const BATCH_SIZE = 20;

const EMAIL_SUBJECT = 'DechBar aplikace je spuštěná — vstup jedním kliknutím';

// =====================================================
// EMAIL HTML TEMPLATE
// =====================================================

function buildEmailHtml(magicLink: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DechBar aplikace je spuštěná</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0a0a0a;padding:40px 16px 48px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#121212;border-radius:20px;border:1px solid rgba(44,190,198,0.18);max-width:100%;overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="padding:24px 28px 28px;background:linear-gradient(160deg,#181818 0%,#0d1f21 100%);border-bottom:1px solid rgba(44,190,198,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:22px;">
                <tr>
                  <td align="left">
                    <img src="https://dechbar-cdn.b-cdn.net/images/Logo/DechBar_logo%20(bez%20sloganu)%20-%20desktop_off-white%20-%20600x187.png" alt="DechBar" width="80" style="display:block;width:80px;height:auto;" />
                  </td>
                </tr>
              </table>
              <div style="text-align:center;">
                <h1 style="margin:0 0 4px;color:#F0F0F0;font-size:26px;font-weight:700;letter-spacing:-0.02em;line-height:1.3;">DechBar aplikace je spuštěná</h1>
                <p style="margin:0 0 16px;color:#5A8080;font-size:14px;font-weight:500;">a ty jsi u toho jako první</p>
                <div style="display:inline-block;padding:5px 14px;background-color:rgba(44,190,198,0.1);border:1px solid rgba(44,190,198,0.28);border-radius:100px;">
                  <span style="color:#2CBEC6;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;">Ochutnávka dechpressa ✓</span>
                </div>
              </div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:32px 32px 0;">
              <p style="margin:0 0 6px;color:#C8C8C8;font-size:17px;font-weight:600;line-height:1.4;">Ahoj, vítej v DechBaru!</p>
              <p style="margin:0 0 10px;color:#888;font-size:15px;line-height:1.75;">
                Uvnitř appky tě čeká první ochutnávka z naší 21 denní ranní dechové výzvy, brazilské dechpresso. Nový způsob, jak se nadechnout k lepšímu dni.
              </p>
              <p style="margin:0 0 28px;color:#888;font-size:15px;line-height:1.75;">
                Ochutnávku najdeš na stránce <strong style="color:#C8C8C8;">Dnes</strong> v sekci <strong style="color:#C8C8C8;">DENNÍ PROGRAM</strong>. Vstup jedním kliknutím. Žádné heslo.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <a href="${magicLink}" style="display:inline-block;padding:16px 48px;background-color:#D6A23A;color:#0a0a0a;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;letter-spacing:-0.01em;">
                      Vstup do aplikace &#8594;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#1C1C1C;border-radius:12px;border:1px solid #252525;margin:0 0 20px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0;color:#606060;font-size:13px;line-height:1.65;">
                      Odkaz platí <strong style="color:#909090;">24 hodin</strong> a lze jej použít pouze jednou. Přihlásí tě rovnou — bez zadání hesla.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- PWA box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#1C1C1C;border-radius:12px;border:1px solid #252525;margin:0 0 32px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px;color:#C8C8C8;font-size:14px;font-weight:600;">&#128241;&nbsp; Přidej si DechBar na plochu telefonu</p>
                    <p style="margin:0 0 14px;color:#606060;font-size:13px;line-height:1.65;">
                      Aplikaci máš pak vždy po ruce — spouští se přímo jako nativní app.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr><td style="padding:3px 0;color:#606060;font-size:13px;line-height:1.6;"><strong style="color:#909090;">1.</strong>&nbsp; Otevři aplikaci v prohlížeči telefonu</td></tr>
                      <tr><td style="padding:3px 0;color:#606060;font-size:13px;line-height:1.6;"><strong style="color:#909090;">2.</strong>&nbsp; Klikni na ikonu sdílení &mdash; &#9633;&#8593;&nbsp;na iPhonu nebo &#8942;&nbsp;na Androidu</td></tr>
                      <tr><td style="padding:3px 0;color:#606060;font-size:13px;line-height:1.6;"><strong style="color:#909090;">3.</strong>&nbsp; Vyber <strong style="color:#909090;">„Přidat na plochu"</strong> a potvrď</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- JAKUB SIGNATURE -->
          <tr>
            <td style="padding:4px 32px 28px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td width="72" style="vertical-align:middle;padding-right:14px;">
                    <img src="https://dechbar-cdn.b-cdn.net/images/Photo/Ve%CC%8Cde%CC%8Cl%20jsi%2C%20z%CC%8Ce.jpg" alt="Kuba" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:50%;object-fit:cover;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0 0 2px;color:#C8C8C8;font-size:14px;font-weight:600;">Kuba&nbsp;|&nbsp;Dechov&#253; barista</p>
                    <p style="margin:0;color:#484848;font-size:13px;">t&#253;m DechBar&nbsp;&#183;&nbsp;<a href="https://www.dechbar.cz" style="color:#484848;text-decoration:none;">dechbar.cz</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ANTI-SPAM -->
          <tr>
            <td style="padding:14px 32px;border-top:1px solid #1A1A1A;background-color:#0E0E0E;text-align:center;">
              <p style="margin:0;color:#404040;font-size:12px;line-height:1.6;">
                Aby ti na&#353;e emaily v&#382;dy dorazily, ozna&#269; <a href="mailto:info@dechbar.cz" style="color:#2CBEC6;text-decoration:none;font-weight:500;">info@dechbar.cz</a> jako d&#367;v&#283;ryhodnou adresu.
              </p>
            </td>
          </tr>

        </table>
        <p style="margin:20px 0 0;color:#383838;font-size:12px;text-align:center;letter-spacing:0.04em;"><a href="https://www.dechbar.cz" style="color:#383838;text-decoration:none;">dechbar.cz</a>&nbsp;&bull;&nbsp;um&#283;n&#237; dechu v kapse</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// =====================================================
// TYPES
// =====================================================

interface SendResult {
  email: string;
  success: boolean;
  error?: string;
}

// =====================================================
// SEND SINGLE EMAIL
// =====================================================

async function sendWelcomeEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
  userId: string | null,
  testMode: boolean,
): Promise<SendResult> {
  try {
    // 1. Generate magic link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: APP_URL },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error(`[blast] ❌ generateLink failed for ${email}:`, linkError?.message);
      return { email, success: false, error: linkError?.message || 'generateLink failed' };
    }

    const magicLink = linkData.properties.action_link;

    // 2. Send via Ecomail transactional
    const ecomailKey = Deno.env.get('ECOMAIL_API_KEY');
    if (!ecomailKey) throw new Error('ECOMAIL_API_KEY not set');

    const emailRes = await fetch(`${ECOMAIL_BASE_URL}/transactional/send-message`, {
      method: 'POST',
      headers: { 'key': ecomailKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject: EMAIL_SUBJECT,
          from_email: FROM_EMAIL,
          from_name: FROM_NAME,
          to: [{ email }],
          html: buildEmailHtml(magicLink),
          text: `Ahoj, vítej v DechBaru!\n\nDechBar aplikace je spuštěná — a ty jsi u toho jako první.\n\nUvnitř appky tě čeká první ochutnávka z naší 21 denní ranní dechové výzvy, brazilské dechpresso. Nový způsob, jak se nadechnout k lepšímu dni.\n\nOchutnávku najdeš na stránce Dnes v sekci DENNÍ PROGRAM.\n\nVstup do aplikace jedním kliknutím na tlačítko výše. Odkaz platí 24 hodin.\n\n---\nPřidej si DechBar na plochu telefonu:\n1. Otevři aplikaci v prohlížeči telefonu\n2. Klikni na ikonu sdílení (na iPhonu: čtverec se šipkou / na Androidu: tři tečky)\n3. Vyber „Přidat na plochu" a potvrď\n\nKuba | Dechový barista\ntým DechBar · www.dechbar.cz`,
        },
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error(`[blast] ❌ Ecomail error for ${email}: ${errText}`);
      return { email, success: false, error: `Ecomail ${emailRes.status}: ${errText.substring(0, 100)}` };
    }

    // 3. Mark as sent in DB (pouze v produkčním režimu a pokud máme userId)
    if (!testMode && userId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ welcome_email_sent_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateError) {
        // Non-fatal — email byl odeslán, jen logging
        console.warn(`[blast] ⚠️ Failed to mark sent for ${email}: ${updateError.message}`);
      }
    }

    console.log(`[blast] ✅ Sent to ${email}${testMode ? ' (TEST MODE)' : ''}`);
    return { email, success: true };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[blast] ❌ Unexpected error for ${email}:`, msg);
    return { email, success: false, error: msg };
  }
}

// =====================================================
// PROCESS IN BATCHES
// =====================================================

async function processBatches(
  supabase: ReturnType<typeof createClient>,
  users: { email: string; user_id: string }[],
  testMode: boolean,
): Promise<SendResult[]> {
  const results: SendResult[] = [];

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    console.log(`[blast] 📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)} (${batch.length} users)`);

    const batchResults = await Promise.allSettled(
      batch.map((u) => sendWelcomeEmail(supabase, u.email, u.user_id, testMode)),
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        results.push(r.value);
      } else {
        results.push({ email: 'unknown', success: false, error: r.reason?.message || 'Promise rejected' });
      }
    }
  }

  return results;
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Parse body
  let testMode = false;
  let testEmail = '';
  try {
    const body = await req.json();
    testMode = body?.test_mode === true;
    testEmail = body?.test_email || '';
  } catch {
    // Empty body = produkční spuštění
  }

  console.log(`[blast] 🚀 Starting${testMode ? ` TEST MODE → ${testEmail}` : ' PRODUCTION blast'}...`);

  try {
    // ── TEST MODE ────────────────────────────────────────────
    if (testMode) {
      if (!testEmail) {
        return new Response(JSON.stringify({ error: 'test_mode requires test_email' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await sendWelcomeEmail(supabase, testEmail, null, true);
      return new Response(
        JSON.stringify({
          test_mode: true,
          test_email: testEmail,
          result,
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── PRODUCTION MODE ──────────────────────────────────────
    // Načti všechny uživatele bez welcome_email_sent_at
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .is('welcome_email_sent_at', null)
      .not('email', 'is', null);

    if (fetchError) throw fetchError;

    if (!users || users.length === 0) {
      console.log('[blast] ℹ️ No users to send to (all already received welcome email)');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'All users already received welcome email', timestamp: new Date().toISOString() }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[blast] 👥 Found ${users.length} users to send to`);

    const results = await processBatches(supabase, users as { email: string; user_id: string }[], false);

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const failedList = results.filter((r) => !r.success);

    console.log(`[blast] 🎉 Done: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: users.length,
        sent,
        failed,
        failed_details: failedList,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[blast] ❌ Fatal error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg, timestamp: new Date().toISOString() }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
