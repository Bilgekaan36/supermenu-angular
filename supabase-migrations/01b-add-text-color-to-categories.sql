-- =====================================================
-- Migration: Add text_color to existing categories table
-- =====================================================

-- 1. Add text_color column if not exists
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS text_color TEXT NOT NULL DEFAULT '#1a1a1a';

-- 2. Update existing categories with custom colors
UPDATE public.categories
SET text_color = CASE slug
  WHEN 'sunum-dondurmalar' THEN '#6F4E37'
  WHEN 'waffle-dondurmalar' THEN '#D4A574'
  WHEN 'kokteyl' THEN '#FF6B9D'
  WHEN 'soguk-icecekler' THEN '#4A90E2'
  WHEN 'tatlilar' THEN '#C41E3A'
  WHEN 'cocuk-dondurmalar' THEN '#FFD700'
  ELSE '#1a1a1a'
END
WHERE restaurant_slug = 'eiscafe-remi';

-- =====================================================
-- Migration Complete
-- =====================================================

