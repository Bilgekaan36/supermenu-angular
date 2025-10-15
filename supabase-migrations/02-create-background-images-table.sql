-- =====================================================
-- Migration: Create Background Images Table
-- =====================================================

-- 1. Create background_images table
CREATE TABLE IF NOT EXISTS public.background_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restaurant_slug TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  color_primary TEXT,
  color_secondary TEXT,
  style TEXT,
  sort_order INTEGER NOT NULL DEFAULT 9999,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(restaurant_slug, slug)
);

-- 2. Enable RLS
ALTER TABLE public.background_images ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
DROP POLICY IF EXISTS "bg_images_select_by_restaurant" ON public.background_images;
DROP POLICY IF EXISTS "bg_images_insert_by_restaurant" ON public.background_images;
DROP POLICY IF EXISTS "bg_images_update_by_restaurant" ON public.background_images;
DROP POLICY IF EXISTS "bg_images_delete_by_restaurant" ON public.background_images;

CREATE POLICY "bg_images_select_by_restaurant"
  ON public.background_images
  FOR SELECT
  TO authenticated
  USING (restaurant_slug = 'eiscafe-remi');

CREATE POLICY "bg_images_insert_by_restaurant"
  ON public.background_images
  FOR INSERT
  TO authenticated
  WITH CHECK (restaurant_slug = 'eiscafe-remi');

CREATE POLICY "bg_images_update_by_restaurant"
  ON public.background_images
  FOR UPDATE
  TO authenticated
  USING (restaurant_slug = 'eiscafe-remi')
  WITH CHECK (restaurant_slug = 'eiscafe-remi');

CREATE POLICY "bg_images_delete_by_restaurant"
  ON public.background_images
  FOR DELETE
  TO authenticated
  USING (restaurant_slug = 'eiscafe-remi');

-- 4. Seed existing backgrounds from your CSV data
-- NOTE: storage_path should be relative to the bucket root (restaurants/eiscafe-remi/backgrounds/filename.webp)
INSERT INTO public.background_images (restaurant_slug, slug, title, storage_path, color_primary, color_secondary, style, sort_order, is_active)
VALUES
  ('eiscafe-remi', 'capuccino-dream', 'Capuccino Dream', '/restaurants/eiscafe-remi/backgrounds/capuccino-dream.webp', '#8B7355', '#D4A574', 'warm', 1, true),
  ('eiscafe-remi', 'red-dream', 'Red Dream', '/restaurants/eiscafe-remi/backgrounds/red-dream.webp', '#C41E3A', '#FF6B6B', 'vibrant', 2, true),
  ('eiscafe-remi', 'pistachio-green', 'Pistachio Green', '/restaurants/eiscafe-remi/backgrounds/pistachio-green.webp', '#93C572', '#C8E6A0', 'fresh', 3, true),
  ('eiscafe-remi', 'cherry-dream', 'Cherry Dream', '/restaurants/eiscafe-remi/backgrounds/cherry-dream.webp', '#D2042D', '#FF69B4', 'romantic', 4, true),
  ('eiscafe-remi', 'golden-yellow', 'Golden Yellow', '/restaurants/eiscafe-remi/backgrounds/golden-yellow.webp', '#FFD700', '#FFA500', 'sunny', 5, true),
  ('eiscafe-remi', 'choco-dream', 'Choco Dream', '/restaurants/eiscafe-remi/backgrounds/choco-dream.webp', '#4A2511', '#6F4E37', 'rich', 6, true),
  ('eiscafe-remi', 'orange-dream', 'Orange Dream', '/restaurants/eiscafe-remi/backgrounds/orange-dream.webp', '#FF8C00', '#FFA07A', 'energetic', 7, true),
  ('eiscafe-remi', 'cream-white', 'Cream White', '/restaurants/eiscafe-remi/backgrounds/cream-white.webp', '#FFFDD0', '#F5F5DC', 'elegant', 8, true),
  ('eiscafe-remi', 'pinky', 'Pinky', '/restaurants/eiscafe-remi/backgrounds/pinky.webp', '#FF69B4', '#FFC0CB', 'playful', 9, true),
  ('eiscafe-remi', 'fresh-green', 'Fresh Green', '/restaurants/eiscafe-remi/backgrounds/fresh-green.webp', '#00FF00', '#90EE90', 'fresh', 10, true),
  ('eiscafe-remi', 'blues', 'Blues', '/restaurants/eiscafe-remi/backgrounds/blues.webp', '#0000FF', '#87CEEB', 'cool', 11, true),
  ('eiscafe-remi', 'sky-dream', 'Sky Dream', '/restaurants/eiscafe-remi/backgrounds/sky-dream.webp', '#87CEEB', '#B0E0E6', 'serene', 12, true),
  ('eiscafe-remi', 'peach-coral', 'Peach Coral', '/restaurants/eiscafe-remi/backgrounds/peach-coral.webp', '#FFDAB9', '#FF7F50', 'soft', 13, true),
  ('eiscafe-remi', 'cheesecake-cream', 'Cheesecake Cream', '/restaurants/eiscafe-remi/backgrounds/cheesecake-cream.webp', '#FFF8DC', '#FFEBCD', 'delicate', 14, true),
  ('eiscafe-remi', 'coffe-brown', 'Coffee Brown', '/restaurants/eiscafe-remi/backgrounds/coffe-brown.webp', '#6F4E37', '#8B4513', 'warm', 15, true)
ON CONFLICT (restaurant_slug, slug) DO NOTHING;

-- 5. Create index
CREATE INDEX IF NOT EXISTS idx_background_images_restaurant_slug ON public.background_images(restaurant_slug);

-- 6. Add updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.background_images;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.background_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration Complete
-- =====================================================

