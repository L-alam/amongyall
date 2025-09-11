// app/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
        fontWeight: '600'
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

try {
  const authHook = require('../hooks/useAuth');
  useAuth = authHook.useAuth;
} catch (error) {
  console.warn('Failed to load useAuth hook:', error);
  useAuth = () => ({
    user: null,
    isAnonymous: true,
    isPermanentUser: false,
    isLoading: false,
    anonymousEnabled: true
  });
}

try {
  const modal = require('../components/SocialLoginModal');
  SocialLoginModal = modal.SocialLoginModal;
} catch (error) {
  console.warn('Failed to load SocialLoginModal:', error);
  SocialLoginModal = ({ visible, onClose, title, subtitle }: any) => visible ? (
    <View style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <View style={{
        backgroundColor: colors.white,
        padding: 24,
        borderRadius: 12,
        margin: 20,
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{title}</Text>
        <Text style={{ marginBottom: 16, color: colors.gray600 }}>{subtitle}</Text>
        <TouchableOpacity 
          style={{ padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
          onPress={onClose}
        >
          <Text style={{ color: colors.white, textAlign: 'center' }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;
}

export default function Index() {
  const { user, isAnonymous, isPermanentUser, isLoading, anonymousEnabled } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleGameModePress = (gameMode: string) => {
    try {
      switch (gameMode) {
        case 'Word Chameleon':
          router.push('/word/word-setup');
          break;
        case 'Question Chameleon':
          router.push('/question/question-setup');
          break;
        case 'WaveLength':
          router.push('/wavelength/wavelength-setup');
          break;
        default:
          console.log(`Selected game mode: ${gameMode}`);
      }
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  };

  // AUTH HANDLERS
  const handleAuthButtonPress = () => {
    try {
      if (isPermanentUser) {
        // Navigate to profile screen - CORRECTED PATH
        router.push('/profile');
      } else {
        // Show login modal
        setShowLoginModal(true);
      }
    } catch (error) {
      console.error('Auth navigation failed:', error);
    }
  };

  const getAuthButtonIcon = () => {
    if (isLoading) return 'ellipsis-horizontal-outline';
    if (isPermanentUser) return 'person-circle';
    return 'log-in-outline';
  };

  const getAuthButtonColor = () => {
    if (isPermanentUser) return colors.secondary;
    return colors.primary;
  };

  return (
    <View style={layoutStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header with auth button */}
      <View style={layoutStyles.header}>
        {/* Auth Button (Sign In / Profile) */}
        <TouchableOpacity 
          style={[styles.headerButton, styles.authButton]} 
          onPress={handleAuthButtonPress}
          disabled={isLoading}
        >
          <Ionicons 
            name={getAuthButtonIcon()}
            size={layout.iconSize.md} 
            color={getAuthButtonColor()} 
          />
          {isAnonymous && (
            <View style={styles.anonymousBadge}>
              <Ionicons name="eye-off" size={12} color={colors.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={[layoutStyles.centered, { flex: 1 }]}>
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/home_icon1.png')} 
            style={{
              width: 200,  // Much larger than 120
              height: 200, // Much larger than 120
              marginBottom: spacing?.lg || 24,
            }}
            resizeMode="contain"
          />
          <Text style={[textStyles.h1 || styles.appTitle]}>AMONGYALL</Text>
          <Text style={[textStyles.subtitle || styles.subtitle]}>Select a game mode</Text>
        </View>

        {/* User Status (if anonymous) */}
        {isAnonymous && anonymousEnabled && (
          <View style={styles.userStatusContainer}>
            <Text style={styles.userStatusText}>
              You're playing anonymously.{' '}
              <Text 
                style={styles.signInLink}
                onPress={() => setShowLoginModal(true)}
              >
                Sign in
              </Text>
              {' '}to save your progress.
            </Text>
          </View>
        )}

        {/* Game Mode Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Word Game"
            onPress={() => handleGameModePress('Word Chameleon')}
            size="lg"
            style={styles.gameButton}
          />
          
          <Button
            title="Question Game"
            onPress={() => handleGameModePress('Question Chameleon')}
            size="lg"
            style={styles.gameButton}
          />
          
          <Button
            title="Frequency"
            onPress={() => handleGameModePress('WaveLength')}
            size="lg"
            style={styles.gameButton}
          />
        </View>

      </View>

      {/* Login Modal */}
      <SocialLoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title={isAnonymous ? "Save Your Progress" : "Sign In"}
        subtitle={isAnonymous 
          ? "Link your account to keep your data safe and sync across devices"
          : "Choose your preferred sign-in method"
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: spacing?.sm || 8,
    marginLeft: spacing?.sm || 8,
  },
  authButton: {
    position: 'relative',
  },
  anonymousBadge: {
    position: 'absolute',
    top: spacing?.xs || 4,
    right: spacing?.xs || 4,
    backgroundColor: colors?.warning || '#F59E0B',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing?.xl || 32,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors?.black || '#000000',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography?.fontSize?.base || 16,
    color: colors?.gray600 || '#6B7280',
    textAlign: 'center',
    marginBottom: spacing?.xl || 32,
  },
  userStatusContainer: {
    marginBottom: spacing?.md || 16,
    paddingHorizontal: spacing?.lg || 24,
  },
  userStatusText: {
    fontSize: typography?.fontSize?.sm || 14,
    color: colors?.gray600 || '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  signInLink: {
    color: colors?.primary || '#007AFF',
    fontWeight: typography?.fontWeight?.medium || '500',
  },
  buttonContainer: {
    width: '100%',
    gap: spacing?.md || 16,
    paddingHorizontal: spacing?.lg || 24,
  },
  gameButton: {
    marginBottom: spacing?.sm || 8,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing?.md || 16,
    paddingVertical: spacing?.sm || 8,
    borderRadius: 8,
    marginTop: spacing?.lg || 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportButtonText: {
    color: colors?.black || '#000000',
    fontSize: typography?.fontSize?.sm || 14,
    fontWeight: typography?.fontWeight?.medium || '500',
    marginLeft: 4,
  },
});