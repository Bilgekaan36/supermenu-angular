// src/app/pages/categories/components/category-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Item } from '../../../models/item.model';
import { getFileUrl, getImageSizeClasses, getTextSizeClasses } from '../../../utils/helpers';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-card.component.html',
  styleUrls: ['./category-card.component.css']
})
export class CategoryCardComponent {
  @Input() item!: Item;

  constructor(private router: Router) {}

  navigateToCategory(): void {
    this.router.navigate([`/eiscafe-remi/${this.item.category_path}`]);
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
    return getTextSizeClasses(this.item.category_settings?.text_scale, 'normal');
  }
}
