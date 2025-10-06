import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductComponent } from './pages/product/product.component';
import { AdminLoginComponent } from './admin/login/admin-login.component';
import { AdminDashboardComponent } from './admin/dashboard/admin-dashboard.component';
import { AdminAuthGuard } from './admin/guards/admin-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/eiscafe-remi', pathMatch: 'full' },
  { path: 'eiscafe-remi', component: HomeComponent },
  { path: 'eiscafe-remi/tr', component: CategoriesComponent },
  { path: 'eiscafe-remi/:category', component: ProductsComponent },
  { path: 'eiscafe-remi/:category/:product', component: ProductComponent },
  // Admin routes
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminAuthGuard] },
  { path: '**', component: HomeComponent } // Fallback
];
