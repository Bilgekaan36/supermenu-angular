import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { getRestaurantSlug, slugify, getFileUrl, getStoragePathFromUrl } from '../../utils/helpers';
import { AdminAuthService } from '../services/admin-auth.service';
import { Item } from '../../models/item.model';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductCreateDialogComponent } from './product-create-dialog.component';
import { ProductEditDialogComponent } from './product-edit-dialog.component';
import { ImageSelectionDialogComponent } from './image-selection-dialog.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  // Signals für State Management
  private allItemsSignal = signal<Item[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private filteredProductsSignal = signal<Item[]>([]);

  // Filter and Pagination Properties
  searchTerm = '';
  statusFilter = 'all';
  categoryFilter = 'all';
  sortField = 'title';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage = 1;
  itemsPerPage = 10;

  // Table Configuration
  displayedColumns = ['media', 'title', 'price', 'actions'];

  // Computed values
  public readonly allItems = computed(() => this.allItemsSignal());
  public readonly loading = computed(() => this.loadingSignal());
  public readonly error = computed(() => this.errorSignal());

  // Computed für Produkte
  public readonly products = computed(() =>
    this.allItems().filter(
      (item) => item.display_type === 'product' || item.display_type === 'both'
    )
  );

  // Computed für gefilterte Produkte
  public readonly filteredProducts = computed(() => this.filteredProductsSignal());

  // Computed für paginierte Produkte
  public readonly paginatedProducts = computed(() => {
    const filtered = this.filteredProducts();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  });

  constructor(
    private supabaseService: SupabaseService,
    private auth: AdminAuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.loadData();
    this.applyFilters(); // Initial filter application
  }

  async loadData() {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const items = await this.supabaseService.fetchAllItems('eiscafe-remi');
      this.allItemsSignal.set(items);
      this.applyFilters();
    } catch (error) {
      console.error('Error loading data:', error);
      const errorMessage = 'Fehler beim Laden der Daten';
      this.errorSignal.set(errorMessage);
      this.snackBar.open(errorMessage, 'Schließen', { duration: 5000 });
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Filter and Search Methods
  applyFilters() {
    let filtered = [...this.products()];

    // Search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchLower) ||
          (product.subtitle && product.subtitle.toLowerCase().includes(searchLower)) ||
          (product.description && product.description.toLowerCase().includes(searchLower)) ||
          (product.category_slug && product.category_slug.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((product) => {
        if (this.statusFilter === 'active') return product.is_active;
        if (this.statusFilter === 'inactive') return !product.is_active;
        return true;
      });
    }

    // Category filter
    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter((product) => product.category_slug === this.categoryFilter);
    }

    this.filteredProductsSignal.set(filtered);
    this.applySorting();
    this.currentPage = 1; // Reset to first page when filtering
  }

  applySorting() {
    const filtered = [...this.filteredProducts()];

    filtered.sort((a, b) => {
      let aValue: any = a[this.sortField as keyof Item];
      let bValue: any = b[this.sortField as keyof Item];

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Convert to lowercase for string comparison
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredProductsSignal.set(filtered);
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applySorting();
  }

  // Statistics Methods
  getActiveProductsCount(): number {
    return this.products().filter((p) => p.is_active).length;
  }

  getInactiveProductsCount(): number {
    return this.products().filter((p) => !p.is_active).length;
  }

  getUniqueCategories(): string[] {
    const categories = this.products()
      .map((p) => p.category_slug)
      .filter((category): category is string => !!category);
    return [...new Set(categories)].sort();
  }

  // Pagination Methods
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredProducts().length / this.itemsPerPage);
  }

  // CRUD Operations
  async toggleItemStatus(item: Item) {
    try {
      await this.supabaseService.toggleItemStatus(item.id, !item.is_active);
      await this.loadData();
      this.snackBar.open(
        `Produkt "${item.title}" wurde ${item.is_active ? 'deaktiviert' : 'aktiviert'}`,
        'Schließen',
        { duration: 3000 }
      );
    } catch (error) {
      console.error('Error toggling item status:', error);
      const errorMessage = 'Fehler beim Ändern des Status';
      this.errorSignal.set(errorMessage);
      this.snackBar.open(errorMessage, 'Schließen', { duration: 5000 });
    }
  }

  async deleteItem(item: Item) {
    if (!confirm(`Möchten Sie "${item.title}" wirklich löschen?`)) {
      return;
    }

    try {
      await this.supabaseService.deleteItem(item.id);
      await this.loadData();
      this.snackBar.open(`Produkt "${item.title}" wurde gelöscht`, 'Schließen', { duration: 3000 });
    } catch (error) {
      console.error('Error deleting item:', error);
      const errorMessage = 'Fehler beim Löschen des Elements';
      this.errorSignal.set(errorMessage);
      this.snackBar.open(errorMessage, 'Schließen', { duration: 5000 });
    }
  }

  editItem(item: Item) {
    const dialogRef = this.dialog.open(ProductEditDialogComponent, {
      width: '100%',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { item },
    });

    dialogRef.afterClosed().subscribe(async (updates) => {
      if (!updates) return;
      try {
        this.loadingSignal.set(true);
        await this.supabaseService.updateItem(item.id, updates);

        // Cleanup old images if paths changed
        const deletions: string[] = [];
        const oldProductPath = item.product_image_url;
        const newProductPath = (updates as any).product_image_url;
        if (oldProductPath && oldProductPath !== newProductPath) {
          const parsed = oldProductPath.startsWith('/')
            ? { bucket: oldProductPath.split('/')[1], path: oldProductPath.substring(oldProductPath.indexOf('/', 1)) }
            : getStoragePathFromUrl(oldProductPath);
          if (parsed) deletions.push(`/${parsed.bucket}${parsed.path}`);
        }
        const oldBgPath = item.background_image_url;
        const newBgPath = (updates as any).background_image_url;
        if (oldBgPath && oldBgPath !== newBgPath) {
          const parsed = oldBgPath.startsWith('/')
            ? { bucket: oldBgPath.split('/')[1], path: oldBgPath.substring(oldBgPath.indexOf('/', 1)) }
            : getStoragePathFromUrl(oldBgPath);
        	if (parsed) deletions.push(`/${parsed.bucket}${parsed.path}`);
        }
        if (deletions.length) {
          await Promise.all(deletions.map((full) => this.supabaseService.deleteFileByPath(full)));
        }
        await this.loadData();
        this.snackBar.open(`Produkt "${item.title}" wurde aktualisiert`, 'Schließen', { duration: 3000 });
      } catch (error) {
        console.error('Error updating product:', error);
        this.snackBar.open('Fehler beim Aktualisieren des Produkts', 'Schließen', { duration: 5000 });
      } finally {
        this.loadingSignal.set(false);
      }
    });
  }

  createNewItem(type: 'product') {
    const dialogRef = this.dialog.open(ProductCreateDialogComponent, {
      width: '100%',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { type },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          this.loadingSignal.set(true);
          const nowIso = new Date().toISOString();
          const insertPayload = {
            restaurant_slug: getRestaurantSlug(),
            product_slug: slugify(result.title),
            title: result.title,
            subtitle: (result as any).subtitle ?? null,
            description: result.description,
            parent_id: null,
            category_slug: result.category,
            price: Number(result.price),
            product_image_url: (result as any).product_image_url ?? null,
            background_image_url: (result as any).background_image_url ?? null,
            image_scale: (result as any).image_scale ?? 'md',
            text_scale: (result as any).text_scale ?? 'md',
            is_active: !!(result as any).is_active,
            is_available: !!(result as any).is_available,
            is_featured: !!(result as any).is_featured,
            sort_order: Number((result as any).sort_order ?? 9999),
            metadata: {},
            display_type: result.display_type,
            category_settings: {
              showSubProducts: false,
            },
            created_at: nowIso,
            updated_at: nowIso,
          } as any;

          await this.supabaseService.createItem(insertPayload);
          await this.loadData();
          this.snackBar.open(`Produkt "${result.title}" wurde erfolgreich erstellt`, 'Schließen', {
            duration: 3000,
          });
        } catch (error) {
          console.error('Error creating product:', error);
          this.errorSignal.set('Fehler beim Erstellen des Produkts');
          this.snackBar.open('Fehler beim Erstellen des Produkts', 'Schließen', { duration: 5000 });
        } finally {
          this.loadingSignal.set(false);
        }
      }
    });
  }

  async logout() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/admin/login']);
    } catch (error) {
      console.error('Logout error:', error);
      this.snackBar.open('Fehler beim Abmelden', 'Schließen', { duration: 3000 });
    }
  }

  clearError() {
    this.errorSignal.set(null);
  }

  // Resolve storage paths to public URLs
  resolveImageUrl(path?: string | null): string {
    if (!path) return '';
    const p = String(path);
    if (/^https?:\/\//i.test(p)) return p;
    // Legacy local paths mapped to storage buckets
    const stripLeading = (s: string) => (s.startsWith('/') ? s.slice(1) : s);
    const local = stripLeading(p);
    if (local.startsWith('product-images/')) {
      const remainder = local.replace(/^product-images\//, '');
      return getFileUrl('product-images', `/${remainder}`);
    }
    if (local.startsWith('background-images/')) {
      const remainder = local.replace(/^background-images\//, '');
      return getFileUrl('background-images', `/${remainder}`);
    }
    // Default to public bucket
    const normalized = p.startsWith('/') ? p : `/${p}`;
    return getFileUrl('public', normalized);
  }
}


