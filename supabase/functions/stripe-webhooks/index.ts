/**
 * Supabase Edge Function: Stripe Webhooks Handler
 *
 * Zpracovává Stripe webhook eventy:
 * - checkout.session.completed → one-time purchase → INSERT user_modules + přímý Ecomail sync
 * - customer.subscription.created/updated/deleted → membership tier management
 * - invoice.payment_succeeded/failed → subscription renewal
 *
 * Ecomail fast-path: API voláme přímo (ne přes frontu) → delivery <15s od platby.
 * Fronta (ecomail_sync_queue) slouží jako audit trail a fallback pro CRON.
 *
 * Transakční email: ecomailSendTransactional() → /transactional/send-message → okamžité doručení.
 *
 * @package DechBar
 * @since 2026-02-19
 * @updated 2026-02-22 - Vocative lookup, logo redesign, idempotency, přístup v souhrnu
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getVocative } from '../_shared/vocative.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

// ============================================================
// ECOMAIL: Přímé volání API (fast-path, bypass fronty)
// ============================================================

const ECOMAIL_BASE = 'https://api2.ecomailapp.cz';

// Ecomail list IDs jsou nyní uloženy v modules.ecomail_list_in / ecomail_list_before
// Pro zpětnou kompatibilitu — env fallback pro existující produkty (pokud DB neobsahuje list IDs)
const ECOMAIL_LIST_FALLBACK: Record<string, { in: string; before: string }> = {
  'digitalni-ticho': {
    in:     Deno.env.get('ECOMAIL_LIST_DIGITALNI_TICHO') || '10',
    before: Deno.env.get('ECOMAIL_LIST_DIGITALNI_TICHO_BEFORE') || '11',
  },
};

const ECOMAIL_LIST_UNREG = Deno.env.get('ECOMAIL_LIST_UNREG') || '5';

/**
 * Přihlásí kontakt přímo do Ecomail listu.
 * Volá se synchronně ze stripe-webhooks → delivery <15s od platby.
 */
