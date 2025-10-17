import { Component, Inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupabaseService } from '../../services/supabase.service';
import { getRestaurantSlug, slugify, getFileUrl } from '../../utils/helpers';
import { ImageSelectionDialogComponent } from './image-selection-dialog.component';
import { ProductCardComponent } from '../../pages/products/components/product-card.component';
import { CategoryCardComponent } from '../../pages/categories/components/category-card.component';
import { Item } from '../../models/item.model';
import { ImageWithUrl } from '../../models/image.model';

export interface ProductCreateDialogData {
  restaurantSlug?: string;
}

@Component({
  selector: 'app-product-create-dialog',
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
  templateUrl: './product-create-dialog.component.html',
  styleUrls: ['./product-create-dialog.component.css']
})
export class ProductCreateDialogComponent implements OnInit {
  productForm: FormGroup;
  isSubmitting = false;
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

  constructor(
    private dialogRef: MatDialogRef<ProductCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductCreateDialogData,
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      subtitle: [''],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0)]],
      categoryMode: ['existing', [Validators.required]],
      category: ['', [Validators.required]],
      new_category_title: [''],
      image_scale: ['md', [Validators.required]],
      text_scale: ['lg', [Validators.required]],
      is_active: [true],
      is_featured: [false],
      sort_order: [9999, [Validators.required]],
      category_text_color: ['#1a1a1a']
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.loadProductImages();
    this.loadBackgroundImages();
  }

  async loadCategories() {
    try {
      const categories = await this.supabase.fetchCategoriesFromTable(getRestaurantSlug());
      this.categoryOptionsSignal.set(
        categories.map((cat: any) => ({ 
          label: `${cat.icon || ''} ${cat.title}${cat.subtitle ? ' - ' + cat.subtitle : ''}`.trim(), 
          value: cat.slug 
        }))
      );
    } catch (error) {
      console.error('Error loading categories:', error);
      this.categoryOptionsSignal.set([]);
    }
  }

  async loadProductImages() {
    try {
      const images = await this.supabase.fetchProductImages(getRestaurantSlug());
      this.productImagesSignal.set(
        images.map((img: any) => ({
          name: img.title,
          path: img.storagePath,
          url: this.getImageUrl('product-images', img.storagePath)
        }))
      );
    } catch (e) {
      this.productImagesSignal.set([]);
    }
  }

  async loadBackgroundImages() {
    try {
      const images = await this.supabase.fetchBackgroundImages(getRestaurantSlug());
      this.backgroundOptionsSignal.set(
        images.map((img: any) => ({
          title: img.title,
          path: img.storagePath,
          style: img.style
        }))
      );
    } catch (e) {
      this.backgroundOptionsSignal.set([]);
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
        type: type,
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

  async onSubmit(): Promise<void> {
    if (this.productForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      try {
        const formData = this.productForm.value;
        
        // Prepare product data (business logic is now in the service)
        const productData = {
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          price: parseFloat(formData.price),
          category_slug: formData.categoryMode === 'new' 
            ? slugify(formData.new_category_title) 
            : formData.category,
          product_image_url: this.selectedProductImage,
          background_image_url: this.selectedBackgroundImage,
          image_scale: formData.image_scale,
          text_scale: formData.text_scale,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          sort_order: parseInt(formData.sort_order)
        };

        console.log('[Product Create] Form data:', formData);
        console.log('[Product Create] Product data:', productData);
        console.log('[Product Create] Title check:', { 
          title: productData.title, 
          titleType: typeof productData.title,
          titleLength: productData.title?.length 
        });

        // Service handles slug generation, validation, and insertion
        await this.supabase.createProduct(productData);
        
        this.snackBar.open('Produkt erfolgreich erstellt!', 'Schließen', { duration: 3000 });
        this.dialogRef.close(true);
      } catch (error: any) {
        console.error('Error creating product:', error);
        this.snackBar.open(
          error?.message || 'Fehler beim Erstellen des Produkts',
          'Schließen',
          { duration: 5000 }
        );
      } finally {
        this.isSubmitting = false;
      }
    }
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
      title: this.productForm.get('title')?.value || 'Produkttitel',
      subtitle: this.productForm.get('subtitle')?.value || '',
      description: this.productForm.get('description')?.value || 'Produktbeschreibung...',
      price: this.productForm.get('price')?.value || 0,
      category_slug: this.productForm.get('category')?.value || '',
      product_slug: 'preview',
      product_image_url: this.selectedProductImage || '',
      background_image_url: '',
      image_scale: this.productForm.get('image_scale')?.value || 'md',
      text_scale: this.productForm.get('text_scale')?.value || 'md',
      is_active: this.productForm.get('is_active')?.value || true,
      is_featured: this.productForm.get('is_featured')?.value || false,
      sort_order: this.productForm.get('sort_order')?.value || 0,
      restaurant_slug: getRestaurantSlug(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ingredients: [],
        allergens: [],
        variants: []
      },
      category_settings: {
        showSubProducts: false
      }
    } as Item;
  }

  getPreviewCategoryItem(): Item {
    return {
      id: 'preview',
      title: this.productForm.get('title')?.value || 'Produkttitel',
      subtitle: this.productForm.get('subtitle')?.value || '',
      description: this.productForm.get('description')?.value || 'Produktbeschreibung...',
      price: this.productForm.get('price')?.value || 0,
      category_slug: this.productForm.get('category')?.value || '',
      product_slug: 'preview',
      product_image_url: this.selectedProductImage || '',
      background_image_url: this.selectedBackgroundImage || '',
      image_scale: this.productForm.get('image_scale')?.value || 'md',
      text_scale: this.productForm.get('text_scale')?.value || 'md',
      is_active: this.productForm.get('is_active')?.value || true,
      is_featured: this.productForm.get('is_featured')?.value || false,
      sort_order: this.productForm.get('sort_order')?.value || 0,
      restaurant_slug: getRestaurantSlug(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ingredients: [],
        allergens: [],
        variants: []
      },
      category_settings: {
        showSubProducts: false
      }
    } as Item;
  }
}