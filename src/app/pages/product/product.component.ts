// src/app/pages/product/product.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { getRestaurantSlug, formatPrice, getFileUrl } from '../../utils/helpers';
import { Item } from '../../models/item.model';
import { ProductCarouselCardComponent } from './components/product-carousel-card.component';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, ProductCarouselCardComponent],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {
  protected readonly product = signal<Item | null>(null);
  protected readonly relatedProducts = signal<Item[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categorySlug = signal<string>('');
  protected readonly productSlug = signal<string>('');

  constructor(
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const restaurantSlug = getRestaurantSlug();
      const categorySlug = this.route.snapshot.paramMap.get('category') || '';
      const productSlug = this.route.snapshot.paramMap.get('product') || '';
      
      this.categorySlug.set(categorySlug);
      this.productSlug.set(productSlug);
      
      // Lade alle Produkte der Kategorie
      const productsData = await this.supabaseService.fetchCategoryProducts(restaurantSlug, categorySlug);
      
      // Finde das aktuelle Produkt
      const currentProduct = productsData.find(p => p.product_slug === productSlug);
      if (currentProduct) {
        this.product.set(currentProduct);
      }
      
      // Setze verwandte Produkte (alle anderen der Kategorie)
      const related = productsData.filter(p => p.product_slug !== productSlug);
      this.relatedProducts.set(related);
      
      this.isLoading.set(false);
    } catch (error) {
      console.error('Error loading product:', error);
      this.error.set(error instanceof Error ? error.message : 'Unknown error');
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate([`/eiscafe-remi/${this.categorySlug()}`]);
  }

  getFormattedPrice(): string {
    const product = this.product();
    if (!product?.price) return '';
    return formatPrice(product.price);
  }

  getImageUrl(): string {
    const product = this.product();
    if (!product?.product_image_url) return '';
    return getFileUrl('', product.product_image_url);
  }
}