async function ecomailSubscribe(
  listId: string,
  email: string,
  tags: string[],
  customFields?: Record<string, unknown>,
  triggerAutoresponders = true,
): Promise<void> {
  const apiKey = Deno.env.get('ECOMAIL_API_KEY');
  if (!apiKey) {
    console.warn('⚠️ ECOMAIL_API_KEY not set — skipping direct Ecomail call');
    return;
  }
  const subscriberData: any = { email, tags };
  if (customFields && Object.keys(customFields).length > 0) {
    subscriberData.custom_fields = customFields;
  }
  const resp = await fetch(`${ECOMAIL_BASE}/lists/${listId}/subscribe`, {
    method: 'POST',
    headers: { 'key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscriber_data: subscriberData,
      update_existing: true,
      resubscribe: true,
      trigger_autoresponders: triggerAutoresponders,
      skip_confirmation: true,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Ecomail subscribe to list ${listId} failed: ${err}`);
  }
}

/**
 * Odhlásí kontakt ze seznamu (pro přesun BEFORE → IN).
 * Neblokující — chyba 404 (kontakt není v listu) je OK.
 */
async function ecomailUnsubscribe(listId: string, email: string): Promise<void> {
  const apiKey = Deno.env.get('ECOMAIL_API_KEY');
  if (!apiKey) return;
  const resp = await fetch(`${ECOMAIL_BASE}/lists/${listId}/unsubscribe`, {
    method: 'POST',
    headers: { 'key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!resp.ok && resp.status !== 404) {
    console.warn(`⚠️ Ecomail unsubscribe from ${listId} failed (non-critical): ${resp.status}`);
  }
}

// ============================================================
// ECOMAIL: Transakční email — okamžité potvrzení platby
// Bypass automation engine → delivery <5s od platby
// ============================================================

// CDN assets — centralizováno pro snadnou údržbu
const CDN = {
  logo:    'https://dechbar-cdn.b-cdn.net/images/Logo/DechBar_logo%20(bez%20sloganu)%20-%20desktop_off-white%20-%20600x187.png',
  jakub:   'https://dechbar-cdn.b-cdn.net/images/Photo/Ve%CC%8Cde%CC%8Cl%20jsi%2C%20z%CC%8Ce.jpg',
  ig:      'https://dechbar-cdn.b-cdn.net/images/Icons/Instagram_Glyph_Gradient_optimized_200.png',
  fb:      'https://dechbar-cdn.b-cdn.net/images/Icons/Facebook_Logo_Primary.png',
  yt:      'https://dechbar-cdn.b-cdn.net/images/Icons/yt_icon_red_digital.png',
  spotify: 'https://dechbar-cdn.b-cdn.net/images/Icons/Spotify_Primary_Logo_RGB_Green.png',
};

/**
 * Sestaví HTML tělo potvrzovacího emailu.
 * Design: DechBar brand identity, dark theme, premium Apple style.
 */
function buildPaymentConfirmationHtml(params: {
  greeting: string;
  loginHint: string;
  productName: string;
  productSubtitle: string;
  productBodyText: string;
  priceCzk: number;
  purchaseDate: string;
  ctaUrl: string;
  productAccess: string;
  accessExpiry?: string;
}): string {
  const { greeting, loginHint, productName, productSubtitle, productBodyText, priceCzk, purchaseDate, ctaUrl, productAccess, accessExpiry } = params;

  const accessExpiryRow = accessExpiry
    ? `<tr>
                        <td style="color:#555;font-size:13px;padding-bottom:8px;">Platnost do</td>
                        <td align="right" style="color:#D0D0D0;font-size:13px;font-weight:600;padding-bottom:8px;">${accessExpiry}<br><span style="color:#555;font-size:11px;font-weight:400;">automatické obnovení</span></td>
                      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Potvrzení platby \u2014 ${productName}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0a0a0a;padding:40px 16px 48px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#121212;border-radius:20px;border:1px solid rgba(44,190,198,0.18);max-width:100%;overflow:hidden;">

          <!-- HEADER: Logo vlevo + název produktu + badge -->
          <tr>
            <td style="padding:24px 28px 24px;background:linear-gradient(160deg,#181818 0%,#0d1f21 100%);border-bottom:1px solid rgba(44,190,198,0.1);">
              <!-- Logo vlevo -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
                <tr>
                  <td align="left">
                    <img src="${CDN.logo}" alt="DechBar" width="80" style="display:block;width:80px;height:auto;" />
                  </td>
                </tr>
              </table>
              <!-- Název produktu a subtitle jako dominanta, pak badge -->
              <div style="text-align:center;">
                <h1 style="margin:0 0 4px;color:#F0F0F0;font-size:26px;font-weight:700;letter-spacing:-0.02em;line-height:1.3;">${productName}</h1>
                <p style="margin:0 0 16px;color:#5A8080;font-size:14px;font-weight:500;">${productSubtitle}</p>
                <div style="display:inline-block;padding:5px 14px;background-color:rgba(44,190,198,0.1);border:1px solid rgba(44,190,198,0.28);border-radius:100px;">
                  <span style="color:#2CBEC6;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;">Platba p&#345;ijata &#10003;</span>
                </div>
              </div>
            </td>
          </tr>

          <!-- CONTENT: greeting + body text -->
          <tr>
            <td style="padding:32px 32px 0;">
              <p style="margin:0 0 10px;color:#C8C8C8;font-size:17px;font-weight:600;line-height:1.4;">${greeting}</p>
              <p style="margin:0 0 28px;color:#888;font-size:15px;line-height:1.75;">${productBodyText}</p>

              <!-- Order summary -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#1C1C1C;border-radius:12px;border:1px solid #252525;margin:0 0 24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="color:#555;font-size:13px;padding-bottom:8px;">Produkt</td>
                        <td align="right" style="color:#D0D0D0;font-size:13px;font-weight:600;padding-bottom:8px;">${productName}&nbsp;&mdash;&nbsp;${productSubtitle}</td>
                      </tr>
                      <tr>
                        <td style="color:#555;font-size:13px;padding-bottom:8px;">P&#345;&#237;stup</td>
                        <td align="right" style="color:#D0D0D0;font-size:13px;font-weight:600;padding-bottom:8px;">${productAccess}</td>
                      </tr>
                      ${accessExpiryRow}
                      <tr>
                        <td style="color:#555;font-size:13px;padding-bottom:8px;">&#268;&#225;stka</td>
                        <td align="right" style="color:#D0D0D0;font-size:13px;font-weight:600;padding-bottom:8px;">${priceCzk}&nbsp;K&#269;</td>
                      </tr>
                      <tr>
                        <td style="color:#555;font-size:13px;border-top:1px solid #252525;padding-top:8px;">Datum</td>
                        <td align="right" style="color:#666;font-size:13px;border-top:1px solid #252525;padding-top:8px;">${purchaseDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Login hint — nad CTA, mění se pro nového vs stávajícího uživatele -->
              <p style="margin:0 0 16px;color:#666;font-size:14px;text-align:center;line-height:1.6;">${loginHint}</p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:16px 48px;background-color:#D6A23A;color:#0a0a0a;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;letter-spacing:-0.01em;">
                      Vstoupit do DechBaru&nbsp;&#8594;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Support box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#1C1C1C;border-radius:12px;border:1px solid #252525;margin:0 0 32px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 4px;color:#C8C8C8;font-size:14px;font-weight:600;">M&#225;&#353; ot&#225;zky nebo pot&#345;ebuješ pomoct?</p>
                    <p style="margin:0;color:#606060;font-size:13px;line-height:1.65;">
                      Napi&#353; n&#225;m na <a href="mailto:info@dechbar.cz" style="color:#2CBEC6;text-decoration:none;font-weight:500;">info@dechbar.cz</a> a r&#225;di ti odpov&#237;me.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- JAKUB signature row -->
          <tr>
            <td style="padding:4px 32px 28px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td width="72" style="vertical-align:middle;padding-right:14px;">
                    <img src="${CDN.jakub}" alt="Kuba" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:50%;object-fit:cover;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0 0 2px;color:#C8C8C8;font-size:14px;font-weight:600;">Kuba&nbsp;|&nbsp;Dechov&#253; barista</p>
                    <p style="margin:0;color:#484848;font-size:13px;">t&#253;m DechBar&nbsp;&#183;&nbsp;<a href="https://www.dechbar.cz" style="color:#484848;text-decoration:none;">dechbar.cz</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ANTI-SPAM notice -->
          <tr>
            <td style="padding:14px 32px;border-top:1px solid #1A1A1A;background-color:#0E0E0E;text-align:center;">
              <p style="margin:0;color:#404040;font-size:12px;line-height:1.6;">
                Aby ti na&#353;e emaily v&#382;dy dorazily, ozna&#269; <a href="mailto:info@dechbar.cz" style="color:#2CBEC6;text-decoration:none;font-weight:500;">info@dechbar.cz</a> jako d&#367;v&#283;ryhodnou adresu.
              </p>
            </td>
          </tr>

          <!-- SOCIAL icons -->
          <tr>
            <td style="padding:18px 32px 24px;background-color:#0E0E0E;text-align:center;">
              <a href="https://www.instagram.com/jakub_rozdycha_cesko/" style="display:inline-block;margin:0 5px;text-decoration:none;">
                <img src="${CDN.ig}" alt="Instagram" width="28" height="28" style="display:block;width:28px;height:28px;" />
              </a>
              <a href="https://www.facebook.com/jakubrozdychacesko" style="display:inline-block;margin:0 5px;text-decoration:none;">
                <img src="${CDN.fb}" alt="Facebook" width="28" height="28" style="display:block;width:28px;height:28px;" />
              </a>
              <a href="https://www.youtube.com/@jakubrozdychacesko" style="display:inline-block;margin:0 5px;text-decoration:none;">
                <img src="${CDN.yt}" alt="YouTube" width="28" height="28" style="display:block;width:28px;height:28px;" />
              </a>
              <a href="https://open.spotify.com/user/315ibv3qjti2jitj4cbh76pysqd4?si=3a8989d3e309401b" style="display:inline-block;margin:0 5px;text-decoration:none;">
                <img src="${CDN.spotify}" alt="Spotify" width="28" height="28" style="display:block;width:28px;height:28px;" />
              </a>
            </td>
          </tr>

        </table>
        <p style="margin:20px 0 0;color:#383838;font-size:12px;text-align:center;letter-spacing:0.04em;">dechbar.cz&nbsp;&bull;&nbsp;um&#283;n&#237; dechu v kapse</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Odešle okamžitý transakční potvrzovací email přes Ecomail /transactional/send-message.
 * Nezávislý na automation engine → delivery <5s od platby.
 * Non-critical: chyba neblokuje platební flow.
 */
async function ecomailSendTransactional(params: {
  email: string;
  recipientName?: string | null;
  productName: string;
  productSubtitle: string;
  productBodyText: string;
  priceCzk: number;
  magicLinkUrl?: string | null;
  productAccess: string;
  accessExpiry?: string;
  isNewUser: boolean;
  isTrial?: boolean; // true = uvítací email při startu trialu, false = potvrzení platby
}): Promise<void> {
  const apiKey = Deno.env.get('ECOMAIL_API_KEY');
  if (!apiKey) {
    console.warn('⚠️ ECOMAIL_API_KEY not set — skipping transactional email');
    return;
  }

  const { email, recipientName, productName, productSubtitle, productBodyText, priceCzk, magicLinkUrl, productAccess, accessExpiry, isNewUser, isTrial } = params;
  const firstName = recipientName ? recipientName.trim().split(/\s+/)[0] : null;
  // Vocative lookup — pokud jméno není v tabulce, fallback bez oslovení jménem
  const vocative = firstName ? getVocative(firstName) : null;

  // Pozdrav podle kontextu: trial start vs reálná platba
  const greeting = isTrial
    ? (vocative
      ? `Ahoj ${vocative}! Zkušební přístup je aktivní. Máš 3 dny zdarma.`
      : 'Ahoj! Zkušební přístup je aktivní. Máš 3 dny zdarma.')
    : (vocative
      ? `Ahoj ${vocative}! Děkujeme za důvěru. Platba proběhla úspěšně a přístup máš aktivní.`
      : 'Ahoj! Děkujeme za důvěru. Platba proběhla úspěšně a přístup máš aktivní.');

  // Subject emailu
  const emailSubject = isTrial ? 'Tvůj zkušební přístup do DechBar je aktivní' : 'Potvrzujeme tvoji platbu';

  // Login hint nad CTA — různý text pro nového vs stávajícího uživatele
  const loginHint = isNewUser
    ? 'Vytvořili jsme ti účet. Přihlásíš se jedním kliknutím níže.'
    : 'Přihlásíš se jedním kliknutím níže.';

  const ctaUrl = magicLinkUrl || 'https://www.dechbar.cz';
  const purchaseDate = new Date().toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const html = buildPaymentConfirmationHtml({
    greeting, loginHint, productName, productSubtitle, productBodyText, priceCzk, purchaseDate, ctaUrl,
    productAccess, accessExpiry,
  });

  const plainBodyText = productBodyText.replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '').replace(/&#[0-9]+;/g, '');
  const accessExpiryLine = accessExpiry ? `\nPlatnost do: ${accessExpiry} (automatické obnovení)` : '';
  const text = [
    greeting,
    '',
    plainBodyText,
    '',
    `Produkt: ${productName} - ${productSubtitle}`,
    `Přístup: ${productAccess}${accessExpiryLine}`,
    `Částka: ${priceCzk} Kč`,
    `Datum: ${purchaseDate}`,
    '',
    loginHint,
    `Vstoupit do DechBaru: ${ctaUrl}`,
    '',
    '---',
    'Máš otázky nebo potřebuješ pomoct?',
    'Napiš nám na info@dechbar.cz a rádi ti odpovíme.',
    '',
    'Kuba | Dechový barista',
    'tým DechBar · dechbar.cz',
    '',
    'Aby ti naše emaily vždy dorazily, označ info@dechbar.cz jako důvěryhodnou adresu.',
  ].join('\n');

  const resp = await fetch(`${ECOMAIL_BASE}/transactional/send-message`, {
    method: 'POST',
    headers: { 'key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: emailSubject,
        from_name: 'Jakub z DechBaru',
        from_email: 'info@dechbar.cz',
        reply_to: 'info@dechbar.cz',
        html,
        text,
        to: [{ email, name: recipientName || '' }],
        options: { click_tracking: false, open_tracking: true },
      },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Ecomail transactional send failed (${resp.status}): ${err}`);
  }

  const result = await resp.json();
  console.log(`✅ Transakční email odeslán → ${email}`, result?.results);
}

// ============================================================
// PRODUCT CONFIG: per-product name, subtitle, body text
// Subtitle + bodyText se zobrazují v transakčním emailu.
// ============================================================

const PRODUCT_CONFIG: Record<string, {
  name: string;
  subtitle: string;
  bodyText: string;
  access: string;
  paymentType: 'one_time' | 'monthly' | 'annual';
  deepLinkPath: string;
}> = {
  'digitalni-ticho': {
    name: 'Program REŽIM',
    subtitle: 'Digitální ticho',
    bodyText: 'Vítej v Digitálním tichu! Během 21 dní tě provedu tréninkem odpočinku, který ti vrátí energii, soustředění a čistou mysl. I v tom největším chaosu. Vše, co potřebuješ, na tebe čeká v DechBaru.',
    access: 'Navždy',
    paymentType: 'one_time',
    deepLinkPath: '/app?welcome=true&module=digitalni-ticho',
  },
  'membership-smart': {
    name: 'DechBar SMART',
    subtitle: 'Prémiové členství',
    bodyText: 'Vítej v DechBar SMART! Máš otevřené dveře k prémiovému obsahu, živým sekcím a osobní podpoře. Vše na tebe čeká.',
    access: 'Předplatné (automatické obnovení)',
    paymentType: 'monthly',
    deepLinkPath: '/app?welcome=true&module=membership-smart',
  },
  'membership-ai-coach': {
    name: 'DechBar AI Coach',
    subtitle: 'AI dechový koučink',
    bodyText: 'Vítej v DechBar AI Coach! Tvůj osobní AI kouč je připravený. Trénuj kdykoliv, kdekoliv, svým vlastním tempem. Otevři DechBar a začni.',
    access: 'Měsíční předplatné',
    paymentType: 'monthly',
    deepLinkPath: '/app?welcome=true&module=membership-ai-coach',
  },
};

function getProductConfig(moduleId: string): {
  name: string;
  subtitle: string;
  bodyText: string;
  access: string;
  paymentType: 'one_time' | 'monthly' | 'annual';
  deepLinkPath: string;
} {
  const key = moduleId === 'smart' ? 'membership-smart' : moduleId;
  return PRODUCT_CONFIG[key] ?? PRODUCT_CONFIG[moduleId] ?? {
    name: moduleId,
    subtitle: 'DechBar program',
    bodyText: 'Tvoje platba proběhla úspěšně. Vše na tebe čeká v DechBaru.',
    access: 'Navždy',
    paymentType: 'one_time',
    deepLinkPath: '/app?welcome=true',
  };
}

/**
 * Načte modul z DB podle stripe_price_id.
 * Pokud není v DB, zkusí fallback pro subscription produkty (membership).
 * One-time produkty nově vytvořené přes admin panel budou automaticky v DB.
 */
async function getModuleFromPriceId(
  supabase: any,
  priceId: string,
): Promise<{
  module_id: string;
  plan?: 'SMART' | 'AI_COACH';
  interval?: 'monthly' | 'annual';
  payment_type: 'one_time' | 'subscription';
  ecomail_list_in?: string | null;
  ecomail_list_before?: string | null;
} | null> {
  // 1. Zkus DB lookup (platí pro all-time produkty vytvořené přes admin panel)
  const { data: moduleRow, error } = await supabase
    .from('modules')
    .select('id, ecomail_list_in, ecomail_list_before, price_type')
    .eq('stripe_price_id', priceId)
    .maybeSingle();

  if (!error && moduleRow) {
    return {
      module_id: moduleRow.id,
      payment_type: moduleRow.price_type === 'lifetime' ? 'one_time' : 'subscription',
      ecomail_list_in: moduleRow.ecomail_list_in,
      ecomail_list_before: moduleRow.ecomail_list_before,
    };
  }

  // 2. Fallback: hardcoded subscription price IDs (membership produkty nemají stripe_price_id v modules)
  const subscriptionPriceMap: Record<string, {
    module_id: string;
    plan: 'SMART' | 'AI_COACH';
    interval: 'monthly' | 'annual';
    payment_type: 'subscription';
  }> = {
    // ── Subscriptions (SMART Membership) ──────────────────────
    // acct_1S3eJ5K0OYr7u1q9 — prod_U0SzbyNG0vrzZ0
    'price_1T2S3eK0OYr7u1q9W5ZW042C': {
      module_id: 'membership-smart', plan: 'SMART', interval: 'monthly', payment_type: 'subscription',
    },
    'price_1T2S3dK0OYr7u1q9bwA0cNS8': {
      module_id: 'membership-smart', plan: 'SMART', interval: 'annual', payment_type: 'subscription',
    },
    // ── Subscriptions (AI COACH Membership) ── coming soon ────
    'price_1SraIaK7en1dcW6HsYyN0Aj9': {
      module_id: 'membership-ai-coach', plan: 'AI_COACH', interval: 'annual', payment_type: 'subscription',
    },
  };

  const subscriptionEntry = subscriptionPriceMap[priceId];
  if (subscriptionEntry) return subscriptionEntry;

  console.warn(`⚠️ getModuleFromPriceId: price ${priceId} not found in DB or fallback map`);
  return null;
}

// ============================================================
// HELPER: Debug log to DB (pro diagnostiku)
// ============================================================

async function dbLog(
  supabase: any,
  step: string,
  message: string,
  data?: Record<string, unknown>,
  eventId?: string,
  eventType?: string,
  errorMessage?: string,
) {
  try {
    await supabase.from('webhook_debug_logs').insert({
      event_id: eventId,
      event_type: eventType,
      step,
      message,
      data: data ?? null,
      error_message: errorMessage ?? null,
    });
  } catch {
    // Logging failure nesmí zastavit zpracování
  }
}

// ============================================================
// HELPER: Audit log do Ecomail sync fronty (bez fire-and-forget)
// Fronta slouží jako audit trail a CRON fallback — NE jako primární delivery.
// Primární delivery = přímé volání ecomailSubscribe() výše.
// ============================================================

async function auditEcomailQueue(
  supabase: any,
  userId: string | null,
  email: string,
  eventType: string,
  payload: Record<string, unknown>,
) {
  try {
    await supabase.from('ecomail_sync_queue').insert({
      user_id: userId,
      email,
      event_type: eventType,
      payload,
      status: 'completed', // Označíme jako completed — přímé volání již proběhlo
    });
  } catch (err) {
    // Audit selhání nesmí zastavit zpracování
    console.warn('⚠️ Ecomail audit queue insert failed (non-critical):', err);
  }
}

// ============================================================
// HELPER: Grant module access to user
// ============================================================

async function grantModuleAccess(
  supabase: any,
  userId: string,
  moduleId: string,
  sessionId: string,
) {
  const { error } = await supabase.from('user_modules').upsert(
    {
      user_id: userId,
      module_id: moduleId,
      purchased_at: new Date().toISOString(),
      purchase_type: 'lifetime',
      subscription_status: null,
      current_period_end: null,
      payment_id: sessionId,
      payment_provider: 'stripe',
      stripe_session_id: sessionId,
    },
    { onConflict: 'user_id,module_id' },
  );

  if (error) {
    console.error(`❌ Failed to grant module access: ${moduleId} → user ${userId}`, error);
    throw error;
  }

  console.log(`✅ Module access granted: ${moduleId} → user ${userId}`);
}

// ============================================================
// HELPER: Find user by email (handles pagination)
// ============================================================

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    // constructEventAsync je nutný v Deno/Edge Runtime (SubtleCrypto = async Web Crypto API)
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log(`🔔 Webhook: ${event.type} | ${event.id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await dbLog(supabase, 'received', `Webhook received: ${event.type}`, {
      event_type: event.type,
      api_version: event.api_version,
    }, event.id, event.type);

    // ──────────────────────────────────────────────────────────
    // CHECKOUT SESSION COMPLETED
    // ──────────────────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      // Idempotency: pokud jsme tento event již zpracovali (guest_done nebo auth_email_sent),
      // vrátíme 200 ale nepošleme duplikát. Chrání před Stripe retries a frontend duplicitami.
      const { data: alreadyProcessed } = await supabase
        .from('webhook_debug_logs')
        .select('id')
        .eq('event_id', event.id)
        .in('step', ['guest_done', 'auth_email_sent'])
        .maybeSingle();

      if (alreadyProcessed) {
        console.log(`⏭️ Event ${event.id} already processed — skipping duplicate`);
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          headers: { 'Content-Type': 'application/json' }, status: 200,
        });
      }

      const session = event.data.object as Stripe.Checkout.Session;

      const isGuest = session.metadata?.is_guest === 'true';
      // Email: pro guesta preferujeme metadata.email (vědomě zadaný v EmailInputModal),
      // aby Apple Pay / Google Pay email nepřepsal registrační email.
      // Pro přihlášeného uživatele preferujeme customer_details (Stripe ho ověřil).
      const email = isGuest
        ? (session.metadata?.email || session.customer_details?.email)
        : (session.customer_details?.email ?? session.metadata?.email);
      const moduleId = session.metadata?.module_id;
      const stripeCustomerId = session.customer as string;

      await dbLog(supabase, 'session_parsed', 'Session metadata parsed', {
        session_id: session.id,
        session_status: session.status,
        payment_status: session.payment_status,
        is_guest: isGuest,
        email,
        module_id: moduleId,
        customer_id: stripeCustomerId,
        metadata: session.metadata,
        customer_details: session.customer_details,
      }, event.id, event.type);

      if (!email || !moduleId) {
        console.error('❌ Missing email or module_id in session metadata');
        await dbLog(supabase, 'error', 'Missing email or module_id', {
          email,
          module_id: moduleId,
        }, event.id, event.type, 'Missing email or module_id in session metadata');
        return new Response('Missing metadata', { status: 400 });
      }

      // Určení payment type z price
      let priceId: string | undefined;
      let lineItemAmount: number | undefined;
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        priceId = lineItems.data[0]?.price?.id;
        lineItemAmount = lineItems.data[0]?.amount_total ?? undefined;
        await dbLog(supabase, 'line_items', 'Line items fetched', {
          price_id: priceId,
          amount: lineItemAmount,
        }, event.id, event.type);
      } catch (lineItemsErr: any) {
        console.warn(`⚠️ Could not fetch line items (synthetic event?): ${lineItemsErr.message}`);
        await dbLog(supabase, 'line_items_warn', 'Could not fetch line items', {}, event.id, event.type, lineItemsErr.message);
      }
      const moduleInfo = priceId ? await getModuleFromPriceId(supabase, priceId) : null;
      const isOneTime = session.mode === 'payment' || moduleInfo?.payment_type === 'one_time';

      console.log(`✅ Checkout completed — guest: ${isGuest}, module: ${moduleId}, one_time: ${isOneTime}, price: ${priceId}`);

      // ── GUEST CHECKOUT: vytvoř Supabase uživatele via DB RPC ────────────
      // POZOR: admin.createUser() selhává kvůli trigger chain v Supabase Auth HTTP API
      // Používáme přímou DB funkci create_user_for_purchase (SQL INSERT do auth.users)
      if (isGuest) {
        try {
          await dbLog(supabase, 'guest_start', 'Starting guest user flow', { email, module_id: moduleId }, event.id, event.type);

          const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_for_purchase', {
            p_email: email,
            p_module_id: moduleId,
            p_session_id: session.id,
            p_stripe_customer_id: stripeCustomerId ?? null,
          });

          if (rpcError) {
            await dbLog(supabase, 'rpc_error', 'create_user_for_purchase RPC failed', { email }, event.id, event.type, rpcError.message);
            throw rpcError;
          }

          if (rpcResult?.error) {
            await dbLog(supabase, 'rpc_db_error', 'DB function returned error', { email }, event.id, event.type, rpcResult.error);
            throw new Error(rpcResult.error);
          }

          const userId: string = rpcResult.user_id;
          const isNew: boolean = rpcResult.is_new;
          console.log(`✅ User ready: ${userId} (new: ${isNew})`);
          await dbLog(supabase, 'user_ready', isNew ? 'New user + module access created' : 'Existing user, module access granted', {
            user_id: userId, is_new: isNew, module_id: moduleId,
          }, event.id, event.type);

          // Magic link pro přihlášení uživatele — URL zachytíme a předáme do emailu
          const appUrl = Deno.env.get('APP_BASE_URL') || 'https://www.dechbar.cz';
          const guestProductConfig = getProductConfig(moduleId);
          const deepLinkTarget = `${appUrl}${guestProductConfig.deepLinkPath}`;
          let magicLinkUrl: string | null = null;
          const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: {
              redirectTo: deepLinkTarget,
            },
          });
          if (magicLinkError) {
            console.warn(`⚠️ Magic link failed (non-critical): ${magicLinkError.message}`);
            await dbLog(supabase, 'magic_link_warn', 'Magic link failed (non-critical)', {}, event.id, event.type, magicLinkError.message);
          } else {
            magicLinkUrl = magicLinkData?.properties?.action_link ?? null;
            console.log(`✅ Magic link generated for: ${email}`);
            await dbLog(supabase, 'magic_link_ready', 'Magic link generated', { email }, event.id, event.type);
          }

          // Ecomail fast-path: přímé volání API → delivery <15s od platby
          // 1. Přidej do IN listu produktu (spustí uvítací autoresponder)
          // 2. Odeber z BEFORE listu (pokud tam byl — abandoned cart cleanup)
          // 3. Odeber z UNREG (obecný cleanup)
          const moduleTag = `PRODUCT_${moduleId.toUpperCase().replace(/-/g, '_')}`;
          const purchaseDate = new Date().toISOString().split('T')[0];
          // Ecomail list IDs: prioritně z DB (moduleInfo), fallback na env/hardcoded
          const productListsFallback = ECOMAIL_LIST_FALLBACK[moduleId];
          const inListId = moduleInfo?.ecomail_list_in ?? productListsFallback?.in ?? ECOMAIL_LIST_UNREG;
          const beforeListId = moduleInfo?.ecomail_list_before ?? productListsFallback?.before ?? null;

          try {
            await ecomailSubscribe(
              inListId,
              email,
              ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER', 'MAGIC_LINK_SENT'],
              { PURCHASE_DATE: purchaseDate, PRODUCT_ID: moduleId, PRICE_CZK: lineItemAmount ? lineItemAmount / 100 : 990 },
              true, // trigger_autoresponders → spustí uvítací sekvenci
            );
            console.log(`✅ Ecomail: ${email} přidán do IN listu ${inListId}`);

            // Odeber z BEFORE listu (abandoned cart) — fire-and-forget, non-critical
            if (beforeListId) {
              ecomailUnsubscribe(beforeListId, email).catch(() => {});
            }
            // Odeber z UNREG — fire-and-forget, non-critical
            ecomailUnsubscribe(ECOMAIL_LIST_UNREG, email).catch(() => {});

            // Audit záznam
            await auditEcomailQueue(supabase, userId, email, 'list_move', {
              from_list_name: 'UNREG', to_list_name: moduleId === 'digitalni-ticho' ? 'DIGITALNI_TICHO' : 'PREMIUM',
              tags: ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER', 'MAGIC_LINK_SENT'],
            });
          } catch (ecomailErr: any) {
            console.error('❌ Ecomail fast-path failed:', ecomailErr.message);
            // Fallback: vložit do fronty jako pending → CRON doručí do 5 minut
            try {
              await supabase.from('ecomail_sync_queue').insert({
                user_id: userId, email, event_type: 'list_move', status: 'pending',
                payload: {
                  from_list_name: 'UNREG', to_list_name: moduleId === 'digitalni-ticho' ? 'DIGITALNI_TICHO' : 'PREMIUM',
                  contact: { email, custom_fields: { PURCHASE_DATE: purchaseDate, PRODUCT_ID: moduleId } },
                  tags: ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER'],
                },
              });
            } catch { /* non-critical */ }
          }

          // Transakční potvrzovací email — okamžité doručení (<5s), bypass automation engine
          ecomailSendTransactional({
            email,
            recipientName: session.customer_details?.name,
            productName: guestProductConfig.name,
            productSubtitle: guestProductConfig.subtitle,
            productBodyText: guestProductConfig.bodyText,
            priceCzk: lineItemAmount ? lineItemAmount / 100 : 990,
            magicLinkUrl,
            productAccess: guestProductConfig.access,
            isNewUser: isNew,
            isTrial: !isOneTime,
          }).catch((err: any) => console.error('⚠️ Transakční email selhal (non-critical):', err.message));

          // guest_done krok slouží jako idempotency token — zabraňuje duplicitnímu zpracování
          await dbLog(supabase, 'guest_done', 'Guest flow completed successfully', { user_id: userId }, event.id, event.type);

        } catch (err: any) {
          console.error('❌ Guest registration failed:', err);
          await dbLog(supabase, 'guest_error', 'Guest registration FAILED', {}, event.id, event.type, err.message ?? String(err));
          // Neházet — platba proběhla, Stripe bude opakovat webhook
        }
      }

      // ── AUTHENTICATED USER: přiřaď modul ────────────────────
      if (!isGuest) {
        const userId = session.metadata?.user_id;
        if (!userId || userId === 'guest') {
          console.error('❌ No valid user_id for authenticated checkout');
          await dbLog(supabase, 'auth_error', 'No valid user_id for authenticated checkout', { user_id: userId }, event.id, event.type);
        } else if (isOneTime) {
          await grantModuleAccess(supabase, userId, moduleId, session.id);

          // Ecomail fast-path pro přihlášeného uživatele
          const moduleTag = `PRODUCT_${moduleId.toUpperCase().replace(/-/g, '_')}`;
          const purchaseDate = new Date().toISOString().split('T')[0];
          // Ecomail list IDs: prioritně z DB (moduleInfo), fallback na env/hardcoded
          const productListsFallbackAuth = ECOMAIL_LIST_FALLBACK[moduleId];
          const inListId = moduleInfo?.ecomail_list_in ?? productListsFallbackAuth?.in ?? ECOMAIL_LIST_UNREG;
          const beforeListId = moduleInfo?.ecomail_list_before ?? productListsFallbackAuth?.before ?? null;

          try {
            await ecomailSubscribe(
              inListId,
              email,
              ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER'],
              { PURCHASE_DATE: purchaseDate, PRODUCT_ID: moduleId, PRICE_CZK: lineItemAmount ? lineItemAmount / 100 : 990 },
              true,
            );
            if (beforeListId) ecomailUnsubscribe(beforeListId, email).catch(() => {});
            ecomailUnsubscribe(ECOMAIL_LIST_UNREG, email).catch(() => {});
            await auditEcomailQueue(supabase, userId, email, 'contact_add', {
              list_name: moduleId === 'digitalni-ticho' ? 'DIGITALNI_TICHO' : 'PREMIUM',
              tags: ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER'],
            });
          } catch (ecomailErr: any) {
            console.error('❌ Ecomail fast-path (auth user) failed:', ecomailErr.message);
            try {
              await supabase.from('ecomail_sync_queue').insert({
                user_id: userId, email, event_type: 'contact_add', status: 'pending',
                payload: {
                  list_name: moduleId === 'digitalni-ticho' ? 'DIGITALNI_TICHO' : 'PREMIUM',
                  contact: { email, custom_fields: { PURCHASE_DATE: purchaseDate, PRODUCT_ID: moduleId } },
                  tags: ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER'],
                },
              });
            } catch { /* non-critical */ }
          }

          // Transakční potvrzovací email — okamžité doručení (<5s)
          const authProductConfig = getProductConfig(moduleId);
          const authAppUrl = Deno.env.get('APP_BASE_URL') || 'https://www.dechbar.cz';
          const authDeepLinkTarget = `${authAppUrl}${authProductConfig.deepLinkPath}`;
          let authMagicLinkUrl: string | null = null;
          const { data: authMagicData, error: authMagicErr } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: { redirectTo: authDeepLinkTarget },
          });
          if (authMagicErr) {
            console.warn(`⚠️ Auth magic link failed (non-critical): ${authMagicErr.message}`);
          } else {
            authMagicLinkUrl = authMagicData?.properties?.action_link ?? null;
          }

          ecomailSendTransactional({
            email,
            recipientName: session.customer_details?.name,
            productName: authProductConfig.name,
            productSubtitle: authProductConfig.subtitle,
            productBodyText: authProductConfig.bodyText,
            priceCzk: lineItemAmount ? lineItemAmount / 100 : 990,
            magicLinkUrl: authMagicLinkUrl,
            productAccess: authProductConfig.access,
            isNewUser: false,
            isTrial: !isOneTime,
          }).catch((err: any) => console.error('⚠️ Transakční email selhal (non-critical):', err.message));

          // auth_email_sent krok slouží jako idempotency token
          await dbLog(supabase, 'auth_email_sent', 'Auth user email sent', { user_id: userId, module_id: moduleId }, event.id, event.type);
        }
      }
    }

    // ──────────────────────────────────────────────────────────
    // SUBSCRIPTION CREATED
    // ──────────────────────────────────────────────────────────
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const moduleInfo = await getModuleFromPriceId(supabase, priceId);

      if (!moduleInfo || moduleInfo.payment_type !== 'subscription') {
        console.log(`ℹ️ Skipping subscription.created for price ${priceId} (not a subscription or unknown)`);
        return new Response(JSON.stringify({ received: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let userId: string | null = subscription.metadata?.user_id ?? null;
      if (userId === 'guest' || !userId) {
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const email = (customer as Stripe.Customer).email;
        if (!email) {
          console.error('❌ Guest subscription: no email on Stripe customer');
          return new Response('No email for guest', { status: 400 });
        }
        const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
        userId = profile?.id ?? null;
        if (!userId) {
          console.warn(`⚠️ Guest subscription: no Supabase user for ${email} (checkout.session.completed may run later)`);
          return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
        }
        console.log(`✅ Guest subscription: resolved user ${userId} by email ${email}`);
      }

      await supabase
        .from('memberships')
        .update({
          plan: moduleInfo.plan,
          billing_interval: moduleInfo.interval,
          status: 'active',
          type: 'subscription',
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          purchased_at: new Date(subscription.start_date * 1000).toISOString(),
          expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('user_id', userId);

      console.log(`✅ Subscription created: ${moduleInfo.plan} (${moduleInfo.interval}) → user ${userId}`);
    }

    // ──────────────────────────────────────────────────────────
    // SUBSCRIPTION UPDATED
    // ──────────────────────────────────────────────────────────
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const moduleInfo = await getModuleFromPriceId(supabase, priceId);

      let status: 'active' | 'cancelled' | 'past_due' | 'expired' = 'active';
      if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
        status = 'cancelled';
      } else if (subscription.status === 'past_due') {
        status = 'past_due';
      } else if (subscription.status === 'unpaid' || subscription.status === 'incomplete_expired') {
        status = 'expired';
      }

      await supabase
        .from('memberships')
        .update({
          plan: moduleInfo?.plan ?? 'ZDARMA',
          billing_interval: moduleInfo?.interval ?? null,
          status,
          stripe_price_id: priceId,
          expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        })
        .eq('stripe_subscription_id', subscription.id);

      console.log(`✅ Subscription updated: ${subscription.id} (${status})`);
    }

    // ──────────────────────────────────────────────────────────
    // SUBSCRIPTION DELETED
    // ──────────────────────────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      await supabase
        .from('memberships')
        .update({
          plan: 'ZDARMA',
          billing_interval: null,
          status: 'expired',
          expires_at: new Date().toISOString(),
          cancelled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      console.log(`✅ Subscription deleted: ${subscription.id} → downgraded to ZDARMA`);
    }

    // ──────────────────────────────────────────────────────────
    // INVOICE PAYMENT SUCCEEDED (Renewal)
    // ──────────────────────────────────────────────────────────
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await supabase
          .from('memberships')
          .update({
            status: 'active',
            expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        console.log(`✅ Invoice paid: ${subscriptionId}`);

        // ── Potvrzovací email po první reálné platbě (po trialu) ────────────
        // billing_reason === 'subscription_cycle' = automatická obnova/první platba po trialu
        // billing_reason === 'subscription_create' = první faktura při startu (trial = $0, přeskočit)
        const billingReason = invoice.billing_reason;
        const isTrialConversion = billingReason === 'subscription_cycle';

        if (isTrialConversion) {
          try {
            const customer = await stripe.customers.retrieve(subscription.customer as string);
            const email = (customer as Stripe.Customer).email;
            const recipientName = (customer as Stripe.Customer).name;

            if (email) {
              const priceId = subscription.items.data[0].price.id;
              const moduleInfo = await getModuleFromPriceId(supabase, priceId);
              const productConfig = getProductConfig(moduleInfo?.id ?? 'smart');

              const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://www.dechbar.cz';
              const deepLinkTarget = `${appBaseUrl}${productConfig.deepLinkPath}`;
              let magicLinkUrl: string | null = null;
              const { data: magicData, error: magicErr } = await supabase.auth.admin.generateLink({
                type: 'magiclink',
                email,
                options: { redirectTo: deepLinkTarget },
              });
              if (magicErr) {
                console.warn(`⚠️ Magic link failed for invoice email: ${magicErr.message}`);
              } else {
                magicLinkUrl = magicData?.properties?.action_link ?? null;
              }

              const priceCzk = invoice.amount_paid ? invoice.amount_paid / 100 : 249;
              const nextPeriodEnd = new Date(subscription.current_period_end * 1000)
                .toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });

              await ecomailSendTransactional({
                email,
                recipientName,
                productName: productConfig.name,
                productSubtitle: productConfig.subtitle,
                productBodyText: productConfig.bodyText,
                priceCzk,
                magicLinkUrl,
                productAccess: productConfig.access,
                accessExpiry: nextPeriodEnd,
                isNewUser: false,
              });

              console.log(`📧 Potvrzovací email po trialu odeslán: ${email}`);
            }
          } catch (emailErr: any) {
            // Non-critical — platba proběhla, email je bonus
            console.warn(`⚠️ Invoice email selhal (non-critical): ${emailErr.message}`);
          }
        }
      }
    }

    // ──────────────────────────────────────────────────────────
    // INVOICE PAYMENT FAILED
    // ──────────────────────────────────────────────────────────
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        await supabase
          .from('memberships')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId);

        console.log(`⚠️ Invoice failed: ${subscriptionId} → past_due`);
      }
    }

    return new Response(
      JSON.stringify({ received: true, event: event.type }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 },
    );

  } catch (err: any) {
    console.error('❌ Webhook error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
