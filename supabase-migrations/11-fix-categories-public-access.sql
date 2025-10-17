-- Migration: Fix categories table public access
-- Date: 2025-01-16
-- Description: Allow public read access to categories table for frontend display

BEGIN;

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "categories_select_by_restaurant" ON public.categories;

-- Create new policy that allows public read access (drop first if exists)
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;

CREATE POLICY "categories_public_read"
  ON public.categories
  FOR SELECT
  TO public
  USING (is_active = true);

-- Keep other policies for authenticated admin access (drop first to avoid conflicts)
DROP POLICY IF EXISTS "categories_insert_by_restaurant" ON public.categories;
DROP POLICY IF EXISTS "categories_update_by_restaurant" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_by_restaurant" ON public.categories;

CREATE POLICY "categories_insert_by_restaurant"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (restaurant_slug = 'eiscafe-remi');

CREATE POLICY "categories_update_by_restaurant"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (restaurant_slug = 'eiscafe-remi')
  WITH CHECK (restaurant_slug = 'eiscafe-remi');

CREATE POLICY "categories_delete_by_restaurant"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (restaurant_slug = 'eiscafe-remi');

COMMIT;
