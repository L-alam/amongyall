// app/profile/themes.tsx
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
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { Theme, canDeleteTheme, deleteCustomTheme, getUserCustomThemes } from '../../lib/themeService';
import { layoutStyles, textStyles } from '../../utils/styles';

export default function ProfileThemesScreen() {
  const { isAuthenticated } = useAuth();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadThemes = async () => {
    try {
      const userThemes = await getUserCustomThemes();
      setThemes(userThemes);
    } catch (error) {
      console.error('Error loading themes:', error);
      Alert.alert('Error', 'Failed to load themes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadThemes();
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    loadThemes();
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeleteTheme = (theme: Theme) => {
    if (!canDeleteTheme(theme)) {
      Alert.alert('Cannot Delete', 'You can only delete themes you created.');
      return;
    }

    Alert.alert(
      'Delete Theme',
      `Are you sure you want to delete "${theme.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomTheme(theme.id);
              setThemes(themes.filter(t => t.id !== theme.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete theme');
            }
          },
        },
      ]
    );
  };

  const handleCreateTheme = () => {
    // Navigate to theme creation page
    router.push('/word/word-setup');
  };

  const renderThemeItem = ({ item }: { item: Theme }) => {
    const canDelete = canDeleteTheme(item);
    const isOwned = isAuthenticated ? item.created_by : !item.created_by;

    return (
      <View style={styles.themeCard}>
        <View style={styles.themeInfo}>
          <Text style={styles.themeName}>{item.name}</Text>
          <Text style={styles.themeDate}>
            Created {new Date(item.created_at || '').toLocaleDateString()}
            {!isOwned && ' • Shared'}
          </Text>
        </View>
        <View style={styles.themeActions}>
          {canDelete && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteTheme(item)}
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
        <Text style={textStyles.h2}>Your Custom Themes</Text>
        
        {loading ? (
          <View style={[layoutStyles.centered, { flex: 1 }]}>
            <Text style={textStyles.body}>Loading themes...</Text>
          </View>
        ) : themes.length === 0 ? (
          <View style={[layoutStyles.centered, { flex: 1 }]}>
            <Ionicons name="list-outline" size={48} color={colors.gray400} />
            <Text style={styles.emptyTitle}>No Custom Themes Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first custom theme to see it here
            </Text>
          </View>
        ) : (
          <FlatList
            data={themes}
            renderItem={renderThemeItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <Button
          title="Create Theme"
          variant="primary"
          size="lg"
          icon="add-outline"
          onPress={handleCreateTheme}
          style={styles.bottomButton}
        />
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
  themeCard: {
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
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  themeDate: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  themeActions: {
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