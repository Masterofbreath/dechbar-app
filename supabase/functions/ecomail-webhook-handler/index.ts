/**
 * Ecomail Webhook Handler - Edge Function
 * 
 * Příjem webhooků z Ecomail (unsubscribe, bounce, click, open).
 * 
 * Flow:
 * 1. Verify webhook signature
 * 2. Process event based on type
 * 3. Update database
 * 
 * @package DechBar_App
 * @subpackage Supabase/Functions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

// =====================================================
// TYPES
// =====================================================

interface EcomailWebhook {
  event: 'unsubscribed' | 'bounced' | 'clicked' | 'opened';
  email: string;
  campaign_id?: string;
  list_id?: string;
  timestamp: string;
  reason?: string;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = Deno.env.get('ECOMAIL_WEBHOOK_SECRET');
  
  if (!secret) {
    console.warn('[Webhook] No webhook secret configured');
    return true; // Allow in development
  }
  
  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');
  
  return signature === expectedSignature;
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req: Request) => {
  try {
    // 1. Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Verify signature
    const signature = req.headers.get('X-Ecomail-Signature') || '';
    const body = await req.text();
    
    if (!verifyWebhookSignature(body, signature)) {
      console.error('[Webhook] Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Parse webhook
    const webhook: EcomailWebhook = JSON.parse(body);
    
    console.log(`[Webhook] Received ${webhook.event} for ${webhook.email}`);
    
    // 4. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 5. Process event
    switch (webhook.event) {
      case 'unsubscribed': {
        // Update user preferences
        await supabase
          .from('profiles')
          .update({
            email_preferences: {
              marketing_emails: false,
              unsubscribed_at: new Date().toISOString()
            }
          })
          .eq('email', webhook.email);
        
        console.log(`[Webhook] ✅ Unsubscribed ${webhook.email}`);
        break;
      }
      
      case 'bounced': {
        // Mark email as invalid
        await supabase
          .from('profiles')
          .update({
            metadata: {
              email_invalid: true,
              bounce_reason: webhook.reason,
              bounced_at: new Date().toISOString()
            }
          })
          .eq('email', webhook.email);
        
        console.log(`[Webhook] ⚠️ Bounced ${webhook.email}: ${webhook.reason}`);
        break;
      }
      
      case 'clicked': {
        // Track engagement (optional)
        console.log(`[Webhook] 📊 Clicked ${webhook.email} in campaign ${webhook.campaign_id}`);
        // Could insert into analytics table
        break;
      }
      
      case 'opened': {
        // Track engagement (optional)
        console.log(`[Webhook] 👀 Opened ${webhook.email} campaign ${webhook.campaign_id}`);
        break;
      }
      
      default:
        console.warn(`[Webhook] Unknown event: ${webhook.event}`);
    }
    
    // 6. Return success
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Webhook] ❌ Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/* =====================================================
 * DEPLOYMENT
 * =====================================================
 * 
 * supabase functions deploy ecomail-webhook-handler
 * 
 * REQUIRED SECRETS:
 * - ECOMAIL_WEBHOOK_SECRET (optional, for signature verification)
 * 
 * ECOMAIL SETUP:
 * Configure webhook URL in Ecomail dashboard:
 * https://YOUR_PROJECT.supabase.co/functions/v1/ecomail-webhook-handler
 * 
 * ===================================================== */
