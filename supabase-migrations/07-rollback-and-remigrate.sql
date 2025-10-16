-- Migration: Rollback and re-migrate display_type removal
-- Date: 2025-01-16
-- Description: If you need to rollback and redo the migration

BEGIN;

-- Step 1: Add display_type column back (if needed)
ALTER TABLE items ADD COLUMN IF NOT EXISTS display_type VARCHAR(20) DEFAULT 'product';

-- Step 2: Restore display_type values based on is_featured
UPDATE items 
SET display_type = 'both' 
WHERE is_featured = true;

UPDATE items 
SET display_type = 'product' 
WHERE is_featured = false;

-- Step 3: Now remove display_type properly
ALTER TABLE items DROP COLUMN IF EXISTS display_type;

COMMIT;

-- Verification
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'items' AND column_name = 'display_type';
