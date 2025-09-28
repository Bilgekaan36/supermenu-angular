// src/app/pages/categories/components/category-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Item } from '../../../models/item.model';

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
}
