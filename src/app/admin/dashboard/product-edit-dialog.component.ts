import { Component, Inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Item } from '../../models/item.model';
import { SupabaseService } from '../../services/supabase.service';
import { getRestaurantSlug, slugify, getFileUrl } from '../../utils/helpers';
import { ImageSelectionDialogComponent } from './image-selection-dialog.component';
import { ProductCardComponent } from '../../pages/products/components/product-card.component';
import { CategoryCardComponent } from '../../pages/categories/components/category-card.component';

export interface ProductEditData {
  item: Item;
}

@Component({
  selector: 'app-product-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    ProductCardComponent,
    CategoryCardComponent
  ],
  templateUrl: './product-edit-dialog.component.html',
  styleUrls: ['./product-edit-dialog.component.css']
})
export class ProductEditDialogComponent implements OnInit {
  form: FormGroup;
  isSubmitting = false;
  loadingImages = signal(false);
  selectedProductImage?: string;
  selectedBackgroundImage?: string;
  previewMode: 'normal' | 'featured' = 'normal';

  private categoryOptionsSignal = signal<{ label: string; value: string }[]>([]);
  public readonly categoryOptions = computed(() => this.categoryOptionsSignal());
  private productImagesSignal = signal<{ name: string; path: string; url: string }[]>([]);
  private backgroundImagesSignal = signal<{ name: string; path: string; url: string }[]>([]);
  public readonly productImages = computed(() => this.productImagesSignal());
  public readonly backgroundImages = computed(() => this.backgroundImagesSignal());
  private backgroundOptionsSignal = signal<{ title: string; path: string; style?: string }[]>([]);
  public readonly backgroundOptions = computed(() => this.backgroundOptionsSignal());

