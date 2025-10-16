import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        storageKey: 'sb-admin-auth',
      },
    }
  );

  private isAuthed = signal<boolean>(false);
  private initialized = false;

  constructor() {
    // Initialize auth state from persisted session and subscribe to changes
    this.bootstrapAuthState();
  }

  private async bootstrapAuthState() {
    if (this.initialized) return;
    const { data } = await this.supabase.auth.getSession();
    this.isAuthed.set(!!data.session?.user);
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.isAuthed.set(!!session?.user);
    });
    this.initialized = true;
  }

  isLoggedIn(): boolean {
    return this.isAuthed();
  }

  async signIn(email: string, password: string): Promise<string | null> {
    const { error, data } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    this.isAuthed.set(!!data.user);
    return null;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.isAuthed.set(false);
  }

  // Expose current session for other services (e.g., to satisfy RLS)
  async getSession(): Promise<import('@supabase/supabase-js').Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session ?? null;
  }

  // Expose client so other services can reuse the same authenticated instance
  getClient(): SupabaseClient {
    return this.supabase;
  }
}


