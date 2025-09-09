// lib/authService.ts (Fixed for Safari/WebBrowser issues)
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// This is required for Expo WebBrowser
WebBrowser.maybeCompleteAuthSession();

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
  anonymousEnabled: boolean;
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
    this.setupLinkingListener();
  }

  private setupLinkingListener() {
    // Listen for deep links when the app is already open
    const subscription = Linking.addEventListener('url', this.handleDeepLink);
    
    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink({ url });
      }
    });

    return () => subscription?.remove();
  }

  private handleDeepLink = async ({ url }: { url: string }) => {
    console.log('Deep link received:', url);
    
    if (url.includes('auth/callback') || url.includes('#access_token')) {
      try {
        // Handle both URL formats
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        let error: string | null = null;
        let errorDescription: string | null = null;
        
        if (url.includes('#access_token')) {
          // Hash fragment format (common with OAuth)
          const hashPart = url.split('#')[1];
          const params = new URLSearchParams(hashPart);
          accessToken = params.get('access_token');
          refreshToken = params.get('refresh_token');
          error = params.get('error');
          errorDescription = params.get('error_description');
        } else {
          // Query parameter format
          const urlObj = new URL(url);
          accessToken = urlObj.searchParams.get('access_token');
          refreshToken = urlObj.searchParams.get('refresh_token');
          error = urlObj.searchParams.get('error');
          errorDescription = urlObj.searchParams.get('error_description');
        }
        
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          return;
        }
        
        if (accessToken) {
          console.log('Setting session from deep link...');
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (sessionError) {
            console.error('Error setting session from deep link:', sessionError);
          } else {
            console.log('Session set successfully from deep link:', data.user?.email);
            
            // Migrate anonymous content to the new user account
            try {
              await this.migrateAnonymousContent();
            } catch (migrationError) {
              console.error('Failed to migrate anonymous content:', migrationError);
              // Don't throw here - login should still succeed even if migration fails
            }
          }
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    }
  };
  
  // Add this method to your AuthService class
  private async migrateAnonymousContent(): Promise<void> {
    const userId = this.getUserId();
    if (!userId) return;
  
    try {
      // Migrate anonymous themes
      const { error: themesError } = await supabase
        .from('themes')
        .update({ created_by: userId })
        .eq('is_custom', true)
        .is('created_by', null);
  
      if (themesError) {
        console.error('Error migrating themes:', themesError);
      }
  
      // Migrate anonymous pairs
      const { error: pairsError } = await supabase
        .from('pairs')
        .update({ created_by: userId })
        .eq('is_custom', true)
        .is('created_by', null);
  
      if (pairsError) {
        console.error('Error migrating pairs:', pairsError);
      }
  
      console.log('Successfully migrated anonymous content to user account');
    } catch (error) {
      console.error('Error in migrateAnonymousContent:', error);
      throw error;
    }
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
        console.log('Auth state changed:', event, session?.user?.email || 'no user');
        
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
      // Get the redirect URL for your app
      const redirectUrl = 'exp://amongyall.5ca35d0d-be67-4c80-9e99-71d166723c05.exp.direct/--/auth/callback';
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl, // Add this line!
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
  
      if (error) {
        console.error('Error creating Google OAuth URL:', error);
        return { user: null, error };
      }
  
      if (!data.url) {
        return { user: null, error: new Error('No OAuth URL returned') };
      }
  
      console.log('Opening Google OAuth URL:', data.url);
  
      const browserOptions: WebBrowser.AuthSessionOptions = {
        showInRecents: false,
      };
  
      if (Platform.OS === 'ios') {
        browserOptions.preferEphemeralSession = false;
      }
  
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl, // Add the redirect URL here too
        browserOptions
      );
  
      console.log('WebBrowser result:', result);
  
      if (result.type === 'success' && result.url) {
        await this.handleDeepLink({ url: result.url });
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { user: this.getCurrentUser(), error: null };
      } else if (result.type === 'cancel') {
        console.log('User cancelled Google sign-in');
        return { user: null, error: new Error('User cancelled sign-in') };
      } else {
        console.log('OAuth flow failed or dismissed');
        return { user: null, error: new Error('OAuth flow failed') };
      }
  
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      return { user: null, error };
    }
  } 

  async signInWithApple(): Promise<{ user: User | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      });

      if (error || !data.url) {
        return { user: null, error: error || new Error('No OAuth URL returned') };
      }

      const browserOptions: WebBrowser.AuthSessionOptions = {
        showInRecents: false,
      };

      if (Platform.OS === 'ios') {
        browserOptions.preferEphemeralSession = false;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        undefined,
        browserOptions
      );

      if (result.type === 'success' && result.url) {
        await this.handleDeepLink({ url: result.url });
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { user: this.getCurrentUser(), error: null };
      }

      return { user: null, error: new Error('OAuth flow failed') };
    } catch (error) {
      console.error('Error in signInWithApple:', error);
      return { user: null, error };
    }
  }

  async signInWithFacebook(): Promise<{ user: User | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
      });

      if (error || !data.url) {
        return { user: null, error: error || new Error('No OAuth URL returned') };
      }

      const browserOptions: WebBrowser.AuthSessionOptions = {
        showInRecents: false,
      };

      if (Platform.OS === 'ios') {
        browserOptions.preferEphemeralSession = false;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        undefined,
        browserOptions
      );

      if (result.type === 'success' && result.url) {
        await this.handleDeepLink({ url: result.url });
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { user: this.getCurrentUser(), error: null };
      }

      return { user: null, error: new Error('OAuth flow failed') };
    } catch (error) {
      console.error('Error in signInWithFacebook:', error);
      return { user: null, error };
    }
  }

  async linkAnonymousToSocial(provider: 'google' | 'apple' | 'facebook'): Promise<{ user: User | null; error: any }> {
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