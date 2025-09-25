// hooks/useAuth.ts - Updated with Apple Sign In
import { useEffect, useState } from 'react';
import { AuthState, authService } from '../lib/authService';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange(setAuthState);
    
    return unsubscribe;
  }, []);

  return {
    // Auth state
    user: authState.user,
    session: authState.session,
    isAnonymous: authState.isAnonymous,
    isLoading: authState.isLoading,
    isAuthenticated: authService.isAuthenticated(),
    isPermanentUser: authService.isPermanentUser(),
    isAnonymousEnabled: authState.anonymousEnabled,

    // Auth methods
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signInWithApple: authService.signInWithApple.bind(authService),
    signInWithFacebook: authService.signInWithFacebook.bind(authService),
    signOut: authService.signOut.bind(authService),
    createAnonymousSession: authService.createAnonymousSession.bind(authService),
    linkAnonymousToSocial: authService.linkAnonymousToSocial.bind(authService),
    
    // Utility methods
    getUserId: authService.getUserId.bind(authService),
    isAppleSignInAvailable: authService.isAppleSignInAvailable.bind(authService),
  };
}