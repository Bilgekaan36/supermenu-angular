// src/services/supabase.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Item, Database } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;
  
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
    const supabaseUrl = 'YOUR_SUPABASE_URL'; // TODO: Set from environment
    const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // TODO: Set from environment

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key are required');
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
}
