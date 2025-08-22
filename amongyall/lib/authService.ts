// lib/authService.ts (Fixed for Safari/WebBrowser issues)
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

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
          }
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    }
  };

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
      // For Expo, we need to use the Supabase hosted redirect
      // This avoids the Safari "can't connect to server" issue
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Use web redirect that will work with WebBrowser
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

      // Configure WebBrowser options for better compatibility
      const browserOptions: WebBrowser.AuthSessionOptions = {
        showInRecents: false,
      };

      // Add iOS-specific options
      if (Platform.OS === 'ios') {
        browserOptions.preferEphemeralSession = false; // Try persistent session
      }

      // Open the OAuth URL in the browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        undefined, // Let Supabase handle the redirect
        browserOptions
      );

      console.log('WebBrowser result:', result);

      if (result.type === 'success' && result.url) {
        // Handle the callback URL
        await this.handleDeepLink({ url: result.url });
        
        // Wait a bit for the session to be set
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