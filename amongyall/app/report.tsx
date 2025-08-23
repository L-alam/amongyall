import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking, ScrollView } from 'react-native';
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

  // Current work status and known issues
  const currentNotes = [
    "Settings - Not yet functional",
    "Explanation Button on how to play the games",
    "Push notifications",
    "Dark mode toggle",
    "Game History/Stats (Maybe idk)"
  ];

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
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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


        {/* Developer Notes Section */}
        <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.notesTitle}>Developer Notes</Text>
            </View>
            
            <Text style={styles.notesSubtitle}>Working on:</Text>
            <View style={styles.notesList}>
              {currentNotes.map((note, index) => (
                <View key={index} style={styles.noteItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}
            </View>
        </View>


        </View>
      </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
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
  notesContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
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
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  notesTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray800,
    marginLeft: spacing.sm,
  },
  notesSubtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  notesList: {
    marginBottom: spacing.sm,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  bulletPoint: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: 20,
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