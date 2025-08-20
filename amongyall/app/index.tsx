import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, spacing, layout, typography } from '../constants/theme';
import { textStyles, layoutStyles, gameStyles, combineStyles } from '../utils/styles';
import { Button } from '../components/Button';

export default function Index() {

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

  return (
    <View style={layoutStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header with settings */}
      <View style={layoutStyles.header}>
        <View /> {/* Spacer for center alignment */}
        <TouchableOpacity 
          style={styles.settingsButton} 
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
    </View>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    padding: spacing.sm,
  },
  
  logoContainer: {
    marginBottom: spacing.xl,
  },
  
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  
  gameButton: {
    width: '100%',
  },
});