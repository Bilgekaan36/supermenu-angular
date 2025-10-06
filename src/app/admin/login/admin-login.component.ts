import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  email = signal('');
  password = signal('');
  error = signal<string | null>(null);
  loading = signal(false);

  constructor(private auth: AdminAuthService, private router: Router) {}

  async submit() {
    this.loading.set(true);
    this.error.set(null);
    const err = await this.auth.signIn(this.email(), this.password());
    this.loading.set(false);
    if (err) {
      this.error.set(err);
      return;
    }
    this.router.navigate(['/admin/dashboard']);
  }
}


