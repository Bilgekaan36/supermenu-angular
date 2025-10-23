// src/app/utils/helpers.ts
import { SupabaseService } from '../services/supabase.service';

export function getRestaurantSlug(): string {
  // Für jetzt hardcoded, später aus URL oder Environment
  return 'eiscafe-remi';
}

export function formatPrice(price?: number): string {
  if (!price) return '';
  return `₺${price.toFixed(2).replace('.', ',')}`;
}

// Generate URL-safe slugs from titles
export function slugify(input: string): string {
  return (input || '')
    .toString()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .trim()
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores
    .replace(/^-+|-+$/g, '') // trim dashes
    .toLowerCase();
}

// Helper function für responsive Bildgrößen (erweitert)
export function getImageSizeClasses(
  scale: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' = 'md',
  variant: 'normal' | 'large' | 'extraLarge' = 'normal'
): string {
  const sizeMap = {
    normal: {
      xs: 'image-xs-normal',
      sm: 'image-sm-normal',
      md: 'image-md-normal',
      lg: 'image-lg-normal',
      xl: 'image-xl-normal',
      xxl: 'image-xxl-normal',
    },
    large: {
      xs: 'image-xs-large',
      sm: 'image-sm-large',
      md: 'image-md-large',
      lg: 'image-lg-large',
      xl: 'image-xl-large',
      xxl: 'image-xxl-large',
    },
    extraLarge: {
      xs: 'image-xs-extra',
      sm: 'image-sm-extra',
      md: 'image-md-extra',
      lg: 'image-lg-extra',
      xl: 'image-xl-extra',
      xxl: 'image-xxl-extra',
    },
  };

  return sizeMap[variant][scale] || sizeMap[variant]['md'];
}

// Helper function für Textgrößen mit line-height
export function getTextSizeClasses(
  scale: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' = 'md',
  variant: 'normal' | 'compact' | 'display' | 'hero' = 'normal'
): string {
  const sizeMap = {
    // Normal - Standard für Produktkarten und allgemeine Texte
    normal: {
      xs: 'text-normal-xs',
      sm: 'text-normal-sm',
      md: 'text-normal-md',
      lg: 'text-normal-lg',
      xl: 'text-normal-xl',
      xxl: 'text-normal-xxl',
    },
    // Compact - Für dichte Layouts, Listen, kleine Karten
    compact: {
      xs: 'text-compact-xs',
      sm: 'text-compact-sm',
      md: 'text-compact-md',
      lg: 'text-compact-lg',
      xl: 'text-compact-xl',
      xxl: 'text-compact-xxl',
    },
    // Display - Für Produktdetails, Featured Content
    display: {
      xs: 'text-display-xs',
      sm: 'text-display-sm',
      md: 'text-display-md',
      lg: 'text-display-lg',
      xl: 'text-display-xl',
      xxl: 'text-display-xxl',
    },
    // Hero - Für Landing Pages, Hero Sections, Marketing
    hero: {
      xs: 'text-hero-xs',
      sm: 'text-hero-sm',
      md: 'text-hero-md',
      lg: 'text-hero-lg',
      xl: 'text-hero-xl',
      xxl: 'text-hero-xxl',
    },
  };

  return sizeMap[variant][scale] || sizeMap[variant]['md'];
}

// Supabase Storage URL für Bilder (flexible version)
export function getFileUrl(bucket: string, path: string): string {
  // Use hardcoded URL for now to avoid circular dependency
  const supabaseUrl = 'https://gcanfodziyqrfpobwmyb.supabase.co';
  
  // If path is empty, return empty string
  if (!path) {
    console.debug('[getFileUrl] Empty path provided');
    return '';
  }
  
  // If path is already a full URL, return it as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    console.debug('[getFileUrl] Full URL detected:', path);
    return path;
  }
  
  // If path starts with /, it's a storage path and we need to detect the bucket
  if (path.startsWith('/')) {
    // Detect bucket based on path pattern
    if (path.includes('/products/')) {
      const url = `${supabaseUrl}/storage/v1/object/public/product-images${path}`;
      console.debug('[getFileUrl] Product image detected:', path, '→', url);
      return url;
    } else if (path.includes('/backgrounds/')) {
      const url = `${supabaseUrl}/storage/v1/object/public/background-images${path}`;
      console.debug('[getFileUrl] Background image detected:', path, '→', url);
      return url;
    }
    // Fallback: if bucket is provided, use it
    if (bucket) {
      const url = `${supabaseUrl}/storage/v1/object/public/${bucket}${path}`;
      console.debug('[getFileUrl] Using bucket fallback:', bucket, path, '→', url);
      return url;
    }
  }
  
  // Legacy format: bucket + path
  const url = `${supabaseUrl}/storage/v1/object/public/${bucket}${path}`;
  console.debug('[getFileUrl] Legacy format:', bucket, path, '→', url);
  return url;
}

// Extract storage bucket and path from a public URL
export function getStoragePathFromUrl(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf('/storage/v1/object/public/');
    if (idx === -1) return null;
    const after = u.pathname.substring(idx + '/storage/v1/object/public/'.length);
    const firstSlash = after.indexOf('/');
    if (firstSlash === -1) return null;
    const bucket = after.substring(0, firstSlash);
    const path = after.substring(firstSlash);
    return { bucket, path };
  } catch {
    return null;
  }
}
