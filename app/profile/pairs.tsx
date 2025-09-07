// app/profile/pairs.tsx
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
import { getUserCustomPairs, deleteCustomPair, getCustomPairs, WavelengthPair } from '../../lib/wavelengthService';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePairsScreen() {
  const { isAuthenticated } = useAuth();
  const [pairs, setPairs] = useState<WavelengthPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPairs = async () => {
    try {
      // Load user's pairs if authenticated, or all custom pairs if not
      const userPairs = isAuthenticated ? await getUserCustomPairs() : await getCustomPairs();
      setPairs(userPairs);
    } catch (error) {
      console.error('Error loading pairs:', error);
      Alert.alert('Error', 'Failed to load word pairs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPairs();
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPairs();
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeletePair = (pair: WavelengthPair) => {
    // Only allow deletion if user created it or it's anonymous
    const canDelete = isAuthenticated ? pair.created_by : !pair.created_by;
    
    if (!canDelete) {
      Alert.alert('Cannot Delete', 'You can only delete pairs you created.');
      return;
    }

    Alert.alert(
      'Delete Word Pair',
      `Are you sure you want to delete "${pair.term_0} / ${pair.term_1}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomPair(pair.id);
              setPairs(pairs.filter(p => p.id !== pair.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete pair');
            }
          },
        },
      ]
    );
  };

  const renderPairItem = ({ item }: { item: WavelengthPair }) => {
    const canDelete = isAuthenticated ? item.created_by : !item.created_by;
    
    return (
      <View style={styles.pairCard}>
        <View style={styles.pairInfo}>
          <Text style={styles.pairTerms}>{item.term_0} ↔ {item.term_1}</Text>
          <Text style={styles.pairDate}>
            Created {new Date(item.created_at || '').toLocaleDateString()}
            {!item.created_by && ' (Anonymous)'}
          </Text>
        </View>
        
        {canDelete && (
          <View style={styles.pairActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeletePair(item)}
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
          {isAuthenticated ? 'My Word Pairs' : 'Custom Word Pairs'}
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      <View style={layoutStyles.content}>
        {loading ? (
          <View style={[layoutStyles.centered, { flex: 1 }]}>
            <Text style={textStyles.body}>Loading word pairs...</Text>
          </View>
        ) : pairs.length === 0 ? (
          <View style={[layoutStyles.centered, { flex: 1 }]}>
            <Ionicons name="swap-horizontal-outline" size={48} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No Custom Word Pairs Yet</Text>
            <Text style={styles.emptySubtitle}>
              {isAuthenticated 
                ? "Create your first custom word pair to see it here"
                : "No custom word pairs have been created yet"
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={pairs}
            renderItem={renderPairItem}
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
  pairCard: {
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
  pairInfo: {
    flex: 1,
  },
  pairTerms: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  pairDate: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  pairActions: {
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