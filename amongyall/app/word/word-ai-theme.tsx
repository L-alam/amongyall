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

  // Constraints for numCards
  const MIN_CARDS = 4;
  const MAX_CARDS = 16;

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
        difficulty,
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

  const increaseCards = () => {
    if (numCards < MAX_CARDS) {
      setNumCards(numCards + 1);
      // Clear previous generation if count changes
      if (hasGenerated) {
        setHasGenerated(false);
        setGeneratedWords([]);
      }
    }
  };

  const decreaseCards = () => {
    if (numCards > MIN_CARDS) {
      setNumCards(numCards - 1);
      // Clear previous generation if count changes
      if (hasGenerated) {
        setHasGenerated(false);
        setGeneratedWords([]);
      }
    }
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

  // Calculate grid layout for two columns
  const cardWidth = (screenWidth - spacing.lg * 2 - spacing.md * 3) / 2;
  const cardHeight = 60;

  return (
    <KeyboardAvoidingView 
      style={layoutStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={layoutStyles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={textStyles.h2}>AI Word Generator</Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={layoutStyles.content}>
          
          {/* Number of Cards Controls */}
          <View style={layoutStyles.section}>
            <Text style={textStyles.h4}>Number Of Cards: {numCards}</Text>
            <View style={styles.cardCountControls}>
              <TouchableOpacity 
                style={[
                  styles.countButton,
                  numCards <= MIN_CARDS && styles.countButtonDisabled
                ]}
                onPress={decreaseCards}
                disabled={numCards <= MIN_CARDS}
              >
                <Text style={[
                  styles.countButtonText,
                  numCards <= MIN_CARDS && styles.countButtonTextDisabled
                ]}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.countButton,
                  numCards >= MAX_CARDS && styles.countButtonDisabled
                ]}
                onPress={increaseCards}
                disabled={numCards >= MAX_CARDS}
              >
                <Text style={[
                  styles.countButtonText,
                  numCards >= MAX_CARDS && styles.countButtonTextDisabled
                ]}>+</Text>
              </TouchableOpacity>
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

          {/* Difficulty Selection */}
          <View style={layoutStyles.section}>
            <Text style={textStyles.h4}>Difficulty Level</Text>
            <View style={styles.difficultyContainer}>
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    difficulty === level && styles.difficultyButtonSelected
                  ]}
                  onPress={() => handleDifficultyChange(level)}
                  disabled={isGenerating}
                >
                  <Text style={[
                    styles.difficultyButtonText,
                    difficulty === level && styles.difficultyButtonTextSelected
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.difficultyHint}>
              Easy: Well-known terms • Medium: Some challenge • Hard: Expert level
            </Text>
          </View>

          {/* Generate Button */}
          <View style={layoutStyles.section}>
            <Button
              title={isGenerating ? "GENERATING..." : hasGenerated ? "REGENERATE WORDS" : "GENERATE WORDS"}
              variant="secondary"
              size="lg"
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

          {/* Start Game Button */}
          {hasGenerated && (
            <Button
              title="START GAME"
              variant="primary"
              size="lg"
              onPress={handleStartGame}
              style={styles.startButton}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg, 
    paddingBottom: spacing.lg, 
  },
  
  headerButton: {
    padding: spacing.sm,
  },

  cardCountControls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md, 
  },
  
  countButton: {
    backgroundColor: colors.gray100, 
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countButtonDisabled: {
    backgroundColor: colors.gray200,
    opacity: 0.5,
  },
  
  countButtonText: {
    fontSize: typography.fontSize.xl, 
    fontWeight: typography.fontWeight.bold, 
    color: colors.primary, 
  },

  countButtonTextDisabled: {
    color: colors.gray400,
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

  startButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});