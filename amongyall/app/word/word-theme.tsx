import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  createButtonStyle, 
  createButtonTextStyle,
  createInputStyle,
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { themes, getRandomWordsFromTheme, getAllThemeNames } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function WordTheme() {
  // Get initial numCards from the previous screen (word-setup)
  const params = useLocalSearchParams();
  const initialNumCards = parseInt(params.numCards as string) || 8;
  const players = JSON.parse(params.players as string || '[]');
  
  const [selectedTheme, setSelectedTheme] = useState('Countries');
  const [numCards, setNumCards] = useState(initialNumCards);
  const [previewWords, setPreviewWords] = useState<string[]>([]);
  const themeNames = getAllThemeNames();

  // Constraints for numCards
  const MIN_CARDS = 4;
  const MAX_CARDS = 16;

  // Update preview words when theme changes
  useEffect(() => {
    const words = getRandomWordsFromTheme(selectedTheme, numCards);
    setPreviewWords(words);
  }, [selectedTheme, numCards]);

  // Go back to the player setup screen
  const handleBack = () => {
    router.back();
  };

  const handleStartGame = () => {
    // Navigate to game screen with selected theme and words
    router.push({
      pathname: '/word/word-gameplay',
      params: {
        theme: selectedTheme,
        numCards: numCards.toString(),
        players: JSON.stringify(players),
        words: JSON.stringify(previewWords)
      }
    });
  };

  const refreshPreview = () => {
    const words = getRandomWordsFromTheme(selectedTheme, numCards);
    setPreviewWords(words);
  };

  const increaseCards = () => {
    if (numCards < MAX_CARDS) {
      setNumCards(numCards + 1);
    }
  };

  const decreaseCards = () => {
    if (numCards > MIN_CARDS) {
      setNumCards(numCards - 1);
    }
  };

  // Calculate grid layout
  const cardWidth = (screenWidth - spacing.lg * 2 - spacing.md) / 2;
  const cardHeight = 60;

  return (
    <ScrollView style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>Word Chameleon</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={layoutStyles.content}>

        {/* Theme Selection Section */}
        <View style={layoutStyles.section}>
          <Text style={textStyles.h4}>Choose Theme</Text>
          <View style={styles.themeList}>
            {themeNames.map((theme) => (
              <TouchableOpacity
                key={theme}
                style={combineStyles(
                  styles.themeItem,
                  selectedTheme === theme && styles.themeItemSelected
                )}
                onPress={() => setSelectedTheme(theme)}
              >
                <Text style={combineStyles(
                  textStyles.body,
                  selectedTheme === theme && styles.themeTextSelected
                )}>
                  {theme}
                </Text>
                {selectedTheme === theme && (
                  <Ionicons 
                    name="checkmark" 
                    size={layout.iconSize.sm} 
                    color={colors.secondary} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview Section */}
        <View style={layoutStyles.section}>
          <View style={styles.previewHeader}>
            <Text style={textStyles.h4}>Preview ({numCards} cards)</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={refreshPreview}>
              <Ionicons name="refresh" size={layout.iconSize.sm} color={colors.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.previewGrid}>
            {previewWords.map((word, index) => (
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

        {/* Start Button */}
        <Button
          title="START GAME"
          variant="primary"
          size="lg"
          onPress={handleStartGame}
          style={styles.startButton}
        />
      </View>
    </ScrollView>
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
  
  themeList: {
    gap: spacing.sm, 
    marginTop: spacing.md, 
  },
  
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md, 
    paddingHorizontal: spacing.lg, 
    borderWidth: 1,
    borderColor: colors.gray300, 
    borderRadius: 8,
  },
  
  themeItemSelected: {
    borderColor: colors.secondary, 
    backgroundColor: colors.secondary + '10', 
  },
  
  themeTextSelected: {
    color: colors.secondary, 
    fontWeight: typography.fontWeight.semibold, 
  },

  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  refreshButton: {
    padding: spacing.sm,
  },

  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },

  previewCard: {
    backgroundColor: colors.gray100,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },

  previewCardText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
    textAlign: 'center',
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
  
  startButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});