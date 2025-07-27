import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator } from 'react-native';
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
// Import our new database functions
import { getAllThemeNames, getRandomWordsFromTheme } from '../../lib/themeService';

const { width: screenWidth } = Dimensions.get('window');

interface ThemePreview {
  themeName: string;
  words: string[];
  loading: boolean;
}

export default function WordTheme() {
  // Get initial numCards from the previous screen (word-setup)
  const params = useLocalSearchParams();
  const initialNumCards = parseInt(params.numCards as string) || 8;
  const players = JSON.parse(params.players as string || '[]');
  
  const [selectedTheme, setSelectedTheme] = useState('Countries');
  const [numCards, setNumCards] = useState(initialNumCards);
  const [themeNames, setThemeNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [themePreviews, setThemePreviews] = useState<Record<string, ThemePreview>>({});
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  // Constraints for numCards
  const MIN_CARDS = 4;
  const MAX_CARDS = 16;

  // Load theme names on component mount
  useEffect(() => {
    loadThemeNames();
  }, []);

  const loadThemeNames = async () => {
    try {
      setLoading(true);
      const names = await getAllThemeNames();
      setThemeNames(names);
      
      // Set the first theme as selected if we have themes
      if (names.length > 0 && !selectedTheme) {
        setSelectedTheme(names[0]);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
      Alert.alert(
        'Error', 
        'Failed to load themes. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: loadThemeNames
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadThemePreview = async (themeName: string, refresh: boolean = false) => {
    // Don't reload if we already have this preview and it's not a refresh
    if (!refresh && themePreviews[themeName] && !themePreviews[themeName].loading) {
      return;
    }

    try {
      // Set loading state
      setThemePreviews(prev => ({
        ...prev,
        [themeName]: {
          themeName,
          words: prev[themeName]?.words || [],
          loading: true
        }
      }));

      const words = await getRandomWordsFromTheme(themeName, numCards);
      
      setThemePreviews(prev => ({
        ...prev,
        [themeName]: {
          themeName,
          words,
          loading: false
        }
      }));
    } catch (error) {
      console.error('Error loading theme preview:', error);
      setThemePreviews(prev => ({
        ...prev,
        [themeName]: {
          themeName,
          words: [],
          loading: false
        }
      }));
      Alert.alert('Error', 'Failed to load theme preview.');
    }
  };

  // Update previews when numCards changes
  useEffect(() => {
    // Reload all existing previews with new card count
    Object.keys(themePreviews).forEach(themeName => {
      loadThemePreview(themeName, true);
    });
  }, [numCards]);

  // Go back to the player setup screen
  const handleBack = () => {
    router.back();
  };

  const handleStartGame = () => {
    const preview = themePreviews[selectedTheme];
    if (!preview || preview.words.length === 0) {
      Alert.alert('Error', 'No words available for the selected theme.');
      return;
    }

    // Navigate to game screen with selected theme and words
    router.push({
      pathname: '/word/word-gamestart',
      params: {
        theme: selectedTheme,
        numCards: numCards.toString(),
        players: JSON.stringify(players),
        words: JSON.stringify(preview.words)
      }
    });
  };

  const handleThemePress = (themeName: string) => {
    // Set as selected theme
    setSelectedTheme(themeName);
    
    // Toggle expansion
    if (expandedTheme === themeName) {
      setExpandedTheme(null);
    } else {
      setExpandedTheme(themeName);
      loadThemePreview(themeName);
    }
  };

  const refreshThemePreview = (themeName: string) => {
    loadThemePreview(themeName, true);
  };

  const handleCreateCustomTheme = () => {
    router.push({
      pathname: '/word/word-custom-theme',
      params: {
        numCards: numCards.toString(),
        players: JSON.stringify(players),
      }
    });
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

  // Calculate grid layout for two columns
  const cardWidth = (screenWidth - spacing.lg * 2 - spacing.md * 3) / 2; // Account for container padding and gap
  const cardHeight = 60;

  // Theme Item Component
  const ThemeItem = ({ theme }: { theme: string }) => {
    const isSelected = selectedTheme === theme;
    const isExpanded = expandedTheme === theme;
    const preview = themePreviews[theme];

    return (
      <View style={styles.themeItemContainer}>
        <TouchableOpacity
          style={combineStyles(
            styles.themeItem,
            isSelected && styles.themeItemSelected
          )}
          onPress={() => handleThemePress(theme)}
        >
          <Text style={combineStyles(
            textStyles.body,
            isSelected && styles.themeTextSelected
          )}>
            {theme}
          </Text>
          <Ionicons 
            name={isExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
            size={layout.iconSize.sm} 
            color={isSelected ? colors.secondary : colors.gray400} 
          />
        </TouchableOpacity>
        
        {/* Theme Preview Expansion */}
        {isExpanded && (
          <View style={styles.themePreview}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                {theme} Preview ({numCards} cards)
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={() => refreshThemePreview(theme)}
                disabled={preview?.loading}
              >
                {preview?.loading ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <Ionicons name="refresh" size={layout.iconSize.sm} color={colors.secondary} />
                )}
              </TouchableOpacity>
            </View>
            
            {/* Two-column grid for preview cards */}
            <View style={styles.previewGrid}>
              {preview?.words.map((word, index) => (
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
              )) || []}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={combineStyles(layoutStyles.container, layoutStyles.centered)}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={combineStyles(textStyles.body, styles.loadingText)}>
          Loading themes...
        </Text>
      </View>
    );
  }

  // Show error state if no themes loaded
  if (themeNames.length === 0) {
    return (
      <View style={combineStyles(layoutStyles.container, layoutStyles.centered)}>
        <Ionicons name="warning-outline" size={48} color={colors.error} />
        <Text style={combineStyles(textStyles.h4, styles.errorText)}>
          No themes available
        </Text>
        <Button
          title="Retry"
          variant="primary"
          size="md"
          onPress={loadThemeNames}
          style={styles.retryButton}
        />
      </View>
    );
  }

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

        {/* Theme Selection Section */}
        <View style={layoutStyles.section}>
          <Text style={textStyles.h4}>Choose Theme</Text>
          <Text style={styles.expandHint}>
            💡 Tap any theme to preview its words
          </Text>
          <View style={styles.themeList}>
            {themeNames.map((theme) => (
              <ThemeItem key={theme} theme={theme} />
            ))}
          </View>
        </View>

        {/* Create Custom Theme Button */}
        <Button
          title="Create your own theme"
          variant="outline"
          size="md"
          icon="add-outline"
          onPress={handleCreateCustomTheme}
          style={styles.customThemeButton}
        />

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

  expandHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  
  themeList: {
    gap: spacing.sm, 
  },

  themeItemContainer: {
    // Container for theme item and its preview
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
    backgroundColor: colors.white,
  },
  
  themeItemSelected: {
    borderColor: colors.secondary, 
    backgroundColor: colors.secondary + '10', 
  },
  
  themeTextSelected: {
    color: colors.secondary, 
    fontWeight: typography.fontWeight.semibold, 
  },

  // Theme Preview Styles
  themePreview: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray200,
  },

  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  previewTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
  },

  refreshButton: {
    padding: spacing.sm,
  },

  // Fixed two-column grid layout
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
    borderColor: colors.gray200,
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

  customThemeButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  startButton: {
    marginBottom: spacing.xl,
  },

  // Loading and error states
  loadingText: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.gray600,
  },

  errorText: {
    textAlign: 'center',
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  retryButton: {
    minWidth: 120,
  },
});