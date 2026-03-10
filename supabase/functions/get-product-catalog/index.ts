/**
 * Supabase Edge Function: Get Product Catalog
 *
 * Vrací seznam produktů z DB (tabulka `modules`) jako veřejné API.
 * DB je single source of truth pro všechna Stripe Price IDs.
 *
 * Filtry:
 *   ?filter=homepage  → show_on_homepage = true AND is_active = true
 *   ?filter=catalog   → show_in_catalog = true AND is_active = true (default)
 *   ?filter=all       → všechny is_active = true (pro admin panel, vyžaduje service_role)
 *
 * Cache: Cache-Control: public, max-age=300 (5 min)
 * Invalidace: Vercel edge cache respektuje Cache-Control automaticky.
 *
 * @since 2026-03-10
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const filter = url.searchParams.get('filter') ?? 'catalog';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Pokud filter=all, vyžadujeme service_role JWT (admin use case)
    if (filter === 'all') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.includes('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized — filter=all vyžaduje autorizaci' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    let query = supabase
      .from('modules')
      .select(
        'id, name, description, price_czk, price_type, is_active, is_beta, ' +
        'icon, color, sort_order, ' +
        'stripe_price_id, stripe_price_id_monthly, stripe_price_id_annual, stripe_product_id, ' +
        'show_on_homepage, show_in_catalog, ' +
        'ecomail_list_in, ecomail_list_before, ' +
        'requires_module_id',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (filter === 'homepage') {
      query = query.eq('show_on_homepage', true);
    } else if (filter === 'catalog') {
      query = query.eq('show_in_catalog', true);
    }
    // filter === 'all': bez dalších omezení

    const { data, error } = await query;

    if (error) {
      console.error('[get-product-catalog] DB error:', error.message);
      return new Response(
        JSON.stringify({ error: 'Chyba při načítání produktů z DB' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify(data ?? []), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    console.error('[get-product-catalog] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Neočekávaná chyba serveru' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
