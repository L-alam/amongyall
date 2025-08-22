import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, layout, typography } from '../constants/theme';



const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSe-tRu1HtSY-JYlWhLEUKZhMMdBIaKh7D6h1QcRne7G538NUQ/viewform?usp=dialog';

export default function ReportScreen() {
  const router = useRouter();

  const handleOpenForm = async () => {
    try {
      const supported = await Linking.canOpenURL(GOOGLE_FORM_URL);
      if (supported) {
        await Linking.openURL(GOOGLE_FORM_URL);
      } else {
        // Fallback - this shouldn't happen with web URLs
        console.log("Can't open URL:", GOOGLE_FORM_URL);
      }
    } catch (error) {
      console.error('Error opening form:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Issue Reporting</Text>
          
          <Text style={styles.message}>
            Thanks for testing the Amongyall App. Please use this form to report any issues. Please also submit any suggestions you have. It would be greatly appreciated.
          </Text>
          
          <Text style={styles.signature}>
            THANK YOU - Labeeber
          </Text>
        </View>

        {/* Form Button */}
        <TouchableOpacity 
          style={styles.formButton}
          onPress={handleOpenForm}
        >
          <Ionicons name="open-outline" size={20} color={colors.white} />
          <Text style={styles.formButtonText}>Open Report Form</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  messageContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray800,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  signature: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray800,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  formButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
});