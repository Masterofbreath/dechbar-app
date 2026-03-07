-- Migration: Fix CDN URLs in background_tracks
-- Date: 2026-03-05
-- Problem: 3 records have cdn_url pointing to https://cdn.dechbar.cz/ (non-functional custom domain)
-- Fix: Replace with https://dechbar-cdn.b-cdn.net/ (working Bunny.net CDN hostname)

UPDATE public.background_tracks
SET cdn_url = REPLACE(cdn_url, 'https://cdn.dechbar.cz/', 'https://dechbar-cdn.b-cdn.net/')
WHERE cdn_url LIKE 'https://cdn.dechbar.cz/%';
