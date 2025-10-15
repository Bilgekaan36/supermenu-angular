-- =====================================================
-- Migration: Cleanup category_settings JSONB
-- =====================================================

-- Remove redundant fields from category_settings:
-- - categoryTitle (now in categories.title)
-- - categorySubtitle (now in categories.subtitle)
-- - text_scale (now in items.text_scale)

-- Only keep UI-specific flags like showSubProducts

UPDATE public.items
SET category_settings = jsonb_build_object(
  'showSubProducts', 
  COALESCE((category_settings->>'showSubProducts')::boolean, false)
)
WHERE category_settings IS NOT NULL
  AND category_settings != '{}'::jsonb;

-- For items with empty or null category_settings, set default
UPDATE public.items
SET category_settings = jsonb_build_object('showSubProducts', false)
WHERE category_settings IS NULL 
   OR category_settings = '{}'::jsonb;

-- =====================================================
-- Migration Complete
-- =====================================================

