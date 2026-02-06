#!/bin/bash

# =====================================================
# ECOMAIL EDGE FUNCTIONS - Deploy Script
# Created: 2026-01-28
# Purpose: Deploy all Ecomail-related Edge Functions to Supabase DEV
# =====================================================

set -e  # Exit on error

PROJECT_REF="nrlqzighwaeuxcicuhse"
SUPABASE_URL="https://nrlqzighwaeuxcicuhse.supabase.co"

echo "🚀 Deploying Ecomail Edge Functions..."
echo "Project: $PROJECT_REF"
echo ""

# Change to project directory
cd /Users/DechBar/dechbar-app

# =====================================================
# 1. LOGIN TO SUPABASE
# =====================================================

echo "📝 Step 1: Login to Supabase CLI..."
supabase login

echo ""

# =====================================================
# 2. LINK PROJECT
# =====================================================

echo "🔗 Step 2: Linking project..."
supabase link --project-ref $PROJECT_REF

echo ""

# =====================================================
# 3. DEPLOY EDGE FUNCTIONS
# =====================================================

echo "📦 Step 3: Deploying Edge Functions..."
echo ""

echo "  [1/3] sync-to-ecomail..."
supabase functions deploy sync-to-ecomail --project-ref $PROJECT_REF
echo "  ✅ sync-to-ecomail deployed"
echo ""

echo "  [2/3] ecomail-webhook-handler..."
supabase functions deploy ecomail-webhook-handler --project-ref $PROJECT_REF
echo "  ✅ ecomail-webhook-handler deployed"
echo ""

echo "  [3/3] batch-sync-engagement..."
supabase functions deploy batch-sync-engagement --project-ref $PROJECT_REF
echo "  ✅ batch-sync-engagement deployed"
echo ""

# =====================================================
# 4. VERIFY DEPLOYMENT
# =====================================================

echo "🔍 Step 4: Verifying deployment..."
supabase functions list --project-ref $PROJECT_REF

echo ""

# =====================================================
# 5. CONFIGURE SECRETS
# =====================================================

echo "🔐 Step 5: Configuring Supabase Secrets..."
echo ""

echo "  Setting ECOMAIL_API_KEY..."
supabase secrets set ECOMAIL_API_KEY="f21989cee8af4357bf3859e17a7bbb46b7eca7272050d7711a7afc9a09068c59" --project-ref $PROJECT_REF

echo "  Setting ECOMAIL_LIST_UNREG..."
supabase secrets set ECOMAIL_LIST_UNREG="5" --project-ref $PROJECT_REF

echo "  Setting ECOMAIL_LIST_REG..."
supabase secrets set ECOMAIL_LIST_REG="6" --project-ref $PROJECT_REF

echo "  Setting ECOMAIL_LIST_ENGAGED..."
supabase secrets set ECOMAIL_LIST_ENGAGED="7" --project-ref $PROJECT_REF

echo "  Setting ECOMAIL_LIST_PREMIUM..."
supabase secrets set ECOMAIL_LIST_PREMIUM="8" --project-ref $PROJECT_REF

echo "  Setting ECOMAIL_LIST_CHURNED..."
supabase secrets set ECOMAIL_LIST_CHURNED="9" --project-ref $PROJECT_REF

echo ""
echo "✅ All secrets configured!"
echo ""

# =====================================================
# 6. VERIFY SECRETS
# =====================================================

echo "🔍 Step 6: Verifying secrets..."
supabase secrets list --project-ref $PROJECT_REF

echo ""

# =====================================================
# DONE!
# =====================================================

echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📊 Deployed Functions:"
echo "  - sync-to-ecomail"
echo "  - ecomail-webhook-handler"
echo "  - batch-sync-engagement"
echo ""
echo "🔐 Configured Secrets:"
echo "  - ECOMAIL_API_KEY"
echo "  - ECOMAIL_LIST_UNREG (5)"
echo "  - ECOMAIL_LIST_REG (6)"
echo "  - ECOMAIL_LIST_ENGAGED (7)"
echo "  - ECOMAIL_LIST_PREMIUM (8)"
echo "  - ECOMAIL_LIST_CHURNED (9)"
echo ""
echo "🎯 NEXT STEPS:"
echo "  1. Setup CRON job (see ECOMAIL_SETUP_CRON.txt)"
echo "  2. Test Edge Function manually"
echo "  3. Run E2E test"
echo ""
echo "=========================================="
