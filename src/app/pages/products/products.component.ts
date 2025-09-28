// src/app/pages/products/products.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { getRestaurantSlug } from '../../utils/helpers';
import { Item } from '../../models/item.model';
import { ProductCardComponent } from './components/product-card.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  protected readonly products = signal<Item[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categorySlug = signal<string>('');

  constructor(
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const restaurantSlug = getRestaurantSlug();
      const categorySlug = this.route.snapshot.paramMap.get('category') || '';
      
      this.categorySlug.set(categorySlug);
      
      const productsData = await this.supabaseService.fetchCategoryProducts(restaurantSlug, categorySlug);
      this.products.set(productsData);
      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading products:', error);
      this.error.set(error instanceof Error ? error.message : 'Unknown error');
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/eiscafe-remi/tr']);
  }
}
