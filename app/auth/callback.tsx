// app/auth/callback.tsx
import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { layoutStyles, textStyles } from '../../utils/styles';
import { colors } from '../../constants/theme';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          if (isMounted) {
            router.replace('/');
          }
          return;
        }

        if (session) {
          console.log('Auth callback successful:', session.user.email);
          // Small delay to ensure auth state is updated
          setTimeout(() => {
            if (isMounted) {
              router.replace('/');
            }
          }, 500);
        } else {
          console.log('No session found in callback');
          if (isMounted) {
            router.replace('/');
          }
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        if (isMounted) {
          router.replace('/');
        }
      }
    };

    // Also listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth callback - state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session && isMounted) {
          // Redirect to main app after successful sign-in
          setTimeout(() => {
            if (isMounted) {
              router.replace('/');
            }
          }, 500);
        }
      }
    );

    // Run the callback handler
    handleAuthCallback();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <View style={[layoutStyles.container, layoutStyles.centered]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[textStyles.body, { marginTop: 16 }]}>
        Completing sign in...
      </Text>
    </View>
  );
}