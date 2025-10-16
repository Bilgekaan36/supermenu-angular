-- Migration: Remove display_type and migrate to is_featured logic
-- Date: 2025-01-16
-- Description: Simplify product system by removing redundant display_type field
--              and using only is_featured to determine category/product behavior

BEGIN;

-- Step 1: Add temporary column to track migration
ALTER TABLE items ADD COLUMN IF NOT EXISTS migration_temp_featured BOOLEAN DEFAULT false;

-- Step 2: Migrate existing data
-- Convert display_type 'both' to is_featured = true
UPDATE items 
SET migration_temp_featured = true
WHERE display_type = 'both';

-- Convert display_type 'category' to is_featured = true (if any exist)
UPDATE items 
SET migration_temp_featured = true
WHERE display_type = 'category';

-- Step 3: Update is_featured based on migration_temp_featured
UPDATE items 
SET is_featured = migration_temp_featured
WHERE migration_temp_featured = true;

-- Step 4: Add constraint to ensure only one featured product per category
-- First, create a partial unique index for featured products per category
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_one_featured_per_category 
ON items (restaurant_slug, category_slug) 
WHERE is_featured = true AND is_active = true;

-- Step 5: Remove the temporary column
ALTER TABLE items DROP COLUMN IF EXISTS migration_temp_featured;

-- Step 6: Remove display_type column (commented out for safety - uncomment when ready)
-- ALTER TABLE items DROP COLUMN IF EXISTS display_type;

-- Add helpful comment
COMMENT ON COLUMN items.is_featured IS 'Featured products are category showcase products (replaces display_type: both). Only one featured product allowed per category.';

COMMIT;

-- Verification query (run this to check the migration)
-- SELECT 
--   category_slug,
--   COUNT(*) as total_products,
--   COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_count
-- FROM items 
-- WHERE restaurant_slug = 'eiscafe-remi' 
--   AND is_active = true
-- GROUP BY category_slug
-- ORDER BY category_slug;
