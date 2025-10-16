-- Migration: Add editable names to product and background images
-- Date: 2025-01-16
-- Description: Add name/title fields to images tables for better visual management

BEGIN;

-- Step 1: Add name fields to product_images table
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Add name fields to background_images table  
ALTER TABLE background_images ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE background_images ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 3: Populate display_name with filename-based names
-- Extract readable names from filenames and add timestamp for uniqueness
UPDATE product_images 
SET display_name = CASE 
  WHEN filename ~ '^[0-9]+_(.+)\.[^.]+$' THEN 
    -- Extract name after timestamp underscore
    INITCAP(REGEXP_REPLACE(REGEXP_REPLACE(SPLIT_PART(SPLIT_PART(filename, '_', 2), '.', 1), '_', ' '), '-', ' '))
    || ' (' || SPLIT_PART(filename, '_', 1) || ')'
  ELSE 
    -- Fallback: use filename without extension
    INITCAP(REGEXP_REPLACE(REGEXP_REPLACE(SPLIT_PART(filename, '.', 1), '_', ' '), '-', ' '))
END
WHERE display_name IS NULL;

UPDATE background_images 
SET display_name = CASE 
  WHEN filename ~ '^[0-9]+_(.+)\.[^.]+$' THEN 
    -- Extract name after timestamp underscore
    INITCAP(REGEXP_REPLACE(REGEXP_REPLACE(SPLIT_PART(SPLIT_PART(filename, '_', 2), '.', 1), '_', ' '), '-', ' '))
    || ' (' || SPLIT_PART(filename, '_', 1) || ')'
  ELSE 
    -- Fallback: use filename without extension
    INITCAP(REGEXP_REPLACE(REGEXP_REPLACE(SPLIT_PART(filename, '.', 1), '_', ' '), '-', ' '))
END
WHERE display_name IS NULL;

-- Step 4: Add constraints and indexes
ALTER TABLE product_images ALTER COLUMN display_name SET NOT NULL;
ALTER TABLE background_images ALTER COLUMN display_name SET NOT NULL;

-- Add unique constraint on display_name per restaurant
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_unique_name 
ON product_images (restaurant_slug, display_name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_background_images_unique_name 
ON background_images (restaurant_slug, display_name);

-- Step 5: Add helpful comments
COMMENT ON COLUMN product_images.display_name IS 'User-friendly display name for the image (editable)';
COMMENT ON COLUMN product_images.description IS 'Optional description for the image';
COMMENT ON COLUMN background_images.display_name IS 'User-friendly display name for the background image (editable)';
COMMENT ON COLUMN background_images.description IS 'Optional description for the background image';

COMMIT;

-- Verification queries
-- SELECT filename, display_name FROM product_images WHERE restaurant_slug = 'eiscafe-remi' LIMIT 5;
-- SELECT filename, display_name FROM background_images WHERE restaurant_slug = 'eiscafe-remi' LIMIT 5;
