import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
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

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
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
    MatTooltipModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
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
  displayedColumns = ['title', 'price', 'actions'];

  // Computed values
  public readonly allItems = computed(() => this.allItemsSignal());
  public readonly loading = computed(() => this.loadingSignal());
  public readonly error = computed(() => this.errorSignal());

  // Computed für Produkte
  public readonly products = computed(() => 
    this.allItems().filter(item => 
      item.display_type === 'product' || item.display_type === 'both'
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
    private snackBar: MatSnackBar
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
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchLower) ||
        (product.subtitle && product.subtitle.toLowerCase().includes(searchLower)) ||
        (product.description && product.description.toLowerCase().includes(searchLower)) ||
        (product.category_path && product.category_path.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (this.statusFilter === 'active') return product.is_active;
        if (this.statusFilter === 'inactive') return !product.is_active;
        return true;
      });
    }

    // Category filter
    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category_path === this.categoryFilter);
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
    return this.products().filter(p => p.is_active).length;
  }

  getInactiveProductsCount(): number {
    return this.products().filter(p => !p.is_active).length;
  }

  getUniqueCategories(): string[] {
    const categories = this.products()
      .map(p => p.category_path)
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
    // TODO: Navigate to edit form
    console.log('Edit item:', item);
    this.snackBar.open(`Bearbeitung für "${item.title}" wird implementiert`, 'Schließen', { duration: 3000 });
  }

  createNewItem(type: 'product') {
    // TODO: Navigate to create form
    console.log('Create new product:', type);
    this.snackBar.open('Produkterstellung wird implementiert', 'Schließen', { duration: 3000 });
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
}


