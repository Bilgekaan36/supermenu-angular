// src/services/supabase.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Item, Database } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<any>;
  
  // Signals für State Management
  private itemsSignal = signal<Item[]>([]);
  private categoriesSignal = signal<Item[]>([]);
  private categoryProductsSignal = signal<Item[]>([]);
  private featuredProductsSignal = signal<Item[]>([]);
  
  // Computed values
  public readonly items = computed(() => this.itemsSignal());
  public readonly categories = computed(() => this.categoriesSignal());
  public readonly categoryProducts = computed(() => this.categoryProductsSignal());
  public readonly featuredProducts = computed(() => this.featuredProductsSignal());

  constructor() {
    // Environment Variables aus .env
    const supabaseUrl = 'https://gcanfodziyqrfpobwmyb.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjYW5mb2R6aXlxcmZwb2J3bXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTI1NTIsImV4cCI6MjA2OTc4ODU1Mn0.PS0lhRf9UXXohS-VglMNwtbHbyeeaTPOktpJhdErRvc';

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Für Public Menu nicht nötig
      },
    });
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
        .in('display_type', ['category', 'both'])
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
        .eq('category_path', categorySlug)
        .in('display_type', ['product', 'both'])
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
        .in('display_type', ['product'])
        .eq('is_featured', true)
        .eq('is_active', true)
        .eq('is_available', true)
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

  // Create new item
  async createItem(item: any): Promise<Item> {
    try {
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
}
