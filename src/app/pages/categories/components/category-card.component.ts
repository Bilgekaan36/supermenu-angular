// src/app/pages/categories/components/category-card.component.ts
import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Item } from '../../../models/item.model';
import { SupabaseService } from '../../../services/supabase.service';
import { getFileUrl, getImageSizeClasses, getTextSizeClasses, getRestaurantSlug } from '../../../utils/helpers';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-card.component.html',
  styleUrls: ['./category-card.component.css']
})
export class CategoryCardComponent implements OnInit {
  @Input() item!: Item;
  categoryTitle = signal<string>('');
  categorySubtitle = signal<string>('');
  categoryTextColor = signal<string>('#1a1a1a');

  constructor(private router: Router, private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadCategoryMeta();
  }

  private async loadCategoryMeta() {
    if (!this.item.category_slug) return;
    try {
      const cats = await this.supabase.fetchCategoriesFromTable(getRestaurantSlug());
      const match = cats.find((c) => c.slug === this.item.category_slug);
      if (match) {
        this.categoryTitle.set(match.title || '');
        this.categorySubtitle.set(match.subtitle || '');
        this.categoryTextColor.set(match.textColor || '#1a1a1a');
      }
    } catch (e) {
      console.error('Failed to load category meta:', e);
    }
  }

  navigateToCategory(): void {
    this.router.navigate([`/eiscafe-remi/${this.item.category_slug}`]);
  }

  getImageUrl(): string {
    return getFileUrl('', this.item.product_image_url || '');
  }

  getBackgroundUrl(): string {
    return getFileUrl('', this.item.background_image_url || '');
  }

  getImageSizeClass(): string {
    return getImageSizeClasses(this.item.image_scale, 'large');
  }

  getTextSizeClass(): string {
    return getTextSizeClasses(this.item.text_scale || 'md', 'normal');
  }
}
