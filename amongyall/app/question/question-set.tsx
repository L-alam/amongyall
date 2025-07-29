import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator } from 'react-native';
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

  const handleCategoryPress = (categoryName: string) => {
    // Set as selected category
    setSelectedSet(categoryName);
    
    // Toggle expansion
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

  // Calculate card width accounting for preview container padding
  const cardWidth = screenWidth - spacing.lg * 2 - spacing.md * 2; // Account for content padding + preview padding

  // Category Item Component
  const CategoryItem = ({ category }: { category: string }) => {
    const isSelected = selectedSet === category;
    const isExpanded = expandedCategory === category;
    const preview = categoryPreviews[category];

    return (
      <View style={styles.categoryItemContainer}>
        <TouchableOpacity
          style={combineStyles(
            styles.categoryItem,
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
          <Ionicons 
            name={isExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
            size={layout.iconSize.sm} 
            color={isSelected ? colors.secondary : colors.gray400} 
          />
        </TouchableOpacity>
        
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
    <ScrollView style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>???? Chameleon</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={layoutStyles.content}>
        {/* Set Selection Section */}
        <View style={layoutStyles.section}>
          <Text style={textStyles.h4}>Choose Question Set</Text>
          <Text style={styles.expandHint}>
            💡 Tap any category to preview its questions
          </Text>
          <View style={styles.categoryList}>
            {setNames.map((category) => (
              <CategoryItem key={category} category={category} />
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

  expandHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  
  categoryList: {
    gap: spacing.sm, 
  },

  categoryItemContainer: {
    // Container for category item and its preview
  },
  
  categoryItem: {
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
  
  categoryItemSelected: {
    borderColor: colors.secondary, 
    backgroundColor: colors.secondary + '10', 
  },
  
  categoryTextSelected: {
    color: colors.secondary, 
    fontWeight: typography.fontWeight.semibold, 
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
    width: '100%', // Take full width of container
    alignSelf: 'stretch', // Ensure it stretches to container width
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

  startButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
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