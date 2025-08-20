import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { getAllThemeNames, getRandomWordsFromTheme, getUserCustomThemes, deleteCustomTheme, Theme } from '../../lib/themeService';

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
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [themePreviews, setThemePreviews] = useState<Record<string, ThemePreview>>({});
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [customThemesExpanded, setCustomThemesExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Constraints for numCards
  const MIN_CARDS = 4;
  const MAX_CARDS = 16;

  // Load theme names and custom themes on component mount
  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      
      // Load both regular themes and custom themes
      const [regularThemes, userCustomThemes] = await Promise.all([
        getAllThemeNames(),
        getUserCustomThemes()
      ]);
      
      setThemeNames(regularThemes);
      setCustomThemes(userCustomThemes);
      
      // Set the first theme as selected if we have themes
      if (regularThemes.length > 0 && !selectedTheme) {
        setSelectedTheme(regularThemes[0]);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
      Alert.alert(
        'Error', 
        'Failed to load themes. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: loadThemes
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

  const handleCreateCustomTheme = () => {
    router.push({
      pathname: '/word/word-custom-theme',
      params: {
        numCards: numCards.toString(),
        players: JSON.stringify(players)
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

  const handleCustomThemePress = (theme: Theme) => {
    // Same logic as regular themes
    handleThemePress(theme.name);
  };

  const handleDeleteCustomTheme = async (theme: Theme) => {
    Alert.alert(
      'Delete Theme',
      `Are you sure you want to delete "${theme.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomTheme(theme.id);
              
              // Remove from local state
              setCustomThemes(prev => prev.filter(t => t.id !== theme.id));
              
              // If this was the selected theme, clear selection
              if (selectedTheme === theme.name) {
                setSelectedTheme(themeNames.length > 0 ? themeNames[0] : '');
              }
              
              // Remove from previews
              setThemePreviews(prev => {
                const newPreviews = { ...prev };
                delete newPreviews[theme.name];
                return newPreviews;
              });
              
              // Clear expansion if this theme was expanded
              if (expandedTheme === theme.name) {
                setExpandedTheme(null);
              }
              
            } catch (error) {
              console.error('Error deleting theme:', error);
              Alert.alert('Error', 'Failed to delete theme. Please try again.');
            }
          }
        }
      ]
    );
  };

  const refreshThemePreview = (themeName: string) => {
    loadThemePreview(themeName, true);
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

  // Filter themes based on search query (search theme names and words)
  const filteredThemeNames = themeNames.filter(theme => {
    // Check if theme name matches
    if (theme.toLowerCase().includes(searchQuery.toLowerCase())) {
      return true;
    }
    
    // Check if any words in the theme match
    const preview = themePreviews[theme];
    if (preview && preview.words.length > 0) {
      return preview.words.some(word => 
        word.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return false;
  });

  
  const filteredCustomThemes = customThemes.filter(theme => {
    // Check if theme name matches
    if (theme.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return true;
    }
    
    // Check if any words in the theme match
    const preview = themePreviews[theme.name];
    if (preview && preview.words.length > 0) {
      return preview.words.some(word => 
        word.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return false;
  });

  // Theme Item Component for regular themes
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

  // Custom Theme Item Component
  const CustomThemeItem = ({ theme }: { theme: Theme }) => {
    const isSelected = selectedTheme === theme.name;
    const isExpanded = expandedTheme === theme.name;
    const preview = themePreviews[theme.name];

    return (
      <View style={styles.themeItemContainer}>
        <TouchableOpacity
          style={combineStyles(
            styles.themeItem,
            styles.customThemeItem,
            isSelected && styles.themeItemSelected
          )}
          onPress={() => handleCustomThemePress(theme)}
        >
          <View style={styles.customThemeHeader}>
            <View style={styles.customThemeInfo}>
              <Text style={combineStyles(
                textStyles.body,
                isSelected && styles.themeTextSelected
              )}>
                {theme.name}
              </Text>
            </View>
            <View style={styles.customThemeActions}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteCustomTheme(theme)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={layout.iconSize.sm} 
                  color={colors.error} 
                />
              </TouchableOpacity>
              <Ionicons 
                name={isExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
                size={layout.iconSize.sm} 
                color={isSelected ? colors.secondary : colors.gray400} 
              />
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Theme Preview Expansion */}
        {isExpanded && (
          <View style={styles.themePreview}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                {theme.name} Preview ({numCards} cards)
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={() => refreshThemePreview(theme.name)}
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
  if (themeNames.length === 0 && customThemes.length === 0) {
    return (
      <View style={combineStyles(layoutStyles.container, layoutStyles.centered)}>
        <Ionicons name="warning-outline" size={48} color={colors.error} />
        <Text style={combineStyles(textStyles.h4, styles.errorText)}>
          No themes available
        </Text>
        <View style={styles.backButtonContainer}>
          <Button
            title="Retry"
            variant="primary"
            size="md"
            onPress={loadThemes}
            style={styles.retryButton}
          />
          <Button
            title="Back to Home"
            variant="primary"
            size="md"
            onPress={handleBack}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={layoutStyles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>Word Chameleon</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Fixed Number of Cards Controls */}
      <View style={styles.cardControlsContainer}>
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

      {/* Scrollable Content Area */}
      <ScrollView 
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Selection Header */}
        <Text style={textStyles.h4}>Choose Theme</Text>
        
        {/* Search Field */}
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={layout.iconSize.sm} 
            color={colors.gray400} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search themes..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons 
                name="close-circle" 
                size={layout.iconSize.sm} 
                color={colors.gray400} 
              />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.expandHint}>
          💡 Tap any theme to preview its words
        </Text>

        {/* Custom Themes Section */}
        {filteredCustomThemes.length > 0 && (
          <View style={styles.customThemesSection}>
            <TouchableOpacity
              style={styles.customThemesHeader}
              onPress={() => setCustomThemesExpanded(!customThemesExpanded)}
            >
              <Text style={styles.customThemesTitle}>
                Your Themes ({filteredCustomThemes.length})
              </Text>
              <Ionicons 
                name={customThemesExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
                size={layout.iconSize.sm} 
                color={colors.primary} 
              />
            </TouchableOpacity>

            {customThemesExpanded && (
              <View style={styles.customThemesList}>
                {filteredCustomThemes.map((theme) => (
                  <CustomThemeItem key={theme.id} theme={theme} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Regular Themes List */}
        {filteredThemeNames.length > 0 && (
          <View style={styles.regularThemesSection}>
            <Text style={styles.sectionTitle}>Available Themes</Text>
            <View style={styles.themeList}>
              {filteredThemeNames.map((theme) => (
                <ThemeItem key={theme} theme={theme} />
              ))}
            </View>
          </View>
        )}

        {/* No Results Message */}
        {searchQuery.length > 0 && filteredThemeNames.length === 0 && filteredCustomThemes.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={48} color={colors.gray400} />
            <Text style={styles.noResultsText}>
              No themes found for "{searchQuery}"
            </Text>
            <Text style={styles.noResultsSubtext}>
              Try a different search term or create a custom theme
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomButtonsContainer}>
        <Button
          title="Create Custom Theme"
          variant="outline"
          size="lg"
          icon="add-outline"
          onPress={handleCreateCustomTheme}
          style={styles.bottomButton}
        />
        
        <Button
          title="START GAME"
          variant="primary"
          size="lg"
          onPress={handleStartGame}
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fixed Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg, 
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  
  headerButton: {
    padding: spacing.sm,
  },

  // Fixed Card Controls
  cardControlsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
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

  // Scrollable Content
  scrollableContent: {
    flex: 1,
  },

  scrollContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  expandHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    marginBottom: spacing.md, // Reduced from spacing.lg
  },

  // Search Field
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },

  searchIcon: {
    marginRight: spacing.sm,
  },

  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray800,
  },

  clearSearchButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },

  // Custom Themes Section
  customThemesSection: {
    marginBottom: spacing.md, // Reduced from spacing.xl
  },

  customThemesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gray100, // Changed from warning color
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200, // Changed from warning color
    marginBottom: spacing.sm,
  },

  customThemesTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  customThemesList: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  // Regular Themes Section
  regularThemesSection: {
    // No specific styling needed
  },

  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
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

  customThemeItem: {
    backgroundColor: colors.gray50,
    borderColor: colors.gray300, // Changed from warning color
  },
  
  themeItemSelected: {
    borderColor: colors.secondary, 
    backgroundColor: colors.secondary + '10', 
  },
  
  themeTextSelected: {
    color: colors.secondary, 
    fontWeight: typography.fontWeight.semibold, 
  },

  // Custom Theme Item Specific
  customThemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  customThemeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  customThemeIcon: {
    marginRight: spacing.sm,
  },

  // No Results Message
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },

  noResultsText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  noResultsSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
  },

  customThemeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  deleteButton: {
    padding: spacing.xs,
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

  // Fixed Bottom Buttons
  bottomButtonsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: spacing.md,
  },

  bottomButton: {
    width: '100%',
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
  
  backButton: {
    minWidth: 120,
  },

  backButtonContainer: {
    flexDirection: "column", 
    gap: 10,  // spaces out children evenly
  },

});