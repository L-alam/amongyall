// lib/authService.ts (Updated)
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnonymousUser {
  id: string;
  isAnonymous: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAnonymous: boolean;
  isLoading: boolean;
  anonymousEnabled: boolean; // Track if anonymous is available
}

class AuthService {
  private authStateListeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    user: null,
    session: null,
    isAnonymous: false,
    isLoading: true,
    anonymousEnabled: true
  };

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }

      if (session) {
        // User has an existing session
        this.updateAuthState({
          user: session.user,
          session,
          isAnonymous: session.user.is_anonymous || false,
          isLoading: false,
          anonymousEnabled: true
        });
      } else {
        // No session - try to create anonymous session
        await this.tryCreateAnonymousSession();
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        this.updateAuthState({
          user: session?.user || null,
          session,
          isAnonymous: session?.user?.is_anonymous || false,
          isLoading: false
        });
      });

    } catch (error) {
      console.error('Error initializing auth:', error);
      this.updateAuthState({
        user: null,
        session: null,
        isAnonymous: false,
        isLoading: false,
        anonymousEnabled: false
      });
    }
  }

  private async tryCreateAnonymousSession() {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.log('Anonymous sign-ins are disabled or failed:', error.message);
        // Set state to show no user but not loading
        this.updateAuthState({
          user: null,
          session: null,
          isAnonymous: false,
          isLoading: false,
          anonymousEnabled: false
        });
        return;
      }

      console.log('Anonymous session created:', data.user?.id);
      // State will be updated via onAuthStateChange
      
    } catch (error) {
      console.error('Error creating anonymous session:', error);
      this.updateAuthState({
        user: null,
        session: null,
        isAnonymous: false,
        isLoading: false,
        anonymousEnabled: false
      });
    }
  }

  async createAnonymousSession(): Promise<{ user: User | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('Error creating anonymous session:', error);
        return { user: null, error };
      }

      console.log('Anonymous session created:', data.user?.id);
      return { user: data.user, error: null };

    } catch (error) {
      console.error('Error in createAnonymousSession:', error);
      return { user: null, error };
    }
  }

  async signInWithGoogle(): Promise<{ user: User | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'amongyall://auth/callback', // Use your actual app scheme
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        return { user: null, error };
      }

      console.log('Google sign-in initiated successfully');
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      return { user: null, error };
    }
  }

  async signInWithApple(): Promise<{ user: User | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'amongyall://auth/callback', // Use your actual app scheme
        }
      });

      if (error) {
        console.error('Error signing in with Apple:', error);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error in signInWithApple:', error);
      return { user: null, error };
    }
  }

  async signInWithFacebook(): Promise<{ user: User | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'amongyall://auth/callback', // Use your actual app scheme
        }
      });

      if (error) {
        console.error('Error signing in with Facebook:', error);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error in signInWithFacebook:', error);
      return { user: null, error };
    }
  }

  async linkAnonymousToSocial(provider: 'google' | 'apple' | 'facebook'): Promise<{ user: User | null; error: any }> {
    // This will convert an anonymous account to a permanent one
    // Supabase handles the linking automatically when you sign in with OAuth
    // while having an anonymous session
    
    switch (provider) {
      case 'google':
        return this.signInWithGoogle();
      case 'apple':
        return this.signInWithApple();
      case 'facebook':
        return this.signInWithFacebook();
      default:
        return { user: null, error: new Error('Unsupported provider') };
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        return { error };
      }

      // After signing out, try to create a new anonymous session if enabled
      if (this.currentState.anonymousEnabled) {
        await this.tryCreateAnonymousSession();
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error in signOut:', error);
      return { error };
    }
  }

  // Get current auth state
  getAuthState(): AuthState {
    return this.currentState;
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  private updateAuthState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.authStateListeners.forEach(listener => listener(this.currentState));
  }

  // Utility methods
  getCurrentUser(): User | null {
    return this.currentState.user;
  }

  getCurrentSession(): Session | null {
    return this.currentState.session;
  }

  isAuthenticated(): boolean {
    return !!this.currentState.user;
  }

  isAnonymousUser(): boolean {
    return this.currentState.isAnonymous;
  }

  isPermanentUser(): boolean {
    return this.isAuthenticated() && !this.isAnonymousUser();
  }

  getUserId(): string | null {
    return this.currentState.user?.id || null;
  }

  isAnonymousEnabled(): boolean {
    return this.currentState.anonymousEnabled;
  }
}

// Export singleton instance
export const authService = new AuthService();