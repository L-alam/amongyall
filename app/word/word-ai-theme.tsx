// app/word/word-ai-theme.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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
import { generateWordsWithAI, GenerateWordsRequest } from '../../lib/openaiService';
import { createCustomTheme } from '../../lib/themeService';

const { width: screenWidth } = Dimensions.get('window');

export default function WordAITheme() {
  // Get initial numCards from the previous screen (word-setup)
  const params = useLocalSearchParams();
  const initialNumCards = parseInt(params.numCards as string) || 8;
  const players = JSON.parse(params.players as string || '[]');
  
  const [numCards, setNumCards] = useState(initialNumCards);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [saving, setSaving] = useState(false);

  // Card options for bubble selection
  const CARD_OPTIONS = [4, 6, 8, 10];

  // Validation functions
  const areAllWordsValid = () => {
    return generatedWords.length > 0 && generatedWords.every(word => word.trim().length > 0);
  };

  const canSaveTheme = () => {
    const trimmedTopic = topic.trim();
    return trimmedTopic.length >= 3 && areAllWordsValid() && !saving && !isGenerating;
  };

  // Go back to the previous screen
  const handleBack = () => {
    router.back();
  };

  const handleGenerateWords = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic first.');
      return;
    }

    setIsGenerating(true);
    setHasGenerated(false);

    try {
      const request: GenerateWordsRequest = {
        topic: topic.trim(),
        count: numCards,
      };

      const response = await generateWordsWithAI(request);

      if (response.success) {
        setGeneratedWords(response.words);
        setHasGenerated(true);
      } else {
        Alert.alert(
          'Generation Failed', 
          response.error || 'Failed to generate words. Please try again.',
          [
            {
              text: 'Retry',
              onPress: handleGenerateWords
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error generating words:', error);
      Alert.alert(
        'Error', 
        'Something went wrong. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: handleGenerateWords
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTheme = async () => {
    // Final validation
    if (!topic.trim() || topic.trim().length < 3) {
      Alert.alert('Invalid Topic', 'Please enter a topic with at least 3 characters.');
      return;
    }

    if (!areAllWordsValid()) {
      Alert.alert('No Words Generated', 'Please generate words first before saving.');
      return;
    }

    setSaving(true);

    try {
      // Create theme name from topic
      const themeName = `AI: ${topic.trim()}`;
      
      // Filter out empty words and trim whitespace
      const cleanWords = generatedWords.map(word => word.trim()).filter(word => word.length > 0);
      
      const newTheme = await createCustomTheme(themeName, cleanWords);
      
      Alert.alert(
        'Theme Saved!',
        `Your AI-generated theme "${themeName}" has been saved successfully.`,
        [
          {
            text: 'Create Another',
            onPress: () => {
              setTopic('');
              setGeneratedWords([]);
              setHasGenerated(false);
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
        Alert.alert('Theme Name Taken', 'A theme with this name already exists. Please choose a different topic.');
      } else {
        Alert.alert(
          'Save Failed',
          'Failed to save your AI-generated theme. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStartGame = () => {
    if (generatedWords.length === 0) {
      Alert.alert('Error', 'Please generate words first.');
      return;
    }

    // Navigate to game screen with AI-generated words
    router.push({
      pathname: '/word/word-gamestart',
      params: {
        theme: `AI: ${topic}`,
        numCards: numCards.toString(),
        players: JSON.stringify(players),
        words: JSON.stringify(generatedWords)
      }
    });
  };

  const handleTopicChange = (text: string) => {
    setTopic(text);
    // Clear previous generation if topic changes
    if (hasGenerated) {
      setHasGenerated(false);
      setGeneratedWords([]);
    }
  };

  const handleDifficultyChange = (newDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(newDifficulty);
    // Clear previous generation if difficulty changes
    if (hasGenerated) {
      setHasGenerated(false);
      setGeneratedWords([]);
    }
  };

  const handleCardSelection = (option: number) => {
    setNumCards(option);
    // Clear previous generation if count changes
    if (hasGenerated) {
      setHasGenerated(false);
      setGeneratedWords([]);
    }
  };

  // Calculate grid layout for two columns
  const cardWidth = (screenWidth - spacing.lg * 2 - spacing.md * 3) / 2;
  const cardHeight = 60;

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
        showsVerticalScrollIndicator={false}
      >
        {/* Number of Cards Selection */}
        <View style={styles.cardSelectionContainer}>
        <View style={styles.cardSelectionTitle}>
        <Text style={textStyles.h3}>AI Custom Theme</Text>
        </View>

          <Text style={styles.cardSelectionHeader}>Number of Cards</Text>
          <View style={styles.cardOptionBubbles}>
            {CARD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.cardBubble,
                  numCards === option && styles.cardBubbleSelected
                ]}
                onPress={() => handleCardSelection(option)}
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

        {/* Topic Input Section */}
        <View style={layoutStyles.section}>
          <Text style={textStyles.h4}>Enter Topic</Text>
          <Text style={styles.hintText}>
            💡 Examples: "2010 NBA All-stars", "Marvel Superheroes", "Italian Food", "90s Movies"
          </Text>
          <TextInput
            style={styles.topicInput}
            placeholder="Type your topic here..."
            placeholderTextColor={colors.gray400}
            value={topic}
            onChangeText={handleTopicChange}
            multiline={false}
            returnKeyType="done"
            editable={!isGenerating}
          />
        </View>

        {/* Generate Button */}
        <View style={layoutStyles.section}>
          <Button
            title={isGenerating ? "GENERATING..." : hasGenerated ? "REGENERATE WORDS" : "GENERATE WORDS"}
            variant="secondary"
            size="md"
            icon={isGenerating ? undefined : "sparkles-outline"}
            onPress={handleGenerateWords}
            disabled={isGenerating || !topic.trim()}
            loading={isGenerating}
            style={styles.generateButton}
          />
        </View>

        {/* Generated Words Preview */}
        {hasGenerated && generatedWords.length > 0 && (
          <View style={layoutStyles.section}>
            <Text style={textStyles.h4}>Generated Words ({generatedWords.length})</Text>
            <Text style={styles.previewHint}>
              Topic: {topic}
            </Text>
            
            {/* Two-column grid for preview cards */}
            <View style={styles.previewGrid}>
              {generatedWords.map((word, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.previewCard,
                    { width: cardWidth, height: cardHeight }
                  ]}
                >
                  <Text style={styles.previewCardText} numberOfLines={2}>
                    {word}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Help Text */}
        {hasGenerated && (
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              💡 Your AI-generated theme is ready! You can start playing immediately or save it to your custom themes collection.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      {hasGenerated && (
        <View style={styles.bottomButtonsContainer}>
          <Button
            title="Start Game Now"
            variant="outline"
            size="md"
            icon="play-outline"
            onPress={handleStartGame}
            style={styles.bottomButton}
          />
          
          <Button
            title={saving ? "Saving..." : "Save & Start Game"}
            variant="primary"
            size="md"
            icon={saving ? undefined : "save-outline"}
            onPress={handleSaveTheme}
            disabled={!canSaveTheme()}
            loading={saving}
            style={styles.bottomButton}
          />
        </View>
      )}
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
    marginBottom: spacing.lg,
  },

  cardSelectionTitle: {
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
    flex: 1,
  },

  scrollContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Fixed Bottom Buttons Container
  bottomButtonsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: spacing.md,
  },

  bottomButton: {
    width: '100%',
  },

  hintText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.sm * 1.4,
  },

  topicInput: {
    ...createInputStyle('default'),
    fontSize: typography.fontSize.base,
    minHeight: 50,
  },

  difficultyContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  difficultyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: 'center',
  },

  difficultyButtonSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '10',
  },

  difficultyButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray600,
  },

  difficultyButtonTextSelected: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.semibold,
  },

  difficultyHint: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  generateButton: {
    width: '100%',
  },

  previewHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  // Two-column grid layout
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  previewCard: {
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.secondary + '30',
    backgroundColor: colors.secondary + '05',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: spacing.sm,
  },

  previewCardText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
    textAlign: 'center',
  },

  // Help Section
  helpContainer: {
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },

  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.4,
  },

  startButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
    
  
});