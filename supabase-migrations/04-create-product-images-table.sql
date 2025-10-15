-- Create product_images table for better image management
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    restaurant_slug TEXT NOT NULL DEFAULT 'eiscafe-remi',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.product_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.product_images
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.product_images
    FOR DELETE USING (auth.role() = 'authenticated');

-- Clear any existing data first
DELETE FROM public.product_images WHERE restaurant_slug = 'eiscafe-remi';

-- Insert ONLY the actual images that currently exist in your storage
-- Based on the real files found in the product-images bucket
INSERT INTO public.product_images (slug, title, storage_path, restaurant_slug, sort_order, is_active) VALUES
-- These are the ONLY images that actually exist in your storage right now
('cikolata-bardagi', 'Çikolata Bardagi', '/restaurants/eiscafe-remi/products/cikolata-bardagi.webp', 'eiscafe-remi', 1, true),
('cilek-bardagi', 'Çilek Bardagi', '/restaurants/eiscafe-remi/products/cilek-bardagi.webp', 'eiscafe-remi', 2, true),
('kivi-bardagi', 'Kivi Bardagi', '/restaurants/eiscafe-remi/products/kivi-bardagi.webp', 'eiscafe-remi', 3, true),
('mango-bardagi', 'Mango Bardagi', '/restaurants/eiscafe-remi/products/mango-bardagi.webp', 'eiscafe-remi', 4, true),
('kiraz-bardagi', 'Kiraz Bardagi', '/restaurants/eiscafe-remi/products/kiraz-bardagi.webp', 'eiscafe-remi', 5, true),
('kavun-bardagi', 'Kavun Bardagi', '/restaurants/eiscafe-remi/products/kavun-bardagi.webp', 'eiscafe-remi', 6, true),
('findik-bardagi', 'Findik Bardagi', '/restaurants/eiscafe-remi/products/findik-bardagi.webp', 'eiscafe-remi', 7, true),
('hawaii-bardagi', 'Hawaii Bardagi', '/restaurants/eiscafe-remi/products/hawaii-bardagi.webp', 'eiscafe-remi', 8, true),
('banana-split', 'Banana Split', '/restaurants/eiscafe-remi/products/banana-split.webp', 'eiscafe-remi', 9, true),
('ceviz-bardagi', 'Ceviz Bardagi', '/restaurants/eiscafe-remi/products/ceviz-bardagi.webp', 'eiscafe-remi', 10, true),
('meyve-bardagi', 'Meyve Bardagi', '/restaurants/eiscafe-remi/products/meyve-bardagi.webp', 'eiscafe-remi', 11, true),
('cupa-turkiye', 'Cupa Türkiye', '/restaurants/eiscafe-remi/products/cupa-turkiye.webp', 'eiscafe-remi', 12, true),
('spaghetti', 'Spaghetti Eis', '/restaurants/eiscafe-remi/products/spaghetti.webp', 'eiscafe-remi', 13, true),
('remi-spaghetti', 'Remi Spaghetti', '/restaurants/eiscafe-remi/products/remi-spaghetti.webp', 'eiscafe-remi', 14, true),
('cikolatali-spaghetti', 'Çikolatali Spaghetti', '/restaurants/eiscafe-remi/products/cikolata-spaghetti.webp', 'eiscafe-remi', 15, true),
('remi-special', 'Remi Special', '/restaurants/eiscafe-remi/products/remi-special.webp', 'eiscafe-remi', 16, true),
('cilekli-waffle', 'Çilekli Waffle', '/restaurants/eiscafe-remi/products/cilekli-waffle.webp', 'eiscafe-remi', 17, true),
('karamelli-waffle', 'Karamelli Waffle', '/restaurants/eiscafe-remi/products/karamelli-waffle.webp', 'eiscafe-remi', 18, true),
('kivili-waffle', 'Kivili Waffle', '/restaurants/eiscafe-remi/products/kivili-waffle.webp', 'eiscafe-remi', 19, true),
('kalpli-waffle', 'Kalpli Waffle', '/restaurants/eiscafe-remi/products/kalpli-waffle.webp', 'eiscafe-remi', 20, true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_product_images_restaurant_slug ON public.product_images(restaurant_slug);
CREATE INDEX IF NOT EXISTS idx_product_images_active ON public.product_images(is_active);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(sort_order);
