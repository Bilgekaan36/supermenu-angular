// src/models/item.model.ts
export interface Item {
  // PostgreSQL Standard-Felder
  id: string; // UUID
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp

  // Restaurant identification
  restaurant_slug: string; // 'eiscafe-remi'

  // Basis Identifikation
  product_slug: string;
  title: string;
  subtitle?: string;
  description: string;

  // Hierarchie & Kategorisierung
  parent_id?: string; // UUID reference to parent item
  category_slug?: string;

  // Preisgestaltung
  price?: number;

  // Bilder & Darstellung (URLs)
  product_image_url?: string;
  background_image_url?: string;
  image_scale: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  text_scale: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  // Status & Sortierung
  is_active: boolean;        // Sichtbarkeit im Frontend (true = sichtbar, false = nur Admin)
  is_featured: boolean;      // Spezielle Hervorhebung
  sort_order: number;

  // Produktspezifische Daten (JSONB)
  metadata: {
    ingredients?: string[];
    allergens?: string[];
    variants?: ItemVariant[];
  };

  // Meta-Information für Frontend-Logik
  display_type: 'category' | 'product' | 'both';
  category_settings: CategoryDisplaySettings;
}

export interface ItemVariant {
  id: string;
  title: string;
  priceModifier: number;
  isDefault: boolean;
}

export interface CategoryDisplaySettings {
  showSubProducts: boolean;
}

// Database Types (für bessere Type Safety)
export interface Database {
  public: {
    Tables: {
      items: {
        Row: Item;
        Insert: Omit<Item, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Item, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
