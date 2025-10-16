// src/services/supabase.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Item, Database } from '../models/item.model';
import { ProductImage, BackgroundImage, ImageWithUrl } from '../models/image.model';
import { AdminAuthService } from '../admin/services/admin-auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<any>;
  
  // Public properties for external access
  public readonly supabaseUrl: string;
  
  // Signals für State Management
  private itemsSignal = signal<Item[]>([]);
  private categoriesSignal = signal<Item[]>([]);
  private categoryProductsSignal = signal<Item[]>([]);
  private featuredProductsSignal = signal<Item[]>([]);
  private productImagesSignal = signal<ImageWithUrl[]>([]);
  private backgroundImagesSignal = signal<ImageWithUrl[]>([]);
  
  // Computed values
  public readonly items = computed(() => this.itemsSignal());
  public readonly categories = computed(() => this.categoriesSignal());
  public readonly categoryProducts = computed(() => this.categoryProductsSignal());
  public readonly featuredProducts = computed(() => this.featuredProductsSignal());
  public readonly productImages = computed(() => this.productImagesSignal());
  public readonly backgroundImages = computed(() => this.backgroundImagesSignal());

  constructor(private adminAuth: AdminAuthService) {
    // Reuse the same authenticated client to avoid lock conflicts and satisfy RLS
    this.supabase = this.adminAuth.getClient();
    // Extract Supabase URL from the client or use environment
    this.supabaseUrl = (this.supabase as any).supabaseUrl || environment.supabaseUrl;
  }

  // Test Connection Function
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('items')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }

      console.log('Supabase connection successful');
      console.log('Test data:', data);
      return true;
    } catch (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
  }

  // Fetch all items for a restaurant
  async fetchItems(restaurantSlug: string): Promise<Item[]> {
    try {
      console.log('Fetching all items for:', restaurantSlug);

      const { data, error } = await this.supabase
        .from('items')
        .select('*')
        .eq('restaurant_slug', restaurantSlug)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Items fetch error:', error);
        throw new Error(`Failed to fetch items: ${error.message}`);
      }

      console.log('Items fetched:', data?.length, 'items');
      this.itemsSignal.set(data as Item[]);
      return data as Item[];
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  }

  // Fetch categories for a restaurant
  async fetchCategories(restaurantSlug: string): Promise<Item[]> {
    try {
      console.log('Fetching categories for:', restaurantSlug);

      const { data, error } = await this.supabase
        .from('items')
        .select('*')
        .eq('restaurant_slug', restaurantSlug)
        .eq('is_featured', true) // Featured products are category showcase products
        .is('parent_id', null) // Nur Hauptkategorien
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      console.log('Categories query:', { restaurantSlug, data, error });
      if (error) {
        console.error('Categories fetch error:', error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      console.log('Categories fetched:', data?.length, 'categories');
      this.categoriesSignal.set(data as Item[]);
      return data as Item[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Fetch products for a specific category
  async fetchCategoryProducts(restaurantSlug: string, categorySlug: string): Promise<Item[]> {
    try {
      console.log('Fetching products for category:', categorySlug);

      const { data, error } = await this.supabase
        .from('items')
        .select('*')
        .eq('restaurant_slug', restaurantSlug)
        .eq('category_slug', categorySlug)
        .is('parent_id', null)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      console.log('Products data: ', data);
      if (error) {
        console.error('Category not found:', error);
        throw new Error(`Category not found: ${error.message}`);
      }

      this.categoryProductsSignal.set(data as Item[]);
      return data as Item[];
    } catch (error) {
      console.error('Error fetching category products:', error);
      throw error;
    }
  }

  // Fetch featured products
  async fetchFeaturedProducts(restaurantSlug: string, productSlug: string): Promise<Item[]> {
    try {
      const { data, error } = await this.supabase
        .from('items')
        .select('*')
        .eq('restaurant_slug', restaurantSlug)
        .eq('product_slug', productSlug)
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Featured products fetch error:', error);
        throw new Error(`Failed to fetch featured products: ${error.message}`);
      }

      console.log('Featured products fetched:', data?.length, 'products');
      this.featuredProductsSignal.set(data as Item[]);
      return data as Item[];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  }

  // ===== IMAGE MANAGEMENT =====

  // Fetch product images with display names
  async fetchProductImages(restaurantSlug: string): Promise<ImageWithUrl[]> {
    try {
      const { data, error } = await this.supabase
        .from('product_images')
        .select('*')
        .eq('restaurant_slug', restaurantSlug)
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Product images fetch error:', error);
        throw new Error(`Failed to fetch product images: ${error.message}`);
      }

      // Transform to ImageWithUrl with resolved URLs
      const imagesWithUrl: ImageWithUrl[] = (data || []).map((img: any) => {
        const url = this.resolveImageUrl(img.storage_path, 'product');
        console.log('Product image URL resolved:', { 
          storage_path: img.storage_path, 
          display_name: img.display_name, 
          url 
        });
        return {
          ...img,
          filename: img.storage_path, // Map storage_path to filename for compatibility
          title: img.title, // For compatibility with existing code
          storagePath: img.storage_path, // For compatibility with existing code
          url: url
        };
      });

      this.productImagesSignal.set(imagesWithUrl);
      return imagesWithUrl;
    } catch (error) {
      console.error('Error fetching product images:', error);
      throw error;
    }
  }

  // Fetch background images with display names
  async fetchBackgroundImages(restaurantSlug: string): Promise<ImageWithUrl[]> {
    try {
      const { data, error } = await this.supabase
        .from('background_images')
        .select('*')
        .eq('restaurant_slug', restaurantSlug)
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Background images fetch error:', error);
        throw new Error(`Failed to fetch background images: ${error.message}`);
      }

      // Transform to ImageWithUrl with resolved URLs
      const imagesWithUrl: ImageWithUrl[] = (data || []).map((img: any) => {
        const url = this.resolveImageUrl(img.storage_path, 'background');
        console.log('Background image URL resolved:', { 
          storage_path: img.storage_path, 
          display_name: img.display_name, 
          url 
        });
        return {
          ...img,
          filename: img.storage_path, // Map storage_path to filename for compatibility
          title: img.title, // For compatibility with existing code
          storagePath: img.storage_path, // For compatibility with existing code
          url: url
        };
      });

      this.backgroundImagesSignal.set(imagesWithUrl);
      return imagesWithUrl;
    } catch (error) {
      console.error('Error fetching background images:', error);
      throw error;
    }
  }

  // Update image display name
  async updateImageDisplayName(imageId: string, displayName: string, imageType: 'product' | 'background'): Promise<void> {
    try {
      const tableName = imageType === 'product' ? 'product_images' : 'background_images';
      
      const { error } = await this.supabase
        .from(tableName)
        .update({ 
          display_name: displayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId);

      if (error) {
        console.error('Update image name error:', error);
        throw new Error(`Failed to update image name: ${error.message}`);
      }

      // Refresh the images list
      const restaurantSlug = (globalThis as any).restaurantSlug || 'eiscafe-remi';
      if (imageType === 'product') {
        await this.fetchProductImages(restaurantSlug);
      } else {
        await this.fetchBackgroundImages(restaurantSlug);
      }
    } catch (error) {
      console.error('Error updating image name:', error);
      throw error;
    }
  }

  // Resolve image URL from storage path
  resolveImageUrl(storagePath: string, type: 'product' | 'background'): string {
    if (!storagePath) return '';
    
    if (/^https?:\/\//i.test(storagePath)) {
      return storagePath;
    }
    
    // Handle different path formats
    if (storagePath.startsWith('/')) {
      if (type === 'product') {
        return `${environment.supabaseUrl}/storage/v1/object/public/product-images${storagePath}`;
      } else {
        return `${environment.supabaseUrl}/storage/v1/object/public/background-images${storagePath}`;
      }
    }
    
    // Default handling
    if (type === 'product') {
      return `${environment.supabaseUrl}/storage/v1/object/public/product-images/${storagePath}`;
    } else {
      return `${environment.supabaseUrl}/storage/v1/object/public/background-images/${storagePath}`;
    }
  }

  // Generate user-friendly display name from storage path
  generateDisplayName(storagePath: string): string {
    // Extract filename from storage path (e.g., /restaurants/eiscafe-remi/products/filename.webp)
    const filename = storagePath.split('/').pop() || storagePath;
    
    // Remove file extension
    const nameWithoutExt = filename.split('.')[0];
    
    // Extract timestamp if present (format: timestamp_name)
    const parts = nameWithoutExt.split('_');
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      const timestamp = parts[0];
      const namePart = parts.slice(1).join('_');
      
      // Convert snake_case to Title Case
      const titleCase = namePart
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      return `${titleCase} (${timestamp})`;
    }
    
    // Fallback: convert filename to Title Case
    return nameWithoutExt
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Delete image from database and storage
  async deleteImage(imageId: string, filename: string, imageType: 'product' | 'background'): Promise<void> {
    try {
      // Delete from database
      const tableName = imageType === 'product' ? 'product_images' : 'background_images';
      const { error } = await this.supabase
        .from(tableName)
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      // Delete from storage
      const bucket = imageType === 'product' ? 'product-images' : 'background-images';
      await this.supabase.storage
        .from(bucket)
        .remove([filename]);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // ===== ADMIN CRUD OPERATIONS =====

  // Fetch all items for admin (including inactive)
  async fetchAllItems(restaurantSlug: string): Promise<Item[]> {
    try {
      const { data, error } = await this.supabase
        .from('items')
        .select('*')
        .eq('restaurant_slug', restaurantSlug)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Admin fetch all items error:', error);
        throw new Error(`Failed to fetch all items: ${error.message}`);
      }

      return data as Item[];
    } catch (error) {
      console.error('Error fetching all items:', error);
      throw error;
    }
  }

  // ===== STORAGE (Images) =====

  async listFiles(
    bucket: string,
    prefix: string
  ): Promise<{ name: string; path: string; url: string; size?: number; lastModified?: Date }[]> {
    const { data, error } = await this.supabase.storage.from(bucket).list(prefix, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });
    
    if (error) throw error;
    
    const base = `${prefix}`.replace(/\\/g, '/').replace(/\/\/+/g, '/');
    return (data || [])
      .filter((f) => f.name && !(f.metadata && (f.metadata as any)['isDirectory']))
      .map((f) => {
        const path = `${base}${base.endsWith('/') ? '' : '/'}${f.name}`;
        const { data: pub } = this.supabase.storage.from(bucket).getPublicUrl(path);
        return { 
          name: f.name, 
          path, 
          url: pub.publicUrl,
          size: f.metadata?.['size'],
          lastModified: f.updated_at ? new Date(f.updated_at) : undefined
        };
      });
  }

  async uploadFile(
    bucket: string,
    fullPath: string,
    file: File
  ): Promise<{ path: string; url: string }> {
    const { error } = await this.supabase.storage.from(bucket).upload(fullPath, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream',
    });
    if (error) throw error;
    const { data: pub } = this.supabase.storage.from(bucket).getPublicUrl(fullPath);
    return { path: `/${bucket}${fullPath.startsWith('/') ? '' : '/'}${fullPath}`, url: pub.publicUrl };
  }

  async deleteFileByPath(fullPath: string): Promise<void> {
    // fullPath begins with /bucket/...
    const cleaned = fullPath.startsWith('/') ? fullPath.slice(1) : fullPath;
    const firstSlash = cleaned.indexOf('/');
    if (firstSlash === -1) return;
    const bucket = cleaned.substring(0, firstSlash);
    const path = cleaned.substring(firstSlash + 1);
    await this.supabase.storage.from(bucket).remove([path]);
  }

  // Generate unique product slug
  private async generateUniqueSlug(baseSlug: string, restaurantSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.checkProductSlugExists(slug, restaurantSlug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Check if product slug exists
  private async checkProductSlugExists(slug: string, restaurantSlug: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('items')
        .select('product_slug')
        .eq('product_slug', slug)
        .eq('restaurant_slug', restaurantSlug)
        .limit(1);

      if (error) {
        console.error('Error checking product slug:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking product slug:', error);
      return false;
    }
  }

  // Check if category already has a featured product
  async checkFeaturedProductExists(restaurantSlug: string, categorySlug: string, excludeId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('items')
        .select('id')
        .eq('restaurant_slug', restaurantSlug)
        .eq('category_slug', categorySlug)
        .eq('is_featured', true)
        .eq('is_active', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking featured product:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking featured product:', error);
      return false;
    }
  }

  // Create new product with automatic slug generation
  async createProduct(productData: {
    title: string;
    subtitle?: string;
    description: string;
    price: number;
    category_slug: string;
    product_image_url?: string;
    background_image_url?: string;
    image_scale: string;
    text_scale: string;
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
  }): Promise<Item> {
    try {
      // Ensure there is a session
      const session = await this.adminAuth.getSession();
      if (!session) throw new Error('Nicht eingeloggt. Bitte im Admin-Bereich anmelden.');

      const restaurantSlug = (globalThis as any).restaurantSlug || 'eiscafe-remi';

      // Check if trying to create featured product when one already exists
      if (productData.is_featured) {
        const featuredExists = await this.checkFeaturedProductExists(restaurantSlug, productData.category_slug);
        if (featuredExists) {
          throw new Error(`Diese Kategorie hat bereits ein Featured-Produkt. Nur ein Featured-Produkt pro Kategorie erlaubt.`);
        }
      }

      // Generate unique product slug from title
      const baseSlug = this.slugify(productData.title);
      const uniqueSlug = await this.generateUniqueSlug(baseSlug, restaurantSlug);

      // Prepare complete item data
      const itemData: any = {
        ...productData,
        product_slug: uniqueSlug,
        restaurant_slug: restaurantSlug,
        parent_id: null,
        metadata: {},
        category_settings: {},
        subtitle: productData.subtitle || null
      };

      console.info('[Supabase] Creating product:', itemData.title);

      const { data, error } = await this.supabase
        .from('items')
        .insert(itemData)
        .select()
        .single();

      if (error) {
        console.error('Create product error:', error);
        throw new Error(`Produkt konnte nicht erstellt werden: ${error.message}`);
      }

      console.info('[Supabase] Product created successfully:', data.product_slug);
      return data as Item;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Helper to slugify strings
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  // Create new item (legacy method - kept for backward compatibility)
  async createItem(item: any): Promise<Item> {
    try {
      // Ensure there is a session; otherwise the RLS will block
      const session = await this.adminAuth.getSession();
      if (!session) throw new Error('Nicht eingeloggt. Bitte im Admin-Bereich anmelden.');

      // Minimal debug (no sensitive data)
      console.info('[Supabase] Creating item with fields:', Object.keys(item));

      const { data, error } = await this.supabase
        .from('items')
        .insert(item as any)
        .select()
        .single();

      if (error) {
        console.error('Create item error:', error);
        throw new Error(`Failed to create item: ${error.message}`);
      }

      return data as Item;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  // Update item
  async updateItem(id: string, updates: any): Promise<Item> {
    try {
      const { data, error } = await this.supabase
        .from('items')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update item error:', error);
        throw new Error(`Failed to update item: ${error.message}`);
      }

      return data as Item;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  // Delete item
  async deleteItem(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete item error:', error);
        throw new Error(`Failed to delete item: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  // Toggle item active status
  async toggleItemStatus(id: string, isActive: boolean): Promise<Item> {
    return this.updateItem(id, { is_active: isActive });
  }

  // Update sort order for multiple items
  async updateSortOrder(items: { id: string; sort_order: number }[]): Promise<void> {
    try {
      const updates = items.map(item => 
        this.supabase
          .from('items')
          .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() } as any)
          .eq('id', item.id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating sort order:', error);
      throw error;
    }
  }

  // ===== CATEGORIES =====

  async fetchCategoriesFromTable(restaurantSlug: string): Promise<{ slug: string; title: string; subtitle?: string; icon?: string; textColor?: string }[]> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('slug, title, subtitle, icon, text_color, sort_order')
        .eq('restaurant_slug', restaurantSlug)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []).map((c) => ({
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        icon: c.icon,
        textColor: c.text_color,
      }));
    } catch (error) {
      console.error('Error fetching categories from table:', error);
      return [];
    }
  }

  async createCategory(restaurantSlug: string, slug: string, title: string, textColor: string): Promise<void> {
    try {
      await this.supabase
        .from('categories')
        .insert({
          restaurant_slug: restaurantSlug,
          slug,
          title,
          subtitle: null,
          icon: null,
          text_color: textColor,
          sort_order: 9999,
          is_active: true,
        });
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }


  async createProductImage(imageData: {
    slug: string;
    title: string;
    storagePath: string;
    restaurantSlug: string;
    sortOrder?: number;
  }): Promise<void> {
    try {
      // Generate display_name from title or storage path
      const displayName = imageData.title || this.generateDisplayName(imageData.storagePath);
      
      const { error } = await this.supabase
        .from('product_images')
        .insert({
          slug: imageData.slug,
          title: imageData.title,
          display_name: displayName,
          storage_path: imageData.storagePath,
          restaurant_slug: imageData.restaurantSlug,
          sort_order: imageData.sortOrder || 9999,
          is_active: true
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating product image:', error);
      throw error;
    }
  }

  async createBackgroundImage(imageData: {
    slug: string;
    title: string;
    storagePath: string;
    restaurantSlug: string;
    sortOrder?: number;
    colorPrimary?: string;
    colorSecondary?: string;
    style?: string;
  }): Promise<void> {
    try {
      // Generate display_name from title or storage path
      const displayName = imageData.title || this.generateDisplayName(imageData.storagePath);
      
      const { error } = await this.supabase
        .from('background_images')
        .insert({
          slug: imageData.slug,
          title: imageData.title,
          display_name: displayName,
          storage_path: imageData.storagePath,
          restaurant_slug: imageData.restaurantSlug,
          sort_order: imageData.sortOrder || 9999,
          color_primary: imageData.colorPrimary,
          color_secondary: imageData.colorSecondary,
          style: imageData.style,
          is_active: true
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating background image:', error);
      throw error;
    }
  }
}
