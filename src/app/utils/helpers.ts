// src/app/utils/helpers.ts
import { SupabaseService } from '../services/supabase.service';

export function getRestaurantSlug(): string {
  // Für jetzt hardcoded, später aus URL oder Environment
  return 'eiscafe-remi';
}

export function formatPrice(price?: number): string {
  if (!price) return '';
  return `€${price.toFixed(2).replace('.', ',')}`;
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

// Supabase Storage URL für Bilder
export function getFileUrl(bucket: string, path: string): string {
  const supabaseUrl = 'https://gcanfodziyqrfpobwmyb.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/${bucket}${path}`;
}
