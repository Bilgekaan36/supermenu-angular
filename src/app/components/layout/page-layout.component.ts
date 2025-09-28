// src/app/components/layout/page-layout.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './page-layout.component.html',
  styleUrls: ['./page-layout.component.css']
})
export class PageLayoutComponent {
  constructor(private router: Router) {}

  get shouldShowHeader(): boolean {
    return this.router.url !== '/eiscafe-remi';
  }
}
