-- =====================================================
-- Migration: Create Categories Table & Migrate Data
-- =====================================================

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restaurant_slug TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon TEXT,
  text_color TEXT NOT NULL DEFAULT '#1a1a1a',
  sort_order INTEGER NOT NULL DEFAULT 9999,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(restaurant_slug, slug)
);

-- 2. Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for categories (same pattern as items)
DROP POLICY IF EXISTS "categories_select_by_restaurant" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_by_restaurant" ON public.categories;
DROP POLICY IF EXISTS "categories_update_by_restaurant" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_by_restaurant" ON public.categories;

CREATE POLICY "categories_select_by_restaurant"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (restaurant_slug = 'eiscafe-remi');

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

-- 4. Insert default categories extracted from CSV
INSERT INTO public.categories (restaurant_slug, slug, title, subtitle, icon, text_color, sort_order, is_active)
VALUES
  ('eiscafe-remi', 'sunum-dondurmalar', 'Dondurma', 'Sunum Dondurmalar', '🍨', '#6F4E37', 1, true),
  ('eiscafe-remi', 'waffle-dondurmalar', 'Waffle', 'Waffle Dondurmalar', '🧇', '#D4A574', 2, true),
  ('eiscafe-remi', 'kokteyl', 'Kokteyl', 'Kokteyller', '🍹', '#FF6B9D', 3, true),
  ('eiscafe-remi', 'soguk-icecekler', 'İçecek', 'Soğuk İçecekler', '🥤', '#4A90E2', 4, true),
  ('eiscafe-remi', 'tatlilar', 'Tatlı', 'Tatlılar', '🍰', '#C41E3A', 5, true),
  ('eiscafe-remi', 'cocuk-dondurmalar', 'Çocuk', 'Çocuk Dondurmaları', '🧒', '#FFD700', 6, true)
ON CONFLICT (restaurant_slug, slug) DO NOTHING;

-- 5. Rename items.category_path to items.category_slug for clarity
ALTER TABLE public.items RENAME COLUMN category_path TO category_slug;

-- 6. Add foreign key constraint (optional but recommended)
-- Note: This will fail if there are existing items with category_slug not in categories.
-- Run a data cleanup first if needed:
-- UPDATE public.items SET category_slug = NULL WHERE category_slug NOT IN (SELECT slug FROM public.categories WHERE restaurant_slug = items.restaurant_slug);

-- Uncomment to enforce FK:
-- ALTER TABLE public.items
--   ADD CONSTRAINT fk_items_category
--   FOREIGN KEY (category_slug)
--   REFERENCES public.categories(slug)
--   ON DELETE SET NULL;

-- 7. Create index for performance
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_slug ON public.categories(restaurant_slug);
CREATE INDEX IF NOT EXISTS idx_items_category_slug ON public.items(category_slug);

-- 8. Add updated_at trigger for categories
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.categories;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration Complete
-- =====================================================

