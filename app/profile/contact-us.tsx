// app/profile/contact-us.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors, layout, spacing, typography } from '../../constants/theme';
import { layoutStyles } from '../../utils/styles';

export default function ContactUsScreen() {
  const handleBack = () => {
    router.back();
  };

  return (
    <ScrollView style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        
        <View style={styles.headerButton} />
      </View>

      <View style={layoutStyles.content}>
        {/* Coming Soon Content */}
        <View style={styles.comingSoonContainer}>
          <Ionicons name="mail-outline" size={64} color={colors.gray400} />
          <Text style={styles.comingSoonTitle}>Contact Us</Text>
          <Text style={styles.comingSoonText}>
            Need help or have feedback? A contact form and support options will be available here soon. We'd love to hear from you!
          </Text>
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  comingSoonTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  comingSoonText: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
  },
});