-- Migration: Populate categories table with category data
-- Date: 2025-01-16
-- Description: Insert category metadata for eiscafe-remi restaurant

BEGIN;

-- Step 1: Ensure categories table exists
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    icon VARCHAR(255),
    text_color VARCHAR(7) DEFAULT '#1a1a1a',
    restaurant_slug VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 9999,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_slug 
ON categories (restaurant_slug, slug);

-- Step 3: Insert category data for eiscafe-remi
INSERT INTO categories (slug, title, subtitle, text_color, restaurant_slug, sort_order, is_active) 
VALUES 
    ('eisdesserts', 'Eisdesserts', 'Kühle Köstlichkeiten', '#ffffff', 'eiscafe-remi', 1, true),
    ('waffeln', 'Waffeln', 'Warme Waffeln', '#ffffff', 'eiscafe-remi', 2, true),
    ('getränke', 'Getränke', 'Erfrischende Drinks', '#ffffff', 'eiscafe-remi', 3, true),
    ('snacks', 'Snacks', 'Kleine Leckereien', '#ffffff', 'eiscafe-remi', 4, true)
ON CONFLICT (restaurant_slug, slug) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    text_color = EXCLUDED.text_color,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Step 4: Add RLS policy if needed
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access for categories
CREATE POLICY IF NOT EXISTS "Categories are viewable by everyone" 
ON categories FOR SELECT 
USING (true);

COMMIT;
