import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductComponent } from './pages/product/product.component';

export const routes: Routes = [
  { path: '', redirectTo: '/eiscafe-remi', pathMatch: 'full' },
  { path: 'eiscafe-remi', component: HomeComponent },
  { path: 'eiscafe-remi/tr', component: CategoriesComponent },
  { path: 'eiscafe-remi/:category', component: ProductsComponent },
  { path: 'eiscafe-remi/:category/:product', component: ProductComponent },
  { path: '**', component: HomeComponent } // Fallback
];
