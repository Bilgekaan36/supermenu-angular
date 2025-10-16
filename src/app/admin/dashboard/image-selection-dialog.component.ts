import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupabaseService } from '../../services/supabase.service';
import { getRestaurantSlug } from '../../utils/helpers';

export interface ImageSelectionData {
  type: 'product' | 'background';
  selectedImage?: string;
  restaurantSlug?: string;
}

export interface ImageFile {
  name: string;
  path: string;
  url: string;
  size?: number;
  lastModified?: Date;
}

@Component({
  selector: 'app-image-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './image-selection-dialog.component.html',
  styleUrls: ['./image-selection-dialog.component.css']
})
export class ImageSelectionDialogComponent implements OnInit {
  images: ImageFile[] = [];
  selectedImage: string | null = null;
  loading = false;
  uploading = false;

  constructor(
    public dialogRef: MatDialogRef<ImageSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageSelectionData,
    private supabase: SupabaseService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.selectedImage = this.data.selectedImage || null;
    await this.loadImages();
  }

  private async loadImages() {
    this.loading = true;
    try {
      if (this.data.type === 'product') {
        // Load from product_images table
        const productImages = await this.supabase.fetchProductImages(this.data.restaurantSlug || getRestaurantSlug());
        
        this.images = productImages.map(img => ({
          name: img.title,
          path: img.storagePath,
          url: this.getImageUrl('product-images', img.storagePath),
          size: undefined,
          lastModified: undefined
        }));
      } else {
        // Load from background_images table
        const backgroundImages = await this.supabase.fetchBackgroundImages(this.data.restaurantSlug || getRestaurantSlug());
        
        this.images = backgroundImages.map(img => ({
          name: img.title,
          path: img.storagePath,
          url: this.getBackgroundImageUrl(img.storagePath),
          size: undefined,
          lastModified: undefined
        }));
      }
    } catch (error) {
      console.error('Error loading images:', error);
      this.snackBar.open('Fehler beim Laden der Bilder', 'Schließen', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  private getImageUrl(bucket: string, path: string): string {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // supabaseUrl already contains https://, so we don't need to add it again
    const baseUrl = this.supabase.supabaseUrl;
    return `${baseUrl}/storage/v1/object/public/${bucket}${cleanPath}`;
  }

  private getBackgroundImageUrl(path: string): string {
    // Background images are stored in background-images bucket
    // Path should be like: /backgrounds/cherry-dream.webp
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // supabaseUrl already contains https://, so we don't need to add it again
    const baseUrl = this.supabase.supabaseUrl;
    const generatedUrl = `${baseUrl}/storage/v1/object/public/background-images${cleanPath}`;
    console.log('getBackgroundImageUrl:', { input: path, cleanPath, generatedUrl });
    return generatedUrl;
  }


  selectImage(image: ImageFile) {
    this.selectedImage = image.path;
  }

  onImageError(event: Event, image: ImageFile) {
    console.error('Image failed to load:', image.url);
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';
  }

  onImageLoad(event: Event, image: ImageFile) {
    // Image loaded successfully
  }

  onUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  async handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Bitte wählen Sie eine Bilddatei aus', 'Schließen', { duration: 3000 });
      return;
    }

    this.uploading = true;
    try {
      const bucket = this.data.type === 'product' ? 'product-images' : 'background-images';
      const prefix = this.data.type === 'product' 
        ? `restaurants/${this.data.restaurantSlug || getRestaurantSlug()}/products/`
        : 'backgrounds/';
      
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `/${prefix}${fileName}`;

      // Upload to storage
      await this.supabase.uploadFile(bucket, filePath, file);
      
      // Add to database table based on type
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      const title = fileNameWithoutExt.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      if (this.data.type === 'product') {
        await this.supabase.createProductImage({
          slug: fileNameWithoutExt,
          title: title,
          storagePath: filePath,
          restaurantSlug: this.data.restaurantSlug || getRestaurantSlug(),
          sortOrder: 9999
        });
      } else if (this.data.type === 'background') {
        await this.supabase.createBackgroundImage({
          slug: fileNameWithoutExt,
          title: title,
          storagePath: filePath,
          restaurantSlug: this.data.restaurantSlug || getRestaurantSlug(),
          sortOrder: 9999
        });
      }
      
      // Reload images
      await this.loadImages();
      
      // Auto-select the newly uploaded image
      this.selectedImage = filePath;
      
      this.snackBar.open('Bild erfolgreich hochgeladen', 'Schließen', { duration: 2000 });
    } catch (error) {
      console.error('Error uploading file:', error);
      this.snackBar.open('Fehler beim Hochladen des Bildes', 'Schließen', { duration: 3000 });
    } finally {
      this.uploading = false;
      // Reset file input
      target.value = '';
    }
  }

  async deleteImage(image: ImageFile, event: Event) {
    event.stopPropagation();
    
    if (!confirm(`Möchten Sie "${image.name}" wirklich löschen?`)) {
      return;
    }

    try {
      const bucket = this.data.type === 'product' ? 'product-images' : 'background-images';
      await this.supabase.deleteFileByPath(`${image.path}`);
      
      // Remove from local array
      this.images = this.images.filter(img => img.path !== image.path);
      
      // Clear selection if this image was selected
      if (this.selectedImage === image.path) {
        this.selectedImage = null;
      }
      
      this.snackBar.open('Bild gelöscht', 'Schließen', { duration: 2000 });
    } catch (error) {
      console.error('Error deleting image:', error);
      this.snackBar.open('Fehler beim Löschen des Bildes', 'Schließen', { duration: 3000 });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    if (this.selectedImage) {
      this.dialogRef.close(this.selectedImage);
    }
  }
}
