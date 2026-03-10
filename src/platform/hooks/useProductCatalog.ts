/**
 * useProductCatalog Hook
 *
 * Single source of truth pro data produktů na frontendu.
 * Načítá produkty z Edge Function `get-product-catalog` (která čte z DB).
 * Eliminuje hardcoded Stripe Price IDs z frontend kódu.
 *
 * Cache: React Query staleTime 5 min, odpovídá Cache-Control na Edge Function.
 *
 * @since 2026-03-10
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';

export type ProductCatalogFilter = 'homepage' | 'catalog' | 'all';

export interface ProductCatalogItem {
  id: string;
  name: string;
  description: string | null;
  price_czk: number;
  price_type: 'lifetime' | 'subscription';
  is_active: boolean;
  is_beta: boolean;
  icon: string | null;
  color: string | null;
  sort_order: number;
  stripe_price_id: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  stripe_product_id: string | null;
  show_on_homepage: boolean;
  show_in_catalog: boolean;
  ecomail_list_in: string | null;
  ecomail_list_before: string | null;
  requires_module_id: string | null;
}

export const PRODUCT_CATALOG_QUERY_KEY = (filter: ProductCatalogFilter) =>
  ['product-catalog', filter] as const;

async function _fetchProductCatalog(filter: ProductCatalogFilter): Promise<ProductCatalogItem[]> {
  const { data, error } = await supabase.functions.invoke('get-product-catalog', {
    method: 'GET',
    headers: { 'x-filter': filter },
    // Edge Function čte query param, předáme přes body jako fallback
    body: null,
  });

  if (error) {
    throw new Error(`[useProductCatalog] Edge Function error: ${error.message}`);
  }

  return (data as ProductCatalogItem[]) ?? [];
}

// Alternativní fetch přes přímé URL (bez Supabase client) pro lepší caching
async function fetchProductCatalogDirect(filter: ProductCatalogFilter): Promise<ProductCatalogItem[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const url = `${supabaseUrl}/functions/v1/get-product-catalog?filter=${filter}`;
  const response = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`[useProductCatalog] HTTP ${response.status}`);
  }

  return response.json() as Promise<ProductCatalogItem[]>;
}

export function useProductCatalog(filter: ProductCatalogFilter = 'catalog') {
  const { data: products = [], isLoading, isError, error } = useQuery({
    queryKey: PRODUCT_CATALOG_QUERY_KEY(filter),
    queryFn: () => fetchProductCatalogDirect(filter),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  /**
   * Vrací Price ID pro daný produkt a billing interval.
   * - Pro subscription: vrací monthly nebo annual
   * - Pro lifetime: vrací stripe_price_id
   * - Pokud nenalezeno: vrací null (caller musí ošetřit)
   */
  function getPriceId(productId: string, interval?: 'monthly' | 'annual'): string | null {
    const product = products.find((p) => p.id === productId);
    if (!product) return null;

    if (product.price_type === 'subscription') {
      if (interval === 'annual') return product.stripe_price_id_annual;
      return product.stripe_price_id_monthly;
    }

    return product.stripe_price_id;
  }

  function getProductById(productId: string): ProductCatalogItem | undefined {
    return products.find((p) => p.id === productId);
  }

  function getHomepageProducts(): ProductCatalogItem[] {
    return products.filter((p) => p.show_on_homepage);
  }

  return {
    products,
    isLoading,
    isError,
    error,
    getPriceId,
    getProductById,
    getHomepageProducts,
  };
}
