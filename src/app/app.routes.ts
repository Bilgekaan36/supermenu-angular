import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CategoriesComponent } from './pages/categories/categories.component';

export const routes: Routes = [
  { path: '', redirectTo: '/eiscafe-remi', pathMatch: 'full' },
  { path: 'eiscafe-remi', component: HomeComponent },
  { path: 'eiscafe-remi/tr', component: CategoriesComponent },
  // TODO: Add ProductsPage and ProductPage routes
  { path: '**', component: HomeComponent } // Fallback
];
