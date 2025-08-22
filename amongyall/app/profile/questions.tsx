// app/profile/questions.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, layout, typography } from '../../constants/theme';
import { textStyles, layoutStyles } from '../../utils/styles';
import { getAllQuestionSets, QuestionSet } from '../../lib/questionService';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileQuestionsScreen() {
  const { isAuthenticated, userId } = useAuth();
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQuestionSets = async () => {
    try {
      // Get all question sets and filter by user if authenticated
      const allSets = await getAllQuestionSets();
      const userSets = isAuthenticated 
        ? allSets.filter(set => set.created_by === userId)
        : allSets.filter(set => set.is_custom); // Show all custom sets for anonymous users
      
      setQuestionSets(userSets);
    } catch (error) {
      console.error('Error loading question sets:', error);
      Alert.alert('Error', 'Failed to load question sets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuestionSets();
  }, [isAuthenticated, userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadQuestionSets();
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeleteQuestionSet = (questionSet: QuestionSet) => {
    // Only allow deletion if user created it or it's anonymous
    const canDelete = isAuthenticated ? questionSet.created_by === userId : !questionSet.created_by;
    
    if (!canDelete) {
      Alert.alert('Cannot Delete', 'You can only delete question sets you created.');
      return;
    }

    Alert.alert(
      'Delete Question Set',
      `Are you sure you want to delete "${questionSet.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement deleteQuestionSet function in questionService
              // await deleteQuestionSet(questionSet.id);
              setQuestionSets(questionSets.filter(qs => qs.id !== questionSet.id));
              Alert.alert('Success', 'Question set deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete question set');
            }
          },
        },
      ]
    );
  };

  const renderQuestionSetItem = ({ item }: { item: QuestionSet }) => {
    const canDelete = isAuthenticated ? item.created_by === userId : !item.created_by;
    
    return (
      <View style={styles.questionSetCard}>
        <View style={styles.questionSetInfo}>
          <Text style={styles.questionSetName}>{item.name}</Text>
          <Text style={styles.questionSetDetails}>
            {item.is_premium ? 'Premium' : 'Free'} • {item.is_custom ? 'Custom' : 'Built-in'}
            {!item.created_by && ' • Anonymous'}
          </Text>
          <Text style={styles.questionSetDate}>
            Created {new Date(item.created_at || '').toLocaleDateString()}
          </Text>
        </View>
        
        {canDelete && (
          <View style={styles.questionSetActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteQuestionSet(item)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>
          {isAuthenticated ? 'My Question Sets' : 'Custom Question Sets'}
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      <View style={layoutStyles.content}>
        {loading ? (
          <View style={[layoutStyles.centered, { flex: 1 }]}>
            <Text style={textStyles.body}>Loading question sets...</Text>
          </View>
        ) : questionSets.length === 0 ? (
          <View style={[layoutStyles.centered, { flex: 1 }]}>
            <Ionicons name="help-circle-outline" size={48} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No Custom Question Sets Yet</Text>
            <Text style={styles.emptySubtitle}>
              {isAuthenticated 
                ? "Create your first custom question set to see it here"
                : "No custom question sets have been created yet"
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={questionSets}
            renderItem={renderQuestionSetItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.xl,
  },
  headerButton: {
    padding: spacing.sm,
    width: 40,
  },
  listContainer: {
    paddingBottom: spacing.lg,
  },
  questionSetCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questionSetInfo: {
    flex: 1,
  },
  questionSetName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  questionSetDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  questionSetDate: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  questionSetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});