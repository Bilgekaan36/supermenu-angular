-- Migration: Final removal of display_type column
-- Date: 2025-01-16
-- Description: Remove display_type column after data migration is complete
--              Run this if you already executed the previous migration

BEGIN;

-- Remove display_type column
ALTER TABLE items DROP COLUMN IF EXISTS display_type;

-- Add helpful comment for is_featured
COMMENT ON COLUMN items.is_featured IS 'Featured products are category showcase products (replaces display_type: both). Only one featured product allowed per category.';

COMMIT;

-- Verification: Check that display_type column is gone
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'items' AND column_name = 'display_type';
