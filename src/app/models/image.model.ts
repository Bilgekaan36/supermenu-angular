// src/models/image.model.ts
export interface ProductImage {
  id: string;
  filename: string;
  display_name: string;        // User-friendly editable name
  description?: string;        // Optional description
  restaurant_slug: string;
  created_at: string;
  updated_at: string;
}

export interface BackgroundImage {
  id: string;
  filename: string;
  display_name: string;        // User-friendly editable name  
  description?: string;        // Optional description
  restaurant_slug: string;
  created_at: string;
  updated_at: string;
}

// Helper type for image selection
export interface ImageWithUrl {
  id: string;
  filename: string;
  display_name: string;
  description?: string;
  url: string;                 // Full resolved URL
  restaurant_slug: string;
  created_at: string;
  updated_at: string;
}
