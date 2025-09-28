// src/app/pages/products/components/product-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Item } from '../../../models/item.model';
import { formatPrice, getFileUrl, getImageSizeClasses } from '../../../utils/helpers';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  @Input() product!: Item;

  constructor(private router: Router) {}

  navigateToProduct(): void {
    this.router.navigate([`/eiscafe-remi/${this.product.category_path}/${this.product.product_slug}`]);
  }

  getFormattedPrice(): string {
    return formatPrice(this.product.price);
  }

  getImageUrl(): string {
    return getFileUrl('', this.product.product_image_url || '');
  }

  getImageSizeClass(): string {
    return getImageSizeClasses(this.product.image_scale, 'large');
  }
}
