-- Fix background image paths: update to match actual storage structure
-- Actual storage path: /restaurants/eiscafe-remi/backgrounds/cherry-dream.webp
-- The storage_path should match the actual path in Supabase Storage

-- First, fix paths that have incorrect bucket names
UPDATE public.background_images
SET storage_path = REPLACE(storage_path, '/background-images/backgrounds/', '/restaurants/eiscafe-remi/backgrounds/')
WHERE restaurant_slug = 'eiscafe-remi'
  AND storage_path LIKE '/background-images/backgrounds/%';

-- Fix paths that only have /backgrounds/ to include the full restaurant path
UPDATE public.background_images
SET storage_path = '/restaurants/eiscafe-remi/backgrounds/' || SUBSTRING(storage_path FROM '/backgrounds/(.*)$')
WHERE restaurant_slug = 'eiscafe-remi'
  AND storage_path LIKE '/backgrounds/%'
  AND storage_path NOT LIKE '/restaurants/%';
