/**
 * public-stats — Public Community Statistics
 *
 * Returns real-time stats for the landing page marketing section.
 * No authentication required — public endpoint.
 *
 * Response is cached at CDN level for 1 hour (Cache-Control: s-maxage=3600).
 * Falls back gracefully — if DB query fails, returns null values
 * (frontend handles with static fallback).
 *
 * Stats returned:
 *   - total_users:               total registered profiles
 *   - total_minutes_breathed:    cumulative from platform_daily_stats
 *   - community_members:         alias for total_users (UI display)
 *
 * @package DechBar_App
 * @subpackage Supabase/Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // Parallel queries for speed
    const [usersResult, minutesResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('platform_daily_stats')
        .select('total_minutes_breathed'),
    ]);

    const totalUsers = usersResult.count ?? 0;

    const totalMinutes = (minutesResult.data ?? []).reduce(
      (sum, row) => sum + Number(row.total_minutes_breathed ?? 0),
      0
    );

    const responseData = {
      total_users: totalUsers,
      total_minutes_breathed: Math.round(totalMinutes),
      community_members: totalUsers,
      generated_at: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=600',
          ...CORS_HEADERS,
        },
      }
    );
  } catch (err) {
    console.error('[public-stats] Error:', err);
    return new Response(
      JSON.stringify({
        total_users: null,
        total_minutes_breathed: null,
        community_members: null,
        error: 'stats_unavailable',
        generated_at: new Date().toISOString(),
      }),
      {
        status: 200, // Return 200 even on error — frontend uses static fallback
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...CORS_HEADERS,
        },
      }
    );
  }
});
