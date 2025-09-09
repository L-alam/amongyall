// app/profile/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { colors, layout, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile, UserStats, userProfileService } from '../../lib/userProfileService';
import { layoutStyles, textStyles } from '../../utils/styles';

export default function ProfileScreen() {
  const { user, isAnonymous, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfileData = async () => {
    try {
      const [profileData, statsData] = await Promise.all([
        userProfileService.getCurrentUserProfile(),
        userProfileService.getUserStats(),
      ]);
      
      setProfile(profileData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handleBack = () => {
    router.back();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You\'ll continue with an anonymous session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleViewThemes = () => {
    router.push('/profile/themes');
  };

  const handleViewPairs = () => {
    router.push('/profile/pairs');
  };

  const handleViewQuestions = () => {
    router.push('/profile/questions');
  };

  if (loading) {
    return (
      <View style={[layoutStyles.container, layoutStyles.centered]}>
        <Text style={textStyles.body}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={layoutStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        
        <View style={styles.headerButton} />
      </View>

      <View style={layoutStyles.content}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Ionicons 
              name={isAnonymous ? "person-circle-outline" : "person-circle"}
              size={80} 
              color={isAnonymous ? colors.gray400 : colors.primary} 
            />
            {isAnonymous && (
              <View style={styles.anonymousBadge}>
                <Ionicons name="eye-off" size={16} color={colors.white} />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {isAnonymous 
                ? 'Anonymous Player' 
                : (profile?.display_name || user?.user_metadata?.full_name || 'Player')
              }
            </Text>
            
            <Text style={styles.userEmail}>
              {isAnonymous 
                ? 'Playing anonymously' 
                : (user?.email || 'No email')
              }
            </Text>

            {isAnonymous && (
              <Text style={styles.upgradeHint}>
                Sign in to save your progress permanently
              </Text>
            )}
          </View>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Content</Text>
            
            <View style={styles.statsGrid}>

              <TouchableOpacity 
                  style={styles.statCard}
                  onPress={handleViewThemes}
                  disabled={stats.themes_created === 0}
                >
                  <Ionicons name="list-outline" size={24} color={colors.primary} />
                  <Text style={styles.statNumber}>{stats.themes_created}</Text>
                  <Text style={styles.statLabel}>Custom Themes</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.statCard}
                  onPress={handleViewPairs}
                  disabled={stats.pairs_created === 0}
                >
                  <Ionicons name="swap-horizontal-outline" size={24} color={colors.secondary} />
                  <Text style={styles.statNumber}>{stats.pairs_created}</Text>
                  <Text style={styles.statLabel}>Word Pairs</Text>
                </TouchableOpacity>

              <View style={styles.statCard}>
                <Ionicons name="game-controller-outline" size={24} color={colors.success} />
                <Text style={styles.statNumber}>{stats.games_played}</Text>
                <Text style={styles.statLabel}>Games Played</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleViewThemes}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Your Custom Themes</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleViewPairs}>
            <Ionicons name="duplicate-outline" size={20} color={colors.secondary} />
            <Text style={styles.actionButtonText}>Your Custom Pairs</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={20} color={colors.gray600} />
            <Text style={styles.actionButtonText}>Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-outline" size={20} color={colors.gray600} />
            <Text style={styles.actionButtonText}>Privacy & Terms</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call-outline" size={20} color={colors.gray600} />
            <Text style={styles.actionButtonText}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="star-outline" size={20} color={colors.gray600} />
            <Text style={styles.actionButtonText}>Rate Us</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        {!isAnonymous && (
          <Button
            title="Sign Out"
            variant="outline"
            size="lg"
            onPress={handleSignOut}
            style={styles.signOutButton}
          />
        )}

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Among Y'all v1.0.0</Text>
          <Text style={styles.versionText}>User ID: {user?.id?.slice(0, 8)}...</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing['3xl'],
  },
  headerButton: {
    padding: spacing.sm,
    width: 40,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  anonymousBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.warning,
    borderRadius: 12,
    padding: 4,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  upgradeHint: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontStyle: 'italic',
  },
  statsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  actionsSection: {
    marginBottom: spacing.lg,
  },
  accountSection: {
    marginBottom: spacing.lg,
  },
  actionButton: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray900,
    marginLeft: spacing.sm,
  },
  signOutButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  versionText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
});