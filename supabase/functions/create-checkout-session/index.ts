/**
 * Supabase Edge Function: Create Stripe Checkout Session
 * 
 * Purpose: Creates a Stripe Checkout session for membership subscriptions
 * Triggered by: Frontend (useCheckout hook)
 * Returns: Stripe Checkout URL
 * 
 * @package DechBar
 * @since 2026-01-20
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Optional auth - support both authenticated and guest checkout
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      // Authenticated user - use anon key for proper JWT verification
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      });
      
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      
      if (user && !authError) {
        userId = user.id;
        userEmail = user.email!;
      }
    }

    // Get request body
    const { price_id, interval, module_id, email, ui_mode } = await req.json();

    // Validate required fields
    if (!price_id || !interval || !module_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: price_id, interval, module_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Guest checkout: email required if not authenticated
    if (!userId && !email) {
      return new Response(
        JSON.stringify({ error: 'Email je povinný pro nákup bez přihlášení' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use email from request if guest
    if (!userEmail && email) {
      userEmail = email;
    }

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'Email not found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get or create Stripe customer
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let customerId: string | undefined;

    if (userId) {
      // Authenticated user: check for existing customer
      const { data: membership } = await supabase
        .from('memberships')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      customerId = membership?.stripe_customer_id;

      if (!customerId) {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            supabase_user_id: userId,
          },
        });
        customerId = customer.id;

        // Update membership with customer ID
        await supabase
          .from('memberships')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', userId);
      }
    } else {
      // Guest checkout: create customer without linking to Supabase yet
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          is_guest: 'true',
        },
      });
      customerId = customer.id;
    }

    // Determine success/cancel URLs based on environment
    const baseUrl = Deno.env.get('VITE_APP_URL') || 'http://localhost:5173';
    
    // Determine if embedded or hosted mode
    const isEmbedded = ui_mode === 'embedded';

    // Build session configuration
    const sessionConfig: Record<string, unknown> = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        user_id: userId || 'guest',
        module_id,
        interval,
        email: userEmail,
        is_guest: userId ? 'false' : 'true',
      },
      subscription_data: {
        metadata: {
          user_id: userId || 'guest',
          module_id,
          interval,
          email: userEmail,
          is_guest: userId ? 'false' : 'true',
        },
      },
    };

    if (isEmbedded) {
      // Embedded Checkout
      sessionConfig.ui_mode = 'embedded';
      sessionConfig.return_url = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      // Hosted Checkout (fallback)
      sessionConfig.success_url = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      sessionConfig.cancel_url = `${baseUrl}/checkout/cancel`;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`✅ Checkout session created: ${session.id} for ${userId ? 'user ' + userId : 'guest ' + userEmail} (${isEmbedded ? 'embedded' : 'hosted'})`);

    // Return appropriate response based on mode
    if (isEmbedded) {
      return new Response(
        JSON.stringify({ 
          clientSecret: session.client_secret,
          session_id: session.id,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          url: session.url,
          session_id: session.id,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error: unknown) {
    console.error('❌ Checkout session error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || 'Failed to create checkout session' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
