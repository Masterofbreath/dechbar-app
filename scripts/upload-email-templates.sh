#!/usr/bin/env bash
# =============================================================================
# DechBar — Upload auth email templates to Supabase via Management API
# =============================================================================
# Nahraje POUZE emailové šablony (nezmění site_url, redirect_urls ani jiné nastavení).
#
# Použití:
#   export SUPABASE_ACCESS_TOKEN="your-pat-here"
#   bash scripts/upload-email-templates.sh
#
# Kde získat PAT:
#   https://supabase.com/dashboard/account/tokens → "Generate new token"
#
# Projekty:
#   DEV  — nrlqzighwaeuxcicuhse (test.dechbar.cz)
#   PROD — iqyahebbteiwzwyrtmns (dechbar.cz)
# =============================================================================

set -euo pipefail

TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  echo "❌  Chybí SUPABASE_ACCESS_TOKEN."
  echo "    Vygeneruj PAT: https://supabase.com/dashboard/account/tokens"
  echo "    Pak spusť:  export SUPABASE_ACCESS_TOKEN='sbp_xxxx' && bash $0"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/../supabase/templates"

API="https://api.supabase.com"

# Načtení šablon do proměnných
CONFIRM_HTML=$(cat "$TEMPLATES_DIR/confirm.html")
MAGIC_LINK_HTML=$(cat "$TEMPLATES_DIR/magic-link.html")
RESET_HTML=$(cat "$TEMPLATES_DIR/reset.html")
CHANGE_EMAIL_HTML=$(cat "$TEMPLATES_DIR/change-email.html")
INVITE_HTML=$(cat "$TEMPLATES_DIR/invite.html")
REAUTH_HTML=$(cat "$TEMPLATES_DIR/reauthentication.html")

push_templates() {
  local REF="$1"
  local ENV_NAME="$2"

  echo ""
  echo "📤  Nahrávám šablony do $ENV_NAME ($REF)..."

  PAYLOAD=$(node -e "
    const fs = require('fs');
    const dir = '$TEMPLATES_DIR';
    const obj = {
      mailer_templates_confirmation_content: fs.readFileSync(dir + '/confirm.html', 'utf8'),
      mailer_templates_confirmation_subject: 'Vítej v DechBaru – Potvrď svůj e-mail',
      mailer_templates_magic_link_content:   fs.readFileSync(dir + '/magic-link.html', 'utf8'),
      mailer_templates_magic_link_subject:   'Přihlásit se do DechBaru',
      mailer_templates_recovery_content:     fs.readFileSync(dir + '/reset.html', 'utf8'),
      mailer_templates_recovery_subject:     'Obnova přístupu – DechBar',
      mailer_templates_invite_content:       fs.readFileSync(dir + '/invite.html', 'utf8'),
      mailer_templates_invite_subject:       'Pozvánka do DechBaru',
      mailer_templates_email_change_content: fs.readFileSync(dir + '/change-email.html', 'utf8'),
      mailer_templates_email_change_subject: 'Potvrď nový e-mail – DechBar',
      mailer_templates_reauthentication_content: fs.readFileSync(dir + '/reauthentication.html', 'utf8'),
      mailer_templates_reauthentication_subject:  'Ověřovací kód – DechBar',
    };
    console.log(JSON.stringify(obj));
  ")

  HTTP_CODE=$(curl -s -o /tmp/supabase_template_response.json -w "%{http_code}" \
    -X PATCH "$API/v1/projects/$REF/config/auth" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "✅  $ENV_NAME — šablony nahrány (HTTP $HTTP_CODE)"
  else
    echo "❌  $ENV_NAME — chyba (HTTP $HTTP_CODE)"
    cat /tmp/supabase_template_response.json
    exit 1
  fi
}

# DEV
push_templates "nrlqzighwaeuxcicuhse" "DEV (test.dechbar.cz)"

# PROD — odkomentuj, až ověříš DEV
push_templates "iqyahebbteiwzwyrtmns" "PROD (dechbar.cz)"

echo ""
echo "🎉  Hotovo! Šablony jsou aktualizované na obou prostředích."
echo "    Ověř na Supabase Dashboard:"
echo "    DEV:  https://supabase.com/dashboard/project/nrlqzighwaeuxcicuhse/auth/templates"
echo "    PROD: https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns/auth/templates"
