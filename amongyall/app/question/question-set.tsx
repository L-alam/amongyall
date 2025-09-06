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
import { getRandomPreviewQuestions, getAllQuestionSetNames, getQuestionsBySetName } from '../../lib/questionService';

const { width: screenWidth } = Dimensions.get('window');

type QuestionPair = { normal: string; spy: string };

interface CategoryPreview {
  categoryName: string;
  questionPairs: QuestionPair[];
  loading: boolean;
}

export default function QuestionSet() {
  // Get players from the previous screen (question-setup)
  const params = useLocalSearchParams();
  const players = JSON.parse(params.players as string || '[]');
  
  const [selectedSet, setSelectedSet] = useState('');
  const [setNames, setSetNames] = useState<string[]>([]);
  const [categoryPreviews, setCategoryPreviews] = useState<Record<string, CategoryPreview>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectingRandom, setIsSelectingRandom] = useState(false);

  useEffect(() => {
    loadSets();
  }, []);

  // Load question sets on component mount
  const loadSets = async () => {
    try {
      setLoading(true);

      const questionSets = await getAllQuestionSetNames();
      setSetNames(questionSets);
      
      // Set the first set as selected if we have sets and no current selection
      if (questionSets.length > 0 && !selectedSet) {
        setSelectedSet(questionSets[0]);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert(
        'Error', 
        'Failed to load Question Sets. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: loadSets
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

  const loadCategoryPreview = async (categoryName: string, refresh: boolean = false) => {
    // Don't reload if we already have this preview and it's not a refresh
    if (!refresh && categoryPreviews[categoryName] && !categoryPreviews[categoryName].loading) {
      return;
    }

    try {
      // Set loading state
      setCategoryPreviews(prev => ({
        ...prev,
        [categoryName]: {
          categoryName,
          questionPairs: prev[categoryName]?.questionPairs || [],
          loading: true
        }
      }));

      // Get random preview questions (3 pairs) from database
      const questionPairs = await getRandomPreviewQuestions(categoryName);
      
      setCategoryPreviews(prev => ({
        ...prev,
        [categoryName]: {
          categoryName,
          questionPairs,
          loading: false
        }
      }));
    } catch (error) {
      console.error('Error loading category preview:', error);
      setCategoryPreviews(prev => ({
        ...prev,
        [categoryName]: {
          categoryName,
          questionPairs: [],
          loading: false
        }
      }));
      Alert.alert('Error', 'Failed to load question preview.');
    }
  };

  // Go back to the player setup screen
  const handleBack = () => {
    router.back();
  };

  const handleStartGame = async () => {
    try {
      // Get the full question set for the selected category from database
      const fullQuestionSet = await getQuestionsBySetName(selectedSet);
      
      if (!fullQuestionSet || fullQuestionSet.length === 0) {
        Alert.alert('Error', 'No questions available for the selected set.');
        return;
      }
      
      // Navigate to game screen with selected set and all questions
      router.push({
        pathname: '/question/question-gamestart',
        params: {
          set: selectedSet,
          players: JSON.stringify(players),
          questions: JSON.stringify(fullQuestionSet)
        }
      });
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
    }
  };

  const handleRandomSet = async () => {
    setIsSelectingRandom(true);
    
    try {
      if (setNames.length === 0) {
        Alert.alert('Error', 'No question sets available.');
        return;
      }

      // Select a random set
      const randomIndex = Math.floor(Math.random() * setNames.length);
      const randomSet = setNames[randomIndex];
      
      // Set as selected set
      setSelectedSet(randomSet);
      
      Alert.alert(
        'Random Set Selected!', 
        `"${randomSet}" has been selected`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error selecting random set:', error);
      Alert.alert('Error', 'Failed to select random set. Please try again.');
    } finally {
      setIsSelectingRandom(false);
    }
  };

  const handleCategoryPress = (categoryName: string) => {
    // Only set as selected category, don't auto-expand
    setSelectedSet(categoryName);
  };

  const handleCategoryExpand = (categoryName: string) => {
    // Toggle expansion when chevron is pressed
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryName);
      loadCategoryPreview(categoryName);
    }
  };

  const refreshCategoryPreview = (categoryName: string) => {
    loadCategoryPreview(categoryName, true);
  };

  // Filter sets based on search query
  const filteredSetNames = setNames.filter(set => 
    set.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Category Item Component
  const CategoryItem = ({ category }: { category: string }) => {
    const isSelected = selectedSet === category;
    const isExpanded = expandedCategory === category;
    const preview = categoryPreviews[category];

    return (
      <View style={styles.categoryItemContainer}>
        <View style={styles.categoryItemRow}>
          <TouchableOpacity
            style={combineStyles(
              styles.categoryItemContent,
              isSelected && styles.categoryItemSelected
            )}
            onPress={() => handleCategoryPress(category)}
          >
            <Text style={combineStyles(
              textStyles.body,
              isSelected && styles.categoryTextSelected
            )}>
              {category}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => handleCategoryExpand(category)}
          >
            <Ionicons 
              name={isExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
              size={layout.iconSize.sm} 
              color={isSelected ? colors.secondary : colors.gray400} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Category Preview Expansion */}
        {isExpanded && (
          <View style={styles.categoryPreview}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                {category} Preview
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={() => refreshCategoryPreview(category)}
                disabled={preview?.loading}
              >
                {preview?.loading ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <Ionicons name="refresh" size={layout.iconSize.sm} color={colors.secondary} />
                )}
              </TouchableOpacity>
            </View>
            
            {/* Question pairs preview */}
            <View style={styles.previewContainer}>
              {preview?.questionPairs && preview.questionPairs.length > 0 ? (
                preview.questionPairs.map((questionPair, index) => (
                  <View 
                    key={index} 
                    style={styles.previewCard}
                  >
                    <View style={styles.questionPairContainer}>
                      <View style={styles.normalQuestionContainer}>
                        <Text style={styles.questionLabel}>Everyone gets:</Text>
                        <Text style={styles.normalQuestionText} numberOfLines={4}>
                          {questionPair.normal}
                        </Text>
                      </View>
                      
                      <View style={styles.divider} />
                      
                      <View style={styles.spyQuestionContainer}>
                        <Text style={styles.spyLabel}>Spy gets:</Text>
                        <Text style={styles.spyQuestionText} numberOfLines={4}>
                          {questionPair.spy}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                !preview?.loading && (
                  <Text style={styles.noPreviewText}>No preview available</Text>
                )
              )}
              
              {preview?.loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading preview...</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Show loading state while loading sets
  if (loading) {
    return (
      <View style={combineStyles(layoutStyles.container, layoutStyles.centered)}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={combineStyles(textStyles.body, styles.mainLoadingText)}>
          Loading question sets...
        </Text>
      </View>
    );
  }

  // Show error state if no sets loaded
  if (setNames.length === 0) {
    return (
      <View style={combineStyles(layoutStyles.container, layoutStyles.centered)}>
        <Ionicons name="warning-outline" size={48} color={colors.error} />
        <Text style={combineStyles(textStyles.h4, styles.errorText)}>
          No question sets available
        </Text>
        <Button
          title="Retry"
          variant="primary"
          size="md"
          onPress={loadSets}
          style={styles.retryButton}
        />
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
        
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content Area */}
      <ScrollView 
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
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
            placeholder="Search question sets..."
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
          💡 Tap a set to select it, tap the arrow to preview questions
        </Text>

        {/* Question Sets List */}
        {filteredSetNames.length > 0 && (
          <View style={styles.setsSection}>
            <Text style={styles.sectionTitle}>Available Question Sets</Text>
            <View style={styles.categoryList}>
              {filteredSetNames.map((category) => (
                <CategoryItem key={category} category={category} />
              ))}
            </View>
          </View>
        )}

        {/* No Results Message */}
        {searchQuery.length > 0 && filteredSetNames.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={48} color={colors.gray400} />
            <Text style={styles.noResultsText}>
              No question sets found for "{searchQuery}"
            </Text>
            <Text style={styles.noResultsSubtext}>
              Try a different search term
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomButtonsContainer}>
        <Button
          title={isSelectingRandom ? "Selecting..." : "Play Random"}
          variant="outline"
          size="md"
          icon="shuffle-outline"
          onPress={handleRandomSet}
          disabled={isSelectingRandom}
          style={styles.randomButton}
        />
        
        <Button
          title="START GAME"
          variant="primary"
          size="lg"
          onPress={handleStartGame}
          style={styles.startButton}
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
    paddingTop: spacing['4xl'],
    paddingHorizontal: spacing.lg, 
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  
  headerButton: {
    padding: spacing.sm,
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

  // Search Field
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
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
    color: colors.gray900,
  },

  clearSearchButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },

  expandHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },

  // Question Sets Section
  setsSection: {
    // No specific styling needed
  },

  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    marginBottom: spacing.md,
  },
  
  categoryList: {
    gap: spacing.sm, 
  },

  categoryItemContainer: {
    // Container for category item and its preview
  },

  // New row structure for category items
  categoryItemRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  
  categoryItemContent: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  
  categoryItemSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '10',
  },
  
  categoryTextSelected: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.semibold,
  },

  expandButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.gray200,
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

  // Category Preview Styles
  categoryPreview: {
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

  previewContainer: {
    gap: spacing.md,
  },

  previewCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    alignSelf: 'stretch',
  },

  questionPairContainer: {
    gap: spacing.sm,
  },

  normalQuestionContainer: {
    // Container for normal question
  },

  questionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  normalQuestionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray800,
    lineHeight: typography.fontSize.sm * 1.4,
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray300,
    marginVertical: spacing.xs,
  },

  spyQuestionContainer: {
    // Container for spy question
  },

  spyLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  spyQuestionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
    lineHeight: typography.fontSize.sm * 1.4,
    fontStyle: 'italic',
  },

  noPreviewText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },

  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
  },

  // Fixed Bottom Buttons
  bottomButtonsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  randomButton: {
    width: '100%',
    minHeight: 44,
  },

  startButton: {
    width: '100%',
  },

  // Loading and error states
  mainLoadingText: {
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