#!/bin/bash

##############################################################################
# Deploy Supabase Edge Functions
# 
# This script deploys all Edge Functions to Supabase.
# 
# Usage:
#   ./scripts/deploy-edge-functions.sh
# 
# Prerequisites:
#   - Supabase CLI installed (npm install -g supabase)
#   - Logged in to Supabase (supabase login)
#   - Project linked (supabase link --project-ref your-project-ref)
# 
# @package DechBar_App
# @since 2026-01-20
##############################################################################

set -e  # Exit on error

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "supabase/functions" ]; then
    echo "❌ Error: supabase/functions directory not found"
    echo "   Run this script from the project root directory"
    exit 1
fi

# List of functions to deploy
FUNCTIONS=(
    "create-checkout-session"
    "stripe-webhooks"
)

echo -e "${BLUE}📋 Functions to deploy:${NC}"
for func in "${FUNCTIONS[@]}"; do
    echo "   - $func"
done
echo ""

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}🔨 Deploying: $func${NC}"
    
    if supabase functions deploy "$func" --no-verify-jwt; then
        echo -e "${GREEN}✅ Successfully deployed: $func${NC}"
    else
        echo "❌ Failed to deploy: $func"
        exit 1
    fi
    
    echo ""
done

echo -e "${GREEN}🎉 All Edge Functions deployed successfully!${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "   1. Set environment secrets (if not already done):"
echo "      supabase secrets set STRIPE_SECRET_KEY=sk_test_..."
echo "      supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "   2. Test the functions:"
echo "      ./scripts/test-edge-functions.sh"
echo ""
echo "   3. Set up Stripe webhooks:"
echo "      - Go to Stripe Dashboard > Webhooks"
echo "      - Add endpoint: https://your-project.supabase.co/functions/v1/stripe-webhooks"
echo "      - Select events: checkout.session.completed, customer.subscription.*"
echo ""
echo -e "${GREEN}✨ Done!${NC}"
