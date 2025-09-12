// app/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Import the AdBanner component
import AdBanner from '../components/BannerAd';

// Safe imports with fallbacks
let colors: any, spacing: any, layout: any, typography: any;
let textStyles: any, layoutStyles: any, gameStyles: any, combineStyles: any;
let Button: any, useAuth: any, SocialLoginModal: any;

try {
  const theme = require('../constants/theme');
  colors = theme.colors;
  spacing = theme.spacing;
  layout = theme.layout;
  typography = theme.typography;
} catch (error) {
  console.warn('Failed to load theme constants:', error);
  colors = { 
    primary: '#007AFF', 
    secondary: '#5856D6', 
    background: '#ffffff',
    white: '#ffffff',
    gray600: '#6B7280',
    warning: '#F59E0B',
    black: '#000000'
  };
  spacing = { sm: 8, md: 16, lg: 24, xl: 32, xs: 4 };
  layout = { iconSize: { md: 24 } };
  typography = { fontSize: { sm: 14, base: 16 }, fontWeight: { medium: '500' } };
}

try {
  const styles = require('../utils/styles');
  textStyles = styles.textStyles;
  layoutStyles = styles.layoutStyles;
  gameStyles = styles.gameStyles;
  combineStyles = styles.combineStyles;
} catch (error) {
  console.warn('Failed to load style utilities:', error);
  textStyles = {};
  layoutStyles = {
    container: { flex: 1, backgroundColor: colors.background },
    header: { 
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    centered: { justifyContent: 'center', alignItems: 'center' }
  };
  gameStyles = {};
  combineStyles = (a: any, b: any) => ({ ...a, ...b });
}

try {
  Button = require('../components/Button').Button;
} catch (error) {
  console.warn('Failed to load Button component:', error);
  Button = ({ title, onPress, style, variant, size, ...props }: any) => (
    <TouchableOpacity 
      style={[
        {
          paddingVertical: size === 'lg' ? 16 : 12,
          paddingHorizontal: 24,
          borderRadius: 12,
          backgroundColor: variant === 'outline' ? 'transparent' : colors.primary,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        }, 
        style
      ]} 
      onPress={onPress}
      {...props}
    >
      <Text style={{
        color: variant === 'outline' ? colors.primary : colors.white,
        fontSize: size === 'lg' ? 18 : 16,
        fontWeight: '500',
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

try {
  const auth = require('../hooks/useAuth');
  useAuth = auth.useAuth;
  
  const modal = require('../components/SocialLoginModal');
  SocialLoginModal = modal.SocialLoginModal;
} catch (error) {
  console.warn('Failed to load auth/modal components:', error);
  useAuth = () => ({ 
    user: null, 
    isAnonymous: true, 
    signInWithGoogle: () => {}, 
    signOut: () => {},
    loading: false 
  });
  SocialLoginModal = ({ visible, onClose, onGoogleSignIn }: any) => null;
}

export default function MainScreen() {
  const { user, isAnonymous, signInWithGoogle, loading } = useAuth();
  const [socialModalVisible, setSocialModalVisible] = useState(false);

  const navigateToWordSetup = () => {
    router.push('/word/word-setup');
  };

  const navigateToQuestionSetup = () => {
    router.push('/question/question-setup');
  };

  const navigateToWavelengthSetup = () => {
    router.push('/wavelength/wavelength-setup');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setSocialModalVisible(false);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  if (loading) {
    return (
      <View style={combineStyles(layoutStyles.container, layoutStyles.centered)}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={layoutStyles.header}>
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={handleProfile}
        >
          <Ionicons 
            name="person-circle-outline" 
            size={layout.iconSize.md * 1.5} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={combineStyles(layoutStyles.centered, { flex: 1 })}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons 
              name="people-circle-outline" 
              size={80} 
              color={colors.primary} 
            />
          </View>
        </View>

        {/* App Title */}
        <Text style={styles.title}>AMONGYALL</Text>
        <Text style={styles.subtitle}>Select a game mode</Text>

        {/* Game Mode Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="🎭 Word Chameleon"
            onPress={navigateToWordSetup}
            size="lg"
            style={styles.gameButton}
          />
          
          <Button
            title="❓ Question Chameleon"
            onPress={navigateToQuestionSetup}
            size="lg" 
            style={styles.gameButton}
          />
          
          <Button
            title="📏 Wavelength"
            onPress={navigateToWavelengthSetup}
            size="lg"
            style={styles.gameButton}
          />
        </View>
      </View>

      {/* Banner Ad at the bottom */}
      <View style={styles.adContainer}>
        <AdBanner />
      </View>

      {/* Social Login Modal */}
      {SocialLoginModal && (
        <SocialLoginModal
          visible={socialModalVisible}
          onClose={() => setSocialModalVisible(false)}
          onGoogleSignIn={handleGoogleSignIn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    padding: spacing.xs,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  title: {
    fontSize: typography.fontSize['2xl'] || 28,
    fontWeight: typography.fontWeight.bold || 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.xl * 2,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  gameButton: {
    marginBottom: spacing.sm,
  },
  adContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
  },
});