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
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupabaseService } from '../../services/supabase.service';
import { getRestaurantSlug, slugify, getFileUrl } from '../../utils/helpers';
import { ImageSelectionDialogComponent } from './image-selection-dialog.component';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './product-create-dialog.component.html',
  styleUrls: ['./product-create-dialog.component.css']
})
export class ProductCreateDialogComponent implements OnInit {
  productForm: FormGroup;
  isSubmitting = false;
  selectedProductImage?: string;
  selectedBackgroundImage?: string;

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
      display_type: ['product', [Validators.required]],
      image_scale: ['md', [Validators.required]],
      text_scale: ['lg', [Validators.required]],
      is_active: [true],
      is_available: [true],
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
      width: '900px',
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
          is_available: formData.is_available,
          is_featured: formData.is_featured,
          sort_order: parseInt(formData.sort_order),
          display_type: formData.display_type
        };

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
}