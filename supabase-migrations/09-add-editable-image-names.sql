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

-- Step 3: Populate display_name with title-based names
-- Use existing title field as base for display_name
UPDATE product_images 
SET display_name = title
WHERE display_name IS NULL;

UPDATE background_images 
SET display_name = title
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