  private readonly PRODUCT_BUCKET = 'product-images';
  private readonly BACKGROUND_BUCKET = 'background-images';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductEditData,
    private supabase: SupabaseService,
    private dialog: MatDialog
  ) {
    const item = data.item;
    this.selectedProductImage = item.product_image_url || undefined;
    this.selectedBackgroundImage = item.background_image_url || undefined;

    this.form = this.fb.group({
      title: [item.title, [Validators.required, Validators.minLength(3)]],
      subtitle: [item.subtitle ?? ''],
      description: [item.description, [Validators.required, Validators.minLength(10)]],
      price: [item.price ?? 0, [Validators.required, Validators.min(0)]],
      categoryMode: ['existing', [Validators.required]],
      category: [item.category_slug ?? ''],
      new_category_title: [''],
      image_scale: [item.image_scale ?? 'md', [Validators.required]],
      text_scale: [item.text_scale ?? 'md', [Validators.required]],
      is_active: [item.is_active],
      is_available: [item.is_available ?? true],
      is_featured: [item.is_featured ?? false],
      sort_order: [item.sort_order ?? 9999, [Validators.required, Validators.min(0)]],
    });
  }

  async ngOnInit() {
    await Promise.all([this.loadCategories(), this.loadBackgroundOptions(), this.loadProductImageOptions()]);
    this.form.get('categoryMode')?.valueChanges.subscribe((mode) => {
      if (mode === 'existing') {
        this.form.get('category')?.setValidators([Validators.required]);
        this.form.get('new_category_title')?.clearValidators();
      } else {
        this.form.get('category')?.clearValidators();
        this.form.get('new_category_title')?.setValidators([Validators.required, Validators.minLength(2)]);
      }
      this.form.get('category')?.updateValueAndValidity();
      this.form.get('new_category_title')?.updateValueAndValidity();
    });
    this.form.get('categoryMode')?.updateValueAndValidity({ onlySelf: false, emitEvent: true });
  }

  private async loadCategories() {
    try {
      const cats = await this.supabase.fetchCategoriesFromTable(getRestaurantSlug());
      const options = (cats || []).map((c) => ({
        label: `${c.icon || ''} ${c.title}${c.subtitle ? ' - ' + c.subtitle : ''}`.trim(),
        value: c.slug,
      }));
      this.categoryOptionsSignal.set(options);
    } catch (e) {
      this.categoryOptionsSignal.set([]);
    }
  }

  private async loadBackgroundOptions() {
    try {
      const backgrounds = await this.supabase.fetchBackgroundImages(getRestaurantSlug());
      const options = (backgrounds || []).map((bg) => ({
        title: bg.title,
        path: bg.storagePath,
        style: bg.style,
      }));
      this.backgroundOptionsSignal.set(options);
    } catch (e) {
      this.backgroundOptionsSignal.set([]);
    }
  }

  private async loadProductImageOptions() {
    try {
      const productImages = await this.supabase.fetchProductImages(getRestaurantSlug());
      const options = (productImages || []).map((img) => ({
        name: img.title,
        path: img.storagePath,
        url: this.getImageUrl('product-images', img.storagePath),
      }));
      this.productImagesSignal.set(options);
    } catch (e) {
      this.productImagesSignal.set([]);
    }
  }

  private getImageUrl(bucket: string, path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // supabaseUrl already contains https://, so we don't need to add it again
    const baseUrl = this.supabase.supabaseUrl;
    return `${baseUrl}/storage/v1/object/public/${bucket}${cleanPath}`;
  }

  openImageSelection(type: 'product' | 'background') {
    const dialogRef = this.dialog.open(ImageSelectionDialogComponent, {
      width: '100%',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        type,
        selectedImage: type === 'product' ? this.selectedProductImage : this.selectedBackgroundImage,
        restaurantSlug: getRestaurantSlug()
      }
    });

    dialogRef.afterClosed().subscribe((selectedPath: string | undefined) => {
      if (selectedPath) {
        if (type === 'product') {
          this.selectedProductImage = selectedPath;
        } else {
          this.selectedBackgroundImage = selectedPath;
        }
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;
    this.isSubmitting = true;
    const raw = this.form.value as any;
    let category_path: string;
    if (raw.categoryMode === 'existing') category_path = raw.category;
    else category_path = slugify(raw.new_category_title || '');

    const updates = {
      title: raw.title,
      subtitle: raw.subtitle || null,
      description: raw.description,
      price: Number(raw.price),
      category_slug: category_path,
      image_scale: raw.image_scale,
      text_scale: raw.text_scale,
      is_active: !!raw.is_active,
      is_available: !!raw.is_available,
      is_featured: !!raw.is_featured,
      sort_order: Number(raw.sort_order),
      product_image_url: this.selectedProductImage,
      background_image_url: this.selectedBackgroundImage,
      display_type: (this.data.item.display_type || 'product') as any,
    } as Partial<Item>;

    this.dialogRef.close(updates);
  }

  resolveImageUrl(path?: string, type: 'product' | 'background' = 'product'): string {
    if (!path) return '';
    const p = String(path);
    console.log('resolveImageUrl called with:', p, 'type:', type);
    
    if (/^https?:\/\//i.test(p)) {
      console.log('Returning full URL:', p);
      return p;
    }
    
    // If path starts with /, it's a storage path but we need to add the correct bucket
    if (p.startsWith('/')) {
      // supabaseUrl already contains https://, so we don't need to add it again
      const baseUrl = this.supabase.supabaseUrl;
      // Choose the correct bucket based on type
      const bucket = type === 'background' ? 'background-images' : 'product-images';
      const fullUrl = `${baseUrl}/storage/v1/object/public/${bucket}${p}`;
      console.log('Generated storage URL with bucket:', fullUrl);
      return fullUrl;
    }
    
    // For relative paths, use the helper function
    const helperUrl = getFileUrl('', p);
    console.log('Generated helper URL:', helperUrl);
    return helperUrl;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    console.error('Image failed to load in preview:', img.src);
  }

  onImageLoad(event: Event) {
    console.log('Image loaded successfully in preview');
  }

  // Preview Helper Methods - Create Item objects for Frontend Components
  getPreviewProduct(): Item {
    return {
      id: 'preview',
      title: this.form.get('title')?.value || 'Produkttitel',
      subtitle: this.form.get('subtitle')?.value || '',
      description: this.form.get('description')?.value || 'Produktbeschreibung...',
      price: this.form.get('price')?.value || 0,
      category_slug: this.form.get('category')?.value || '',
      product_slug: 'preview',
      product_image_url: this.selectedProductImage || '',
      background_image_url: '',
      image_scale: this.form.get('image_scale')?.value || 'md',
      text_scale: this.form.get('text_scale')?.value || 'md',
      is_active: this.form.get('is_active')?.value || true,
      is_available: this.form.get('is_available')?.value || true,
      is_featured: this.form.get('is_featured')?.value || false,
      sort_order: this.form.get('sort_order')?.value || 0,
      display_type: 'product',
      restaurant_slug: getRestaurantSlug(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Item;
  }

  getPreviewCategoryItem(): Item {
    return {
      id: 'preview',
      title: this.form.get('title')?.value || 'Produkttitel',
      subtitle: this.form.get('subtitle')?.value || '',
      description: this.form.get('description')?.value || 'Produktbeschreibung...',
      price: this.form.get('price')?.value || 0,
      category_slug: this.form.get('category')?.value || '',
      product_slug: 'preview',
      product_image_url: this.selectedProductImage || '',
      background_image_url: this.selectedBackgroundImage || '',
      image_scale: this.form.get('image_scale')?.value || 'md',
      text_scale: this.form.get('text_scale')?.value || 'md',
      is_active: this.form.get('is_active')?.value || true,
      is_available: this.form.get('is_available')?.value || true,
      is_featured: this.form.get('is_featured')?.value || false,
      sort_order: this.form.get('sort_order')?.value || 0,
      display_type: 'category',
      restaurant_slug: getRestaurantSlug(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Item;
  }
}


