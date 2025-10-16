-- Migration: Fix view dependency and remove display_type column
-- Date: 2025-01-16
-- Description: Handle items_with_image_urls view dependency and remove display_type

BEGIN;

-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS items_with_image_urls;

-- Step 2: Remove display_type column
ALTER TABLE items DROP COLUMN IF EXISTS display_type;

-- Step 3: Recreate the view without display_type
CREATE VIEW items_with_image_urls AS
SELECT 
  *,
  CASE 
    WHEN product_image_url IS NOT NULL AND product_image_url != '' THEN
      CASE 
        WHEN product_image_url LIKE 'http%' THEN product_image_url
        WHEN product_image_url LIKE '/products/%' THEN 
          'https://gcanfodziyqrfpobwmyb.supabase.co/storage/v1/object/public/product_images' || product_image_url
        WHEN product_image_url LIKE '/backgrounds/%' THEN
          'https://gcanfodziyqrfpobwmyb.supabase.co/storage/v1/object/public/background_images' || product_image_url
        ELSE 'https://gcanfodziyqrfpobwmyb.supabase.co/storage/v1/object/public/product_images' || product_image_url
      END
    ELSE NULL
  END as resolved_product_image_url,
  CASE 
    WHEN background_image_url IS NOT NULL AND background_image_url != '' THEN
      CASE 
        WHEN background_image_url LIKE 'http%' THEN background_image_url
        WHEN background_image_url LIKE '/products/%' THEN 
          'https://gcanfodziyqrfpobwmyb.supabase.co/storage/v1/object/public/product_images' || background_image_url
        WHEN background_image_url LIKE '/backgrounds/%' THEN
          'https://gcanfodziyqrfpobwmyb.supabase.co/storage/v1/object/public/background_images' || background_image_url
        ELSE 'https://gcanfodziyqrfpobwmyb.supabase.co/storage/v1/object/public/background_images' || background_image_url
      END
    ELSE NULL
  END as resolved_background_image_url
FROM items;

-- Step 4: Add helpful comment
COMMENT ON COLUMN items.is_featured IS 'Featured products are category showcase products (replaces display_type: both). Only one featured product allowed per category.';

COMMIT;

-- Verification: Check that display_type column is gone and view is recreated
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'items' AND column_name = 'display_type';

-- SELECT table_name FROM information_schema.views 
-- WHERE table_name = 'items_with_image_urls';
