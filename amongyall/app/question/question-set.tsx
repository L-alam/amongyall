import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { questions, getQuestionsByCategory, getRandomPreviewQuestions, getAllCategories } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

type QuestionPair = { normal: string; spy: string };

export default function QuestionSet() {
  // Get players from the previous screen (question-setup)
  const params = useLocalSearchParams();
  const players = JSON.parse(params.players as string || '[]');
  
  const [selectedSet, setSelectedSet] = useState('Sports');
  const [previewQuestions, setPreviewQuestions] = useState<QuestionPair[]>([]);
  const categories = getAllCategories();

  // Update preview questions when set changes
  useEffect(() => {
    const questionPairs = getRandomPreviewQuestions(selectedSet);
    setPreviewQuestions(questionPairs);
  }, [selectedSet]);

  // Go back to the player setup screen
  const handleBack = () => {
    router.back();
  };

  const handleStartGame = () => {
    // Get the full question set for the selected category
    const fullQuestionSet = getQuestionsByCategory(selectedSet);
    
    // Navigate to game screen with selected set and all questions
    router.push({
      pathname: '/question/question-gamestart',
      params: {
        set: selectedSet,
        players: JSON.stringify(players),
        questions: JSON.stringify(fullQuestionSet?.pairs || [])
      }
    });
  };

  const refreshPreview = () => {
    const questionPairs = getRandomPreviewQuestions(selectedSet);
    setPreviewQuestions(questionPairs);
  };

  // Calculate responsive layout
  const cardWidth = screenWidth - spacing.lg * 2;
  const cardHeight = 'auto'; // Let it size based on content

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
          <View style={styles.setList}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={combineStyles(
                  styles.setItem,
                  selectedSet === category && styles.setItemSelected
                )}
                onPress={() => setSelectedSet(category)}
              >
                <Text style={combineStyles(
                  textStyles.body,
                  selectedSet === category && styles.setTextSelected
                )}>
                  {category}
                </Text>
                {selectedSet === category && (
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
            <View style={layoutStyles.container}>
                <Text style={textStyles.h4}>Preview</Text>
                <Text style={styles.spyQuestionText}>(type of questions you might get)</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={refreshPreview}>
              <Ionicons name="refresh" size={layout.iconSize.sm} color={colors.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.previewContainer}>
            {previewQuestions.map((questionPair, index) => (
              <View 
                key={index} 
                style={[
                  styles.previewCard,
                  { width: cardWidth }
                ]}
              >
                <Text style={styles.normalQuestionText} numberOfLines={3}>
                  {questionPair.normal}
                </Text>
                <Text style={styles.spyQuestionText} numberOfLines={3}>
                  → {questionPair.spy}
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
  
  setList: {
    gap: spacing.sm, 
    marginTop: spacing.md, 
  },
  
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md, 
    paddingHorizontal: spacing.lg, 
    borderWidth: 1,
    borderColor: colors.gray300, 
    borderRadius: 8,
  },
  
  setItemSelected: {
    borderColor: colors.secondary, 
    backgroundColor: colors.secondary + '10', 
  },
  
  setTextSelected: {
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

  previewContainer: {
    gap: spacing.md,
  },

  previewCard: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  normalQuestionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray800,
    lineHeight: typography.fontSize.base * 1.4,
    marginBottom: spacing.sm,
  },

  spyQuestionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray600,
    lineHeight: typography.fontSize.sm * 1.4,
    opacity: 0.8,
    paddingLeft: spacing.md, // Indent the spy question
    fontStyle: 'italic',
  },

  startButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});