/**
 * Admin API Service
 * 
 * Abstraction layer for admin operations on tracks, albums, playlists.
 * Provides CRUD methods with error handling and TypeScript type safety.
 * 
 * This abstraction allows easy migration to REST API in future by only changing this file.
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Admin
 * @since 2.44.0
 */

import { supabase } from '@/platform/api/supabase';
import type { Track, Album } from '@/platform/components/AudioPlayer/types';

// ── Helper: přímé volání Edge Function s explicitním JWT ─────────────────────
// Používáme fetch() místo supabase.functions.invoke() pro 100% kontrolu nad
// Authorization hlavičkou.
async function callEdgeFunction(functionName: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  // Zkusíme refreshnout session → získat čerstvý JWT (eliminuje "Invalid JWT" z expirovaného tokenu)
  let token: string | undefined;
  try {
    const { data: refreshed } = await supabase.auth.refreshSession();
    token = refreshed.session?.access_token;
  } catch {
    // refresh selhal → použijeme cached session
  }

  if (!token) {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  }

  if (!token) {
    throw new Error('Nejsi přihlášen nebo vypršela session — odhlás se a přihlas znovu.');
  }

  console.log(`[callEdgeFunction] Calling ${functionName}, token prefix: ${token.substring(0, 20)}...`);

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Edge Function ${functionName} selhala (${response.status}): ${errText}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}
import type {
  TrackInput, TrackFilters, AlbumInput, AlbumFilters,
  AkademieCategoryInput, AkademieCategory,
  AkademieProgramInput, AkademieProgram, AkademieProgramCreateResult,
  AkademieProgramModuleUpdate, FeaturedProgramRecord,
  AkademieSeriesInput, AkademieSeries,
  AkademieLessonInput, AkademieLesson,
} from './types';

/**
 * Admin API - Tracks Management
 */
