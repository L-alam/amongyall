// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authService, AuthState } from '../lib/authService';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((newState) => {
      setAuthState(newState);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const { user, error } = await authService.signInWithGoogle();
    return { user, error };
  };

  const signInWithApple = async () => {
    const { user, error } = await authService.signInWithApple();
    return { user, error };
  };

  const signInWithFacebook = async () => {
    const { user, error } = await authService.signInWithFacebook();
    return { user, error };
  };

  const linkToSocial = async (provider: 'google' | 'apple' | 'facebook') => {
    const { user, error } = await authService.linkAnonymousToSocial(provider);
    return { user, error };
  };

  const signOut = async () => {
    const { error } = await authService.signOut();
    return { error };
  };

  const createAnonymousSession = async () => {
    const { user, error } = await authService.createAnonymousSession();
    return { user, error };
  };

  return {
    // Auth state
    user: authState.user,
    session: authState.session,
    isAnonymous: authState.isAnonymous,
    isLoading: authState.isLoading,
    anonymousEnabled: authState.anonymousEnabled,
    
    // Computed values
    isAuthenticated: authService.isAuthenticated(),
    isPermanentUser: authService.isPermanentUser(),
    userId: authService.getUserId(),
    
    // Actions
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
    linkToSocial,
    signOut,
    createAnonymousSession,
  };
};