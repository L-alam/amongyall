// app/index.tsx (Updated)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, layout, typography } from '../constants/theme';
import { textStyles, layoutStyles, gameStyles, combineStyles } from '../utils/styles';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { SocialLoginModal } from '../components/SocialLoginModal';

export default function Index() {
  const { user, isAnonymous, isPermanentUser, isLoading, anonymousEnabled } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleGameModePress = (gameMode: string) => {
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
  };

  // SETTINGS
  const handleSettingsPress = () => {
    // TODO: Navigate to settings screen
    console.log('Settings pressed');
  };

  // AUTH HANDLERS
  const handleAuthButtonPress = () => {
    if (isPermanentUser) {
      // Navigate to profile screen
      router.push('/profile');
    } else {
      // Show login modal
      setShowLoginModal(true);
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

      
      
      {/* Header with settings and auth button */}
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
              <Text style={styles.anonymousBadgeText}>!</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleSettingsPress}
        >
          <Ionicons name="settings-outline" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={combineStyles(layoutStyles.content, layoutStyles.centered)}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Ionicons 
            name="person-circle-outline" 
            size={80} 
            color={colors.primary} 
          />
        </View>

        {/* App title */}
        <Text style={textStyles.appTitle}>AMONGYALL</Text>

        {/* User status indicator */}
        {!isLoading && (
          <View style={styles.userStatusContainer}>
            {isAnonymous ? (
              <Text style={styles.userStatusText}>
                Playing anonymously • 
                <Text 
                  style={styles.signInLink} 
                  onPress={() => setShowLoginModal(true)}
                > Sign in to save progress</Text>
              </Text>
            ) : isPermanentUser ? (
              <Text style={styles.userStatusText}>
                Welcome back, {user?.user_metadata?.full_name || 'Player'}! 🎮
              </Text>
            ) : null}
            <Text style={combineStyles(textStyles.subtitle, styles.subtitle)}>
              Test Version
            </Text>
          </View>
        )}

        {/* Subtitle */}
        <Text style={combineStyles(textStyles.subtitle, styles.subtitle)}>
          Select a game mode:
        </Text>

        {/* Game mode buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Word Chameleon"
            variant="primary"
            size="lg"
            onPress={() => handleGameModePress('Word Chameleon')}
            style={styles.gameButton}
          />
          
          <Button
            title="Question Chameleon"
            variant="primary"
            size="lg"
            onPress={() => handleGameModePress('Question Chameleon')}
            style={styles.gameButton}
          />
          
          <Button
            title="WaveLength"
            variant="primary"
            size="lg"
            onPress={() => handleGameModePress('WaveLength')}
            style={styles.gameButton}
          />
        </View>
      </View>

      {/* Social Login Modal */}
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
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  authButton: {
    position: 'relative',
  },
  anonymousBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.warning,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anonymousBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  userStatusContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  userStatusText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  gameButton: {
    marginBottom: spacing.sm,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
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
    color: colors.black,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: 4,
  },
});