export const adminApi = {
  tracks: {
    /**
     * Get all tracks with optional filters
     * @param filters - Optional filters (category, album_id, search)
     * @returns Promise with array of tracks
     */
    async getAll(filters?: TrackFilters): Promise<Track[]> {
      try {
        let query = supabase
          .from('tracks')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.duration_category) {
          query = query.eq('duration_category', filters.duration_category);
        }
        if (filters?.mood_category) {
          query = query.eq('mood_category', filters.mood_category);
        }
        if (filters?.album_id) {
          query = query.eq('album_id', filters.album_id);
        }
        if (filters?.is_published !== undefined) {
          query = query.eq('is_published', filters.is_published);
        }
        if (filters?.search) {
          query = query.ilike('title', `%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching tracks:', error);
          throw new Error(`Failed to fetch tracks: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Admin API error (tracks.getAll):', error);
        throw error;
      }
    },

    /**
     * Get single track by ID
     * @param id - Track ID
     * @returns Promise with track data
     */
    async getById(id: string): Promise<Track> {
      try {
        const { data, error } = await supabase
          .from('tracks')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching track:', error);
          throw new Error(`Failed to fetch track: ${error.message}`);
        }

        if (!data) {
          throw new Error('Track not found');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (tracks.getById):', error);
        throw error;
      }
    },

    /**
     * Create new track
     * @param input - Track data
     * @returns Promise with created track
     */
    async create(input: TrackInput): Promise<Track> {
      try {
        const { data, error } = await supabase
          .from('tracks')
          .insert(input)
          .select()
          .single();

        if (error) {
          console.error('Error creating track:', error);
          throw new Error(`Failed to create track: ${error.message}`);
        }

        if (!data) {
          throw new Error('Failed to create track: No data returned');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (tracks.create):', error);
        throw error;
      }
    },

    /**
     * Update existing track
     * @param id - Track ID
     * @param input - Partial track data to update
     * @returns Promise with updated track
     */
    async update(id: string, input: Partial<TrackInput>): Promise<Track> {
      try {
        const { data, error } = await supabase
          .from('tracks')
          .update(input)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating track:', error);
          throw new Error(`Failed to update track: ${error.message}`);
        }

        if (!data) {
          throw new Error('Track not found');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (tracks.update):', error);
        throw error;
      }
    },

    /**
     * Delete track
     * @param id - Track ID
     * @returns Promise<void>
     */
    async delete(id: string): Promise<void> {
      try {
        const { error } = await supabase
          .from('tracks')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting track:', error);
          throw new Error(`Failed to delete track: ${error.message}`);
        }
      } catch (error) {
        console.error('Admin API error (tracks.delete):', error);
        throw error;
      }
    },

    /**
     * Bulk update track order
     * @param updates - Array of {id, track_order} objects
     * @returns Promise<void>
     */
    async bulkUpdateOrder(updates: { id: string; track_order: number }[]): Promise<void> {
      try {
        const promises = updates.map(({ id, track_order }) =>
          supabase.from('tracks').update({ track_order }).eq('id', id)
        );
        await Promise.all(promises);
      } catch (error) {
        console.error('Admin API error (tracks.bulkUpdateOrder):', error);
        throw error;
      }
    },
  },

  /**
   * Admin API - Albums Management
   */
  albums: {
    /**
     * Get all albums with optional filters
     * @param filters - Optional filters (type, difficulty, search)
     * @returns Promise with array of albums
     */
    async getAll(filters?: AlbumFilters): Promise<Album[]> {
      try {
        let query = supabase
          .from('albums')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.difficulty) {
          query = query.eq('difficulty', filters.difficulty);
        }
        if (filters?.is_locked !== undefined) {
          query = query.eq('is_locked', filters.is_locked);
        }
        if (filters?.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching albums:', error);
          throw new Error(`Failed to fetch albums: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Admin API error (albums.getAll):', error);
        throw error;
      }
    },

    /**
     * Get single album by ID
     * @param id - Album ID
     * @returns Promise with album data
     */
    async getById(id: string): Promise<Album> {
      try {
        const { data, error } = await supabase
          .from('albums')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching album:', error);
          throw new Error(`Failed to fetch album: ${error.message}`);
        }

        if (!data) {
          throw new Error('Album not found');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (albums.getById):', error);
        throw error;
      }
    },

    /**
     * Create new album
     * @param input - Album data
     * @returns Promise with created album
     */
    async create(input: AlbumInput): Promise<Album> {
      try {
        const { data, error } = await supabase
          .from('albums')
          .insert(input)
          .select()
          .single();

        if (error) {
          console.error('Error creating album:', error);
          throw new Error(`Failed to create album: ${error.message}`);
        }

        if (!data) {
          throw new Error('Failed to create album: No data returned');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (albums.create):', error);
        throw error;
      }
    },

    /**
     * Update existing album
     * @param id - Album ID
     * @param input - Partial album data to update
     * @returns Promise with updated album
     */
    async update(id: string, input: Partial<AlbumInput>): Promise<Album> {
      try {
        const { data, error } = await supabase
          .from('albums')
          .update(input)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating album:', error);
          throw new Error(`Failed to update album: ${error.message}`);
        }

        if (!data) {
          throw new Error('Album not found');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (albums.update):', error);
        throw error;
      }
    },

    /**
     * Delete album
     * @param id - Album ID
     * @returns Promise<void>
     */
    async delete(id: string): Promise<void> {
      try {
        const { error } = await supabase
          .from('albums')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting album:', error);
          throw new Error(`Failed to delete album: ${error.message}`);
        }
      } catch (error) {
        console.error('Admin API error (albums.delete):', error);
        throw error;
      }
    },

    /**
     * Get track count for album
     * @param albumId - Album ID
     * @returns Promise with track count
     */
    async getTrackCount(albumId: string): Promise<number> {
      try {
        const { count, error } = await supabase
          .from('tracks')
          .select('*', { count: 'exact', head: true })
          .eq('album_id', albumId);

        if (error) {
          console.error('Error getting track count:', error);
          throw new Error(`Failed to get track count: ${error.message}`);
        }

        return count || 0;
      } catch (error) {
        console.error('Admin API error (albums.getTrackCount):', error);
        throw error;
      }
    },
  },

  /**
   * Admin API — Akademie Content Management
   * Hierarchy: Category → Program (module) → Series → Lessons
   */
  akademie: {

    categories: {
      async getAll(): Promise<AkademieCategory[]> {
        const { data, error } = await supabase
          .from('akademie_categories')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
        return (data as AkademieCategory[]) ?? [];
      },

      async create(input: AkademieCategoryInput): Promise<AkademieCategory> {
        const { data, error } = await supabase
          .from('akademie_categories')
          .insert({
            name: input.name,
            slug: input.slug,
            icon: input.icon ?? null,
            description: input.description,
            description_long: input.description_long ?? null,
            cover_image_url: input.cover_image_url ?? null,
            sort_order: input.sort_order,
            is_active: input.is_active,
            required_module_id: input.required_module_id ?? null,
          })
          .select()
          .single();
        if (error) throw new Error(`Failed to create category: ${error.message}`);
        return data as AkademieCategory;
      },

      async update(id: string, input: Partial<AkademieCategoryInput>): Promise<AkademieCategory> {
        const { data, error } = await supabase
          .from('akademie_categories')
          .update(input)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(`Failed to update category: ${error.message}`);
        return data as AkademieCategory;
      },

      async delete(id: string): Promise<void> {
        const { error } = await supabase
          .from('akademie_categories')
          .delete()
          .eq('id', id);
        if (error) throw new Error(`Failed to delete category: ${error.message}`);
      },
    },

    programs: {
      async getAll(): Promise<AkademieProgram[]> {
        const { data, error } = await supabase
          .from('akademie_programs')
          .select(`
            *,
            modules:module_id ( name, price_czk, stripe_price_id, ecomail_list_in, ecomail_list_before ),
            akademie_categories:category_id ( name )
          `)
          .order('sort_order', { ascending: true });
        if (error) throw new Error(`Failed to fetch programs: ${error.message}`);

        return ((data ?? []) as unknown[]).map((row) => {
          const r = row as Record<string, unknown>;
          const mod = r.modules as Record<string, unknown> | null;
          const cat = r.akademie_categories as Record<string, unknown> | null;
          return {
            ...r,
            module_name: mod?.name as string | undefined,
            module_price_czk: mod?.price_czk as number | undefined,
            module_stripe_price_id: mod?.stripe_price_id as string | null | undefined,
            module_ecomail_list_in: mod?.ecomail_list_in as string | null | undefined,
            module_ecomail_list_before: mod?.ecomail_list_before as string | null | undefined,
            category_name: cat?.name as string | undefined,
          } as AkademieProgram;
        });
      },

      async getById(id: string): Promise<AkademieProgram> {
        const { data, error } = await supabase
          .from('akademie_programs')
          .select(`
            *,
            modules:module_id ( name, price_czk, stripe_price_id, ecomail_list_in, ecomail_list_before ),
            akademie_categories:category_id ( name )
          `)
          .eq('id', id)
          .single();
        if (error) throw new Error(`Failed to fetch program: ${error.message}`);
        const r = data as Record<string, unknown>;
        const mod = r.modules as Record<string, unknown> | null;
        const cat = r.akademie_categories as Record<string, unknown> | null;
        return {
          ...r,
          module_name: mod?.name as string | undefined,
          module_price_czk: mod?.price_czk as number | undefined,
          module_stripe_price_id: mod?.stripe_price_id as string | null | undefined,
          module_ecomail_list_in: mod?.ecomail_list_in as string | null | undefined,
          module_ecomail_list_before: mod?.ecomail_list_before as string | null | undefined,
          category_name: cat?.name as string | undefined,
        } as AkademieProgram;
      },

      /**
       * Atomický create: INSERT modules → INSERT akademie_programs → Stripe+Ecomail (Edge Fn)
       * Pokud Edge Function selže, DB záznamy zůstanou — vrátí stripeError/ecmailError pro UI retry.
       */
      async create(input: AkademieProgramInput): Promise<AkademieProgramCreateResult> {
        // 1. INSERT into modules
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .insert({
            id: input.slug,
            name: input.name,
            description: input.description ?? null,
            price_czk: input.price_czk,
            price_type: 'lifetime',
            is_active: false,  // true až po publish
            is_beta: false,
            sort_order: 0,
          })
          .select('id')
          .single();

        if (moduleError) throw new Error(`Failed to create module: ${moduleError.message}`);
        const moduleId = (moduleData as { id: string }).id;

        // 2. INSERT into akademie_programs
        const { data: programData, error: programError } = await supabase
          .from('akademie_programs')
          .insert({
            module_id: moduleId,
            category_id: input.category_id,
            description_long: input.description_long ?? null,
            cover_image_url: input.cover_image_url ?? null,
            sort_order: 0,
            duration_days: input.duration_days ?? null,
            daily_minutes: input.daily_minutes ?? null,
            launch_date: input.launch_date ?? null,
            is_published: input.is_published,
          })
          .select('id')
          .single();

        if (programError) throw new Error(`Failed to create program: ${programError.message}`);
        const programId = (programData as { id: string }).id;

        // 3. Stripe + Ecomail via Edge Function (server-side for security)
        const result: AkademieProgramCreateResult = {
          moduleId,
          programId,
          stripeError: null,
          ecmailError: null,
        };

        try {
          const fnData = await callEdgeFunction('create-akademie-product', {
            name: input.name,
            description: input.description,
            priceCzk: input.price_czk,
            moduleId,
          });

          console.log('[adminApi] create-akademie-product response:', fnData);
          result.stripeProductId = fnData?.stripeProductId as string | null;
          result.stripePriceId = fnData?.stripePriceId as string | null;
          result.ecmailListInId = fnData?.ecmailListInId as string | null;
          result.ecmailListBeforeId = fnData?.ecmailListBeforeId as string | null;
          result.stripeError = (fnData?.stripeError as string | null) ?? null;
          result.ecmailError = (fnData?.ecmailError as string | null) ?? null;

          if (result.stripeError || result.ecmailError) {
            console.warn('[adminApi] Stripe/Ecomail partial failure:', {
              stripeError: result.stripeError,
              ecmailError: result.ecmailError,
            });
          }
        } catch (fnErr: unknown) {
          console.error('[adminApi] callEdgeFunction threw:', fnErr);
          result.stripeError = fnErr instanceof Error ? fnErr.message : 'Edge Function call failed';
          result.ecmailError = result.stripeError;
        }

        return result;
      },

      async update(id: string, input: Partial<AkademieProgramInput>): Promise<AkademieProgram> {
        const updatePayload: Record<string, unknown> = {};
        if (input.description_long !== undefined) updatePayload.description_long = input.description_long;
        if (input.cover_image_url !== undefined) updatePayload.cover_image_url = input.cover_image_url;
        if (input.duration_days !== undefined) updatePayload.duration_days = input.duration_days;
        if (input.daily_minutes !== undefined) updatePayload.daily_minutes = input.daily_minutes;
        if (input.launch_date !== undefined) updatePayload.launch_date = input.launch_date;
        if (input.is_published !== undefined) updatePayload.is_published = input.is_published;

        const { data, error } = await supabase
          .from('akademie_programs')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(`Failed to update program: ${error.message}`);

        // Also update modules.is_active when publishing
        if (input.is_published !== undefined && data) {
          const moduleId = (data as Record<string, unknown>).module_id as string;
          await supabase
            .from('modules')
            .update({ is_active: input.is_published })
            .eq('id', moduleId);
        }

        return data as AkademieProgram;
      },

      /**
       * Manually set Stripe/Ecomail IDs on modules table for an existing program.
       * Use when auto-setup via Edge Function fails.
       */
      async setStripeEcomail(moduleId: string, values: {
        stripe_price_id?: string | null;
        ecomail_list_in?: string | null;
        ecomail_list_before?: string | null;
      }): Promise<void> {
        const payload: Record<string, unknown> = {};
        if (values.stripe_price_id !== undefined) payload.stripe_price_id = values.stripe_price_id;
        if (values.ecomail_list_in !== undefined) payload.ecomail_list_in = values.ecomail_list_in;
        if (values.ecomail_list_before !== undefined) payload.ecomail_list_before = values.ecomail_list_before;
        if (Object.keys(payload).length === 0) return;
        const { error } = await supabase.from('modules').update(payload).eq('id', moduleId);
        if (error) throw new Error(`Failed to update module Stripe/Ecomail: ${error.message}`);
      },

      /**
       * Re-run Edge Function for an existing program (retry Stripe + Ecomail setup).
       * Warning: may create duplicate Stripe products if first attempt partially succeeded.
       */
      async retryStripeEcomail(moduleId: string, name: string, priceCzk: number, description?: string): Promise<{
        stripePriceId?: string | null;
        ecmailListInId?: string | null;
        ecmailListBeforeId?: string | null;
        stripeError?: string | null;
        ecmailError?: string | null;
      }> {
        const d = await callEdgeFunction('create-akademie-product', { name, description, priceCzk, moduleId });
        console.log('[adminApi] retryStripeEcomail response:', d);
        return {
          stripePriceId: d?.stripePriceId as string | null,
          ecmailListInId: d?.ecmailListInId as string | null,
          ecmailListBeforeId: d?.ecmailListBeforeId as string | null,
          stripeError: d?.stripeError as string | null,
          ecmailError: d?.ecmailError as string | null,
        };
      },

      async delete(id: string): Promise<void> {
        const { error } = await supabase
          .from('akademie_programs')
          .delete()
          .eq('id', id);
        if (error) throw new Error(`Failed to delete program: ${error.message}`);
      },

      async updateModule(moduleId: string, input: AkademieProgramModuleUpdate): Promise<void> {
        const payload: Record<string, unknown> = {};
        if (input.name !== undefined) payload.name = input.name;
        if (input.price_czk !== undefined) payload.price_czk = input.price_czk;
        if (Object.keys(payload).length === 0) return;
        const { error } = await supabase.from('modules').update(payload).eq('id', moduleId);
        if (error) throw new Error(`Failed to update module: ${error.message}`);
      },
    },

    featuredProgram: {
      async getActive(): Promise<FeaturedProgramRecord | null> {
        const { data, error } = await supabase
          .from('platform_featured_program')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (error) throw new Error(`Failed to fetch featured program: ${error.message}`);
        return data as FeaturedProgramRecord | null;
      },

      /**
       * Nastaví featured program:
       *   1. Deaktivuje všechny stávající řádky
       *   2. Smaže stávající řádek pro tento module_id
       *   3. Vloží nový aktivní řádek
       *   4. Pokud notify=true: vytvoří notifikaci + fanout na uživatele s pinnutým programem
       */
      async set(moduleId: string, opts: { notify: boolean; programName: string }): Promise<void> {
        // 1. Deaktivuj všechny
        const { error: deactivateErr } = await supabase
          .from('platform_featured_program')
          .update({ is_active: false })
          .eq('is_active', true);
        if (deactivateErr) throw new Error(`Failed to deactivate featured programs: ${deactivateErr.message}`);

        // 2. Smaž stávající řádek pro tento module (čistý slate)
        await supabase.from('platform_featured_program').delete().eq('module_id', moduleId);

        // 3. Vlož nový aktivní řádek
        const { error: insertErr } = await supabase
          .from('platform_featured_program')
          .insert({ module_id: moduleId, is_active: true, sort_order: 0, title_override: null });
        if (insertErr) throw new Error(`Failed to insert featured program: ${insertErr.message}`);

        if (!opts.notify) return;

        // 4a. Vlož notifikaci
        const { data: notifData, error: notifErr } = await supabase
          .from('notifications')
          .insert({
            type: 'promo',
            title: `Spustili jsme: ${opts.programName}`,
            message: 'Chceš se přidat k special eventu? Přejdi do Akademie a zjisti více.',
            action_url: '/app/akademie',
            action_label: 'Zobrazit program',
            target_audience: 'all',
            sent_at: new Date().toISOString(),
            is_auto_generated: true,
            auto_trigger: 'featured_program_set',
          })
          .select('id')
          .single();
        if (notifErr) throw new Error(`Failed to create notification: ${notifErr.message}`);
        const notifId = (notifData as { id: string }).id;

        // 4b. Načti všechny uživatele s pinnutým programem
        const { data: activeProgramUsers, error: usersErr } = await supabase
          .from('user_active_program')
          .select('user_id');
        if (usersErr) throw new Error(`Failed to fetch active program users: ${usersErr.message}`);

        const userIds = ((activeProgramUsers ?? []) as { user_id: string }[]).map((r) => r.user_id);
        if (userIds.length === 0) return;

        // 4c. Fanout — bulk INSERT do user_notifications
        const fanout = userIds.map((uid) => ({ user_id: uid, notification_id: notifId, read: false }));
        const { error: fanoutErr } = await supabase
          .from('user_notifications')
          .insert(fanout)
          .throwOnError();
        if (fanoutErr) throw new Error(`Failed to fanout notification: ${fanoutErr.message}`);
      },

      async unset(moduleId: string): Promise<void> {
        const { error } = await supabase
          .from('platform_featured_program')
          .update({ is_active: false })
          .eq('module_id', moduleId);
        if (error) throw new Error(`Failed to unset featured program: ${error.message}`);
      },
    },

    series: {
      async getByModuleId(moduleId: string): Promise<AkademieSeries[]> {
        const { data, error } = await supabase
          .from('akademie_series')
          .select('*')
          .eq('module_id', moduleId)
          .order('sort_order', { ascending: true });
        if (error) throw new Error(`Failed to fetch series: ${error.message}`);
        return (data as AkademieSeries[]) ?? [];
      },

      async create(input: AkademieSeriesInput): Promise<AkademieSeries> {
        const { data, error } = await supabase
          .from('akademie_series')
          .insert({
            module_id: input.module_id,
            name: input.name,
            week_number: input.week_number,
            description: input.description ?? null,
            sort_order: input.sort_order,
          })
          .select()
          .single();
        if (error) throw new Error(`Failed to create series: ${error.message}`);
        return data as AkademieSeries;
      },

      async update(id: string, input: Partial<AkademieSeriesInput>): Promise<AkademieSeries> {
        const { data, error } = await supabase
          .from('akademie_series')
          .update(input)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(`Failed to update series: ${error.message}`);
        return data as AkademieSeries;
      },

      async delete(id: string): Promise<void> {
        const { error } = await supabase
          .from('akademie_series')
          .delete()
          .eq('id', id);
        if (error) throw new Error(`Failed to delete series: ${error.message}`);
      },

      async reorder(updates: { id: string; sort_order: number }[]): Promise<void> {
        await Promise.all(
          updates.map(({ id, sort_order }) =>
            supabase.from('akademie_series').update({ sort_order }).eq('id', id)
          )
        );
      },
    },

    lessons: {
      async getBySeriesId(seriesId: string): Promise<AkademieLesson[]> {
        const { data, error } = await supabase
          .from('akademie_lessons')
          .select('*')
          .eq('series_id', seriesId)
          .order('day_number', { ascending: true });
        if (error) throw new Error(`Failed to fetch lessons: ${error.message}`);
        return (data as AkademieLesson[]) ?? [];
      },

      async create(input: AkademieLessonInput): Promise<AkademieLesson> {
        const { data, error } = await supabase
          .from('akademie_lessons')
          .insert({
            series_id: input.series_id,
            module_id: input.module_id,
            title: input.title,
            audio_url: input.audio_url,
            duration_seconds: input.duration_seconds,
            day_number: input.day_number,
            sort_order: input.sort_order,
            is_published: input.is_published ?? true,
          })
          .select()
          .single();
        if (error) throw new Error(`Failed to create lesson: ${error.message}`);
        return data as AkademieLesson;
      },

      async update(id: string, input: Partial<AkademieLessonInput>): Promise<AkademieLesson> {
        const { data, error } = await supabase
          .from('akademie_lessons')
          .update(input)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(`Failed to update lesson: ${error.message}`);
        return data as AkademieLesson;
      },

      async delete(id: string): Promise<void> {
        const { error } = await supabase
          .from('akademie_lessons')
          .delete()
          .eq('id', id);
        if (error) throw new Error(`Failed to delete lesson: ${error.message}`);
      },

      async reorder(updates: { id: string; sort_order: number }[]): Promise<void> {
        await Promise.all(
          updates.map(({ id, sort_order }) =>
            supabase.from('akademie_lessons').update({ sort_order }).eq('id', id)
          )
        );
      },
    },
  },
};
