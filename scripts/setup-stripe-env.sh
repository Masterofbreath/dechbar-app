#!/bin/bash

##############################################################################
# Setup Stripe Environment Variables for Supabase Edge Functions
# 
# This script helps you set up Stripe environment variables in Supabase.
# 
# Usage:
#   ./scripts/setup-stripe-env.sh
# 
# Prerequisites:
#   - Supabase CLI installed and logged in
#   - Stripe API keys ready
# 
# @package DechBar_App
# @since 2026-01-20
##############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🔐 Stripe Environment Setup for Supabase Edge Functions${NC}"
echo "=========================================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Install it with:${NC}"
    echo "   npm install -g supabase"
    exit 1
fi

echo -e "${YELLOW}⚠️  Warning: This will set secrets in your Supabase project.${NC}"
echo "   Make sure you're in the correct project!"
echo ""

# Check current project
echo -e "${BLUE}📋 Current Supabase project:${NC}"
supabase projects list --linked || {
    echo ""
    echo -e "${RED}❌ No project linked. Link your project first:${NC}"
    echo "   supabase link --project-ref your-project-ref"
    exit 1
}
echo ""

# Confirm before proceeding
read -p "Continue with setting Stripe secrets? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${BLUE}📝 Enter your Stripe API keys:${NC}"
echo "   (Get them from: https://dashboard.stripe.com/test/apikeys)"
echo ""

# Read Stripe Secret Key
echo -n "STRIPE_SECRET_KEY (sk_test_...): "
read -r STRIPE_SECRET_KEY

if [[ ! $STRIPE_SECRET_KEY =~ ^sk_ ]]; then
    echo -e "${RED}❌ Invalid Stripe secret key format${NC}"
    exit 1
fi

# Read Stripe Webhook Secret
echo ""
echo -e "${YELLOW}ℹ️  Get webhook secret from Stripe Dashboard > Webhooks > Add endpoint${NC}"
echo -n "STRIPE_WEBHOOK_SECRET (whsec_...): "
read -r STRIPE_WEBHOOK_SECRET

if [[ ! $STRIPE_WEBHOOK_SECRET =~ ^whsec_ ]]; then
    echo -e "${RED}❌ Invalid Stripe webhook secret format${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔨 Setting secrets in Supabase...${NC}"
echo ""

# Set secrets
echo "Setting STRIPE_SECRET_KEY..."
if supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"; then
    echo -e "${GREEN}✅ STRIPE_SECRET_KEY set successfully${NC}"
else
    echo -e "${RED}❌ Failed to set STRIPE_SECRET_KEY${NC}"
    exit 1
fi

echo ""
echo "Setting STRIPE_WEBHOOK_SECRET..."
if supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"; then
    echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET set successfully${NC}"
else
    echo -e "${RED}❌ Failed to set STRIPE_WEBHOOK_SECRET${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All Stripe secrets set successfully!${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "   1. Deploy Edge Functions:"
echo "      ./scripts/deploy-edge-functions.sh"
echo ""
echo "   2. Set up Stripe webhook endpoint:"
echo "      - URL: https://your-project.supabase.co/functions/v1/stripe-webhooks"
echo "      - Events to listen: "
echo "        • checkout.session.completed"
echo "        • customer.subscription.created"
echo "        • customer.subscription.updated"
echo "        • customer.subscription.deleted"
echo "        • invoice.payment_succeeded"
echo "        • invoice.payment_failed"
echo ""
echo "   3. Test the integration:"
echo "      See: docs/development/STRIPE_TESTING_GUIDE.md"
echo ""
echo -e "${GREEN}✨ Done!${NC}"
