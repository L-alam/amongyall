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
import { useProStatus } from '../../hooks/useProStatus';
import { supabase } from '../../lib/supabase';
import { UserProfile, UserStats, userProfileService } from '../../lib/userProfileService';
import { layoutStyles, textStyles } from '../../utils/styles';

export default function ProfileScreen() {
  const { user, isAnonymous, signOut, signInWithGoogle } = useAuth();
  const { isPro } = useProStatus();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  const loadProfileData = async () => {
    try {
      if (!isAnonymous) {
        const [profileData, statsData] = await Promise.all([
          userProfileService.getCurrentUserProfile(),
          userProfileService.getUserStats(),
        ]);
        
        setProfile(profileData);
        setStats(statsData);
      } else {
        // For anonymous users, still load stats but no profile
        const statsData = await userProfileService.getUserStats();
        setStats(statsData);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [isAnonymous]);

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

  const handleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        Alert.alert('Sign In Failed', 'Could not sign in with Google. Please try again.');
      }
    } catch (error) {
      Alert.alert('Sign In Failed', 'Could not sign in with Google. Please try again.');
    }
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

  const handleSettings = () => {
    router.push('/profile/settings');
  };

  const handlePrivacyTerms = () => {
    router.push('/profile/privacy-terms');
  };

  const handleContactUs = () => {
    router.push('/profile/contact-us');
  };

  const handleRateUs = () => {
    router.push('/profile/rate-us');
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your Pro subscription? You will continue to have access to Pro features until the end of your current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: confirmCancelSubscription,
        },
      ]
    );
  };

  const confirmCancelSubscription = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to cancel your subscription');
      return;
    }

    setCancellingSubscription(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          userId: user.id,
        },
      });

      if (error) {
        console.error('Error cancelling subscription:', error);
        Alert.alert(
          'Cancellation Failed',
          'We could not cancel your subscription at this time. Please try again or contact support.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (data.success) {
        Alert.alert(
          'Subscription Cancelled',
          'Your subscription has been cancelled. You will continue to have Pro access until the end of your current billing period.',
          [{ text: 'OK' }]
        );
        // Refresh profile data to show updated status
        await loadProfileData();
      } else {
        Alert.alert(
          'Cancellation Failed',
          data.error || 'We could not cancel your subscription at this time. Please try again or contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      Alert.alert(
        'Cancellation Failed',
        'We could not cancel your subscription at this time. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setCancellingSubscription(false);
    }
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
        {/* User Info Card - Only show for authenticated users */}
        {!isAnonymous && (
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <Ionicons 
                name="person-circle"
                size={80} 
                color={colors.primary} 
              />
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {profile?.display_name || user?.user_metadata?.full_name || 'Player'}
              </Text>
              
              <Text style={styles.userEmail}>
                {user?.email || 'No email'}
              </Text>

              {/* Pro Status Badge */}
              {isPro && (
                <View style={styles.proBadge}>
                  <Ionicons name="diamond" size={16} color={colors.white} />
                  <Text style={styles.proText}>Pro Member</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Stats Cards - Show for all users but with different data */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Content</Text>
            
            <View style={styles.statsGrid}>
              <TouchableOpacity 
                style={styles.statCard}
                onPress={handleViewThemes}
              >
                <Ionicons name="list-outline" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>{stats.themes_created}</Text>
                <Text style={styles.statLabel}>Custom Themes</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={handleViewPairs}
              >
                <Ionicons name="swap-horizontal-outline" size={24} color={colors.secondary} />
                <Text style={styles.statNumber}>{stats.pairs_created}</Text>
                <Text style={styles.statLabel}>Word Pairs</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Account Actions - Show for all users */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={20} color={colors.gray600} />
            <Text style={styles.actionButtonText}>Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handlePrivacyTerms}>
            <Ionicons name="help-outline" size={20} color={colors.gray600} />
            <Text style={styles.actionButtonText}>Privacy & Terms</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleContactUs}>
            <Ionicons name="call-outline" size={20} color={colors.gray600} />
            <Text style={styles.actionButtonText}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleRateUs}>
            <Ionicons name="star-outline" size={20} color={colors.gray600} />
            <Text style={styles.actionButtonText}>Rate Us</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
          </TouchableOpacity>

          {/* Cancel Subscription Button - Only for signed-in Pro users */}
          {!isAnonymous && isPro && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={handleCancelSubscription}
              disabled={cancellingSubscription}
            >
              <Ionicons 
                name="close-circle-outline" 
                size={20} 
                color={colors.red || '#EF4444'} 
              />
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                {cancellingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Authentication Button */}
        {isAnonymous ? (
          <View style={styles.signInSection}>
            <Text style={styles.signInHint}>
              Sign in to save your progress permanently and sync across devices
            </Text>
            <Button
              title="Sign In with Google"
              variant="primary"
              size="lg"
              onPress={handleSignIn}
              style={styles.authButton}
            />
          </View>
        ) : (
          <Button
            title="Sign Out"
            variant="outline"
            size="lg"
            onPress={handleSignOut}
            style={styles.authButton}
          />
        )}

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Among Y'all v1.0.0</Text>
          <Text style={styles.versionText}>User ID: {user?.id?.slice(0, 8)}...</Text>
          {isAnonymous && (
            <Text style={styles.versionText}>Anonymous Session</Text>
          )}
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
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning || '#F59E0B',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginTop: spacing.xs,
  },
  proText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
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
  cancelButton: {
    borderColor: colors.red || '#EF4444',
    borderWidth: 1,
  },
  cancelButtonText: {
    color: colors.red || '#EF4444',
  },
  signInSection: {
    marginBottom: spacing.lg,
  },
  signInHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  authButton: {
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