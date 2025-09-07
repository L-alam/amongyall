import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  createInputStyle,
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { createCustomTheme } from '../../lib/themeService';

export default function WordCustomTheme() {
  const params = useLocalSearchParams();
  const initialNumCards = parseInt(params.numCards as string) || 8;
  const players = JSON.parse(params.players as string || '[]');
  
  const [themeName, setThemeName] = useState('');
  const [words, setWords] = useState<string[]>(Array(initialNumCards).fill(''));
  const [numCards, setNumCards] = useState(initialNumCards);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  // Card options for bubble selection
  const CARD_OPTIONS = [4, 6, 8, 10];

  // Update words array when numCards changes
  useEffect(() => {
    setWords(prevWords => {
      const newWords = [...prevWords];
      if (newWords.length < numCards) {
        // Add empty strings for new cards
        while (newWords.length < numCards) {
          newWords.push('');
        }
      } else if (newWords.length > numCards) {
        // Remove excess cards
        newWords.splice(numCards);
      }
      return newWords;
    });
  }, [numCards]);

  // Validation functions
  const isThemeNameValid = () => {
    const trimmedName = themeName.trim();
    return trimmedName.length >= 3 && trimmedName.length <= 50;
  };

  const areAllWordsValid = () => {
    return words.every(word => word.trim().length > 0);
  };

  const canSaveTheme = () => {
    return isThemeNameValid() && areAllWordsValid() && !saving;
  };

  // Validation helpers for UI feedback
  const getThemeNameValidation = () => {
    const trimmedName = themeName.trim();
    if (trimmedName.length === 0) return { isValid: false, message: '' };
    if (trimmedName.length < 3) return { isValid: false, message: 'Theme name must be at least 3 characters' };
    if (trimmedName.length > 50) return { isValid: false, message: 'Theme name must be 50 characters or less' };
    return { isValid: true, message: '' };
  };

  const getEmptyWordCount = () => {
    return words.filter(word => word.trim().length === 0).length;
  };

  const handleBack = () => {
    // Check if user has unsaved changes
    const hasChanges = themeName.trim().length > 0 || words.some(word => word.trim().length > 0);
    
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          {
            text: 'Stay',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
  };

  const clearAllWords = () => {
    Alert.alert(
      'Clear All Words?',
      'This will clear all words you\'ve entered. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setWords(Array(numCards).fill('')),
        },
      ]
    );
  };

  const handleSaveTheme = async () => {
    // Final validation
    const themeValidation = getThemeNameValidation();
    if (!themeValidation.isValid) {
      setNameError(themeValidation.message);
      return;
    }

    if (!areAllWordsValid()) {
      Alert.alert(
        'Incomplete Words',
        `Please fill in all ${getEmptyWordCount()} empty word fields before saving.`
      );
      return;
    }

    setSaving(true);
    setNameError('');

    try {
      // Filter out empty words and trim whitespace
      const cleanWords = words.map(word => word.trim()).filter(word => word.length > 0);
      
      const newTheme = await createCustomTheme(themeName.trim(), cleanWords);
      
      Alert.alert(
        'Theme Saved!',
        `Your custom theme "${themeName.trim()}" has been saved successfully.`,
        [
          {
            text: 'Create Another',
            onPress: () => {
              setThemeName('');
              setWords(Array(numCards).fill(''));
            },
          },
          {
            text: 'Start Game',
            onPress: () => {
              router.push({
                pathname: '/word/word-gamestart',
                params: {
                  theme: newTheme.name,
                  numCards: cleanWords.length.toString(),
                  players: JSON.stringify(players),
                  words: JSON.stringify(cleanWords),
                  isCustomTheme: 'true'
                }
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving theme:', error);
      
      // Handle specific error types
      if (error instanceof Error && error.message.includes('already exists')) {
        setNameError('A theme with this name already exists. Please choose a different name.');
      } else {
        Alert.alert(
          'Save Failed',
          'Failed to save your custom theme. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAIAssistance = () => {
    router.push({
      pathname: '/word/word-ai-theme',
      params: {
        numCards: numCards.toString(),
        players: JSON.stringify(players),
        currentThemeName: themeName,
        currentWords: JSON.stringify(words)
      }
    });
  };

  const themeValidation = getThemeNameValidation();
  const emptyWordCount = getEmptyWordCount();

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>


      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >

          {/* Number of Cards Selection */}
        <View style={styles.cardSelectionContainer}>
          <Text style={styles.cardSelectionHeader}>Number of Cards</Text>
          <View style={styles.cardOptionBubbles}>
            {CARD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.cardBubble,
                  numCards === option && styles.cardBubbleSelected
                ]}
                onPress={() => setNumCards(option)}
              >
                <Text style={[
                  styles.cardBubbleText,
                  numCards === option && styles.cardBubbleTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
          
          {/* Theme Name Section */}
          <View style={layoutStyles.section}>
            <Text style={textStyles.h4}>Theme Name</Text>
            <TextInput
              style={[
                styles.themeNameInput,
                !themeValidation.isValid && themeName.trim().length > 0 && styles.inputError,
                nameError.length > 0 && styles.inputError
              ]}
              placeholder="Enter a unique theme name..."
              placeholderTextColor={colors.gray400}
              value={themeName}
              onChangeText={(text) => {
                setThemeName(text);
                setNameError('');
              }}
              maxLength={50}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {(themeValidation.message || nameError) && (
              <Text style={styles.errorText}>
                {nameError || themeValidation.message}
              </Text>
            )}
            <Text style={styles.characterCount}>
              {themeName.length}/50 characters
            </Text>
          </View>

          {/* Words Section */}
          <View style={layoutStyles.section}>
            <View style={styles.wordsHeader}>
              <Text style={textStyles.h4}>Words</Text>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={clearAllWords}
                disabled={words.every(word => word.trim().length === 0)}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={layout.iconSize.sm} 
                  color={words.every(word => word.trim().length === 0) ? colors.gray400 : colors.error} 
                />
                <Text style={[
                  styles.clearButtonText,
                  words.every(word => word.trim().length === 0) && styles.clearButtonTextDisabled
                ]}>
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>

            {emptyWordCount > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {numCards - emptyWordCount} of {numCards} words completed
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${((numCards - emptyWordCount) / numCards) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            )}

            <View style={styles.wordsGrid}>
              {words.map((word, index) => (
                <View key={index} style={styles.wordInputContainer}>
                  <Text style={styles.wordLabel}>Word {index + 1}</Text>
                  <TextInput
                    style={[
                      styles.wordInput,
                      word.trim().length === 0 && styles.wordInputEmpty
                    ]}
                    placeholder={`Enter word ${index + 1}...`}
                    placeholderTextColor={colors.gray400}
                    value={word}
                    onChangeText={(text) => handleWordChange(index, text)}
                    autoCapitalize="words"
                    returnKeyType={index === words.length - 1 ? "done" : "next"}
                  />
                  {word.trim().length > 0 && (
                    <TouchableOpacity 
                      style={styles.clearWordButton}
                      onPress={() => handleWordChange(index, '')}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.gray400} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <Button
            title="AI Assistance"
            variant="outline"
            size="md"
            icon="sparkles-outline"
            onPress={handleAIAssistance}
            style={styles.aiButton}
          />

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              💡 Create your own custom word theme! Make sure all words are filled in and your theme name is unique. Use AI assistance for inspiration!
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Buttons */}
        <View style={styles.bottomButtonsContainer}>            
          <Button
            title={saving ? "Saving..." : "Save & Start Game"}
            variant="primary"
            size="lg"
            icon={saving ? undefined : "save-outline"}
            onPress={handleSaveTheme}
            disabled={!canSaveTheme()}
            loading={saving}
            style={styles.bottomButton}
          />
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
  // Fixed Layout Structure
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Fixed Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg, 
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  
  headerButton: {
    padding: spacing.sm,
  },

  // Card Selection Styles
  cardSelectionContainer: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },

  cardSelectionHeader: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    marginBottom: spacing.md,
  },

  cardOptionBubbles: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  cardBubble: {
    backgroundColor: colors.gray100,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  cardBubbleSelected: {
    backgroundColor: colors.secondary + '20',
    borderColor: colors.secondary,
  },

  cardBubbleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
  },

  cardBubbleTextSelected: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.bold,
  },

  // Scrollable Content Area
  scrollableContent: {
    flex: 1, // Takes remaining space between header and footer
  },

  scrollContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md, // Small bottom padding
  },

  // Fixed Bottom Buttons Container
  bottomButtonsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    // Elevation for Android shadow
    elevation: 2,
    // iOS shadow
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  bottomButton: {
    width: '100%',
  },

  // Theme Name Section
  themeNameInput: {
    ...createInputStyle('default'),
    marginTop: spacing.sm,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },

  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },

  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },

  characterCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Words Section
  wordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  clearButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
  },

  clearButtonTextDisabled: {
    color: colors.gray400,
  },

  progressContainer: {
    marginBottom: spacing.lg,
  },

  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },

  progressBar: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
  },

  wordsGrid: {
    gap: spacing.md,
  },

  wordInputContainer: {
    position: 'relative',
  },

  wordLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },

  wordInput: {
    ...createInputStyle('default'),
    fontSize: typography.fontSize.base,
    paddingRight: spacing['2xl'], // Make room for clear button
  },

  wordInputEmpty: {
    borderColor: colors.gray300,
    backgroundColor: colors.gray50,
  },

  clearWordButton: {
    position: 'absolute',
    right: spacing.sm,
    top: '62%', 
    transform: [{ translateY: -10 }],
    padding: spacing.xs,
  },

  // AI Assistance Button
  aiButton: {
    width: '100%',
    marginBottom: spacing.lg,
  },

  // Help Section
  helpContainer: {
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md, // Reduced margin since buttons are now fixed
  },

  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.4,
  },
});