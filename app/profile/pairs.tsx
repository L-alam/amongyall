// app/profile/pairs.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { WavelengthPair, canDeletePair, deleteCustomPair, getUserCustomPairs } from '../../lib/wavelengthService';
import { layoutStyles, textStyles } from '../../utils/styles';

export default function ProfilePairsScreen() {
  const { isAuthenticated } = useAuth();
  const [pairs, setPairs] = useState<WavelengthPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPairs = async () => {
    try {
      const userPairs = await getUserCustomPairs();
      setPairs(userPairs);
    } catch (error) {
      console.error('Error loading pairs:', error);
      Alert.alert('Error', 'Failed to load pairs');
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
    if (!canDeletePair(pair)) {
      Alert.alert('Cannot Delete', 'You can only delete pairs you created.');
      return;
    }

    Alert.alert(
      'Delete Pair',
      `Are you sure you want to delete "${pair.term_0} ↔ ${pair.term_1}"? This action cannot be undone.`,
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
    const canDelete = canDeletePair(item);
    const isOwned = isAuthenticated ? item.created_by : !item.created_by;

    return (
      <View style={styles.pairCard}>
        <View style={styles.pairInfo}>
          <View style={styles.pairTerms}>
            <Text style={styles.pairTerm}>{item.term_0}</Text>
            <Ionicons name="swap-horizontal" size={16} color={colors.gray400} />
            <Text style={styles.pairTerm}>{item.term_1}</Text>
          </View>
          <Text style={styles.pairDate}>
            Created {new Date(item.created_at || '').toLocaleDateString()}
            {!isOwned && ' • Shared'}
          </Text>
        </View>
        <View style={styles.pairActions}>
          {canDelete && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeletePair(item)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={textStyles.h2}>Your Custom Pairs</Text>
        
        {loading ? (
          <View style={[layoutStyles.centered, { flex: 1 }]}>
            <Text style={textStyles.body}>Loading pairs...</Text>
          </View>
        ) : pairs.length === 0 ? (
          <View style={[layoutStyles.centered, { flex: 1 }]}>
            <Ionicons name="swap-horizontal-outline" size={48} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No Custom Pairs Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first custom word pair to see it here
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
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing['3xl'],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  pairTerm: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray900,
    flex: 1,
    textAlign: 'center',
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
  bottomButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomButton: {
    width: '100%',
  },
});