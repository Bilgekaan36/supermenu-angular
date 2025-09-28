// src/app/pages/home/home.component.ts
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  protected readonly title = signal('Eiscafé Remi');

  constructor(private router: Router) {}

  handleHomeClick(): void {
    this.router.navigate(['/eiscafe-remi/tr']);
  }
}
