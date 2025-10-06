import { Injectable, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private supabase = createClient(
    'https://gcanfodziyqrfpobwmyb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjYW5mb2R6aXlxcmZwb2J3bXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTI1NTIsImV4cCI6MjA2OTc4ODU1Mn0.PS0lhRf9UXXohS-VglMNwtbHbyeeaTPOktpJhdErRvc'
  );

  private isAuthed = signal<boolean>(false);

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
}


