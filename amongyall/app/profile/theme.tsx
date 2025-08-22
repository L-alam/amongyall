// app/profile/themes.tsx
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
import { getUserCustomThemes, deleteCustomTheme, Theme } from '../../lib/themeService';

export default function ProfileThemesScreen() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadThemes = async () => {
    try {
      const userThemes = await getUserCustomThemes();
      setThemes(userThemes);
    } catch (error) {
      console.error('Error loading themes:', error);
      Alert.alert('Error', 'Failed to load your themes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadThemes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadThemes();
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeleteTheme = (theme: Theme) => {
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

  const renderThemeItem = ({ item }: { item: Theme }) => (
    <View style={styles.themeCard}>
      <View style={styles.themeInfo}>
        <Text style={styles.themeName}>{item.name}</Text>
        <Text style={styles.themeDate}>
          Created {new Date(item.created_at || '').toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.themeActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteTheme(item)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>My Themes</Text>
        
        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      <View style={layoutStyles.content}>
        {loading ? (
          <View style={[layoutStyles.centered, { flex: 1 }]}>
            <Text style={textStyles.body}>Loading your themes...</Text>
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
});