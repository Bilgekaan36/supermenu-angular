// src/app/utils/helpers.ts
export function getRestaurantSlug(): string {
  // Für jetzt hardcoded, später aus URL oder Environment
  return 'eiscafe-remi';
}

export function formatPrice(price?: number): string {
  if (!price) return '';
  return `${price.toFixed(2)} €`;
}

export function getImageScale(scale: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string {
  const scaleMap = {
    xs: 'w-16 h-16',
    sm: 'w-24 h-24', 
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
    xl: 'w-48 h-48'
  };
  return scaleMap[scale] || scaleMap.md;
}

export function getTextScale(scale: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string {
  const scaleMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base', 
    lg: 'text-lg',
    xl: 'text-xl'
  };
  return scaleMap[scale] || scaleMap.md;
}
