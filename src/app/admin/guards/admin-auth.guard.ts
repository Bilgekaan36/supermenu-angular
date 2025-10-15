import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthGuard implements CanActivate {
  constructor(private auth: AdminAuthService, private router: Router) {}

  canActivate(): boolean | Promise<boolean> {
    if (this.auth.isLoggedIn()) return true;
    // attempt to restore session before redirecting
    return this.auth.getSession().then((session) => {
      if (session) return true;
      this.router.navigate(['/admin/login']);
      return false;
    });
  }
}


