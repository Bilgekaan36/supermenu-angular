// src/app/admin/dashboard/image-management.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../../services/supabase.service';
import { ImageWithUrl } from '../../models/image.model';
import { getRestaurantSlug } from '../../utils/helpers';
import { AdminAuthService } from '../services/admin-auth.service';

@Component({
  selector: 'app-image-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatTabsModule,
    MatDialogModule
  ],
  templateUrl: './image-management.component.html',
  styleUrls: ['./image-management.component.css']
})
export class ImageManagementComponent implements OnInit {
  productImages = signal<ImageWithUrl[]>([]);
  backgroundImages = signal<ImageWithUrl[]>([]);
  loading = signal<boolean>(false);
  
  // Edit states
  editingImage: { id: string; type: 'product' | 'background'; displayName: string } | null = null;

  constructor(
    private supabase: SupabaseService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private adminAuth: AdminAuthService
  ) {}

  async ngOnInit() {
    await this.loadImages();
  }

  async loadImages() {
    this.loading.set(true);
    try {
      const restaurantSlug = getRestaurantSlug();
      
      const [productImages, backgroundImages] = await Promise.all([
        this.supabase.fetchProductImages(restaurantSlug),
        this.supabase.fetchBackgroundImages(restaurantSlug)
      ]);
      
      this.productImages.set(productImages);
      this.backgroundImages.set(backgroundImages);
    } catch (error) {
      console.error('Error loading images:', error);
      this.snackBar.open('Fehler beim Laden der Bilder', 'Schließen', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  startEdit(image: ImageWithUrl, type: 'product' | 'background') {
    this.editingImage = {
      id: image.id,
      type: type,
      displayName: image.display_name
    };
  }

  cancelEdit() {
    this.editingImage = null;
  }

  async saveEdit() {
    if (!this.editingImage) return;
    
    try {
      await this.supabase.updateImageDisplayName(
        this.editingImage.id,
        this.editingImage.displayName,
        this.editingImage.type
      );
      
      this.snackBar.open('Bildname erfolgreich aktualisiert', 'Schließen', { duration: 2000 });
      this.editingImage = null;
      await this.loadImages(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating image name:', error);
      this.snackBar.open('Fehler beim Aktualisieren des Bildnamens', 'Schließen', { duration: 3000 });
    }
  }

  async deleteImage(image: ImageWithUrl, type: 'product' | 'background') {
    const confirmed = confirm(`Möchten Sie das Bild "${image.display_name}" wirklich löschen?`);
    if (!confirmed) return;

    try {
      await this.supabase.deleteImage(image.id, image.filename, type);
      this.snackBar.open('Bild erfolgreich gelöscht', 'Schließen', { duration: 2000 });
      await this.loadImages(); // Reload to get updated data
    } catch (error) {
      console.error('Error deleting image:', error);
      this.snackBar.open('Fehler beim Löschen des Bildes', 'Schließen', { duration: 3000 });
    }
  }

  getImageUrl(image: ImageWithUrl, type: 'product' | 'background'): string {
    return image.url || this.supabase.resolveImageUrl(image.filename, type);
  }

  navigateToDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }

  async logout() {
    try {
      await this.adminAuth.signOut();
      this.router.navigate(['/admin/login']);
    } catch (error) {
      console.error('Logout error:', error);
      this.snackBar.open('Fehler beim Abmelden', 'Schließen', { duration: 3000 });
    }
  }
}
