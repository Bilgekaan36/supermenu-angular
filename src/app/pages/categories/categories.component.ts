// src/app/pages/categories/categories.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { getRestaurantSlug } from '../../utils/helpers';
import { Item } from '../../models/item.model';
import { CategoryCardComponent } from './components/category-card.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, CategoryCardComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {
  protected readonly categories = signal<Item[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    try {
      const restaurantSlug = getRestaurantSlug();
      const categoriesData = await this.supabaseService.fetchCategories(restaurantSlug);
      this.categories.set(categoriesData);
      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading categories:', error);
      this.error.set(error instanceof Error ? error.message : 'Unknown error');
      this.isLoading.set(false);
    }
  }
}
