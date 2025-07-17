import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Pressable, SafeAreaView, Alert, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  createButtonStyle, 
  createButtonTextStyle,
  createInputStyle,
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { themes, getRandomWordsFromTheme, getAllThemeNames } from '../../constants/theme';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');


export default function WordGameStart() {

    const handleBack = () => {
        router.back();
    };
    
    return (
        <View style={layoutStyles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
                </TouchableOpacity>
                
                <Text style={textStyles.h2}>Word Chameleon</Text>
                
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing['3xl'],
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    
    headerButton: {
      padding: spacing.sm,
    },

    playerInstruction: {
        textAlign: 'center',
        marginBottom: spacing.sm,
        color: colors.gray600,
    },

    playerName: {
        textAlign: 'center',
        marginBottom: spacing.md,
        color: colors.primary,
        fontWeight: typography.fontWeight.bold,
    },

    progressText: {
        textAlign: 'center',
        marginBottom: spacing.xl,
        color: colors.gray500,
    },

    // Flip card container
    flipCard: {
        width: screenWidth - spacing.lg * 2,
        height: 300,
        marginBottom: spacing.xl,
    },

    pressableContainer: {
        // Ensure the pressable area covers the entire card
    },

    regularCard: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 1,
        backfaceVisibility: 'hidden',
    },

    flippedCard: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 2,
        backfaceVisibility: 'hidden',
    },

    // Card front styling
    cardFront: {
        flex: 1,
        backgroundColor: colors.gray100,
        borderWidth: 2,
        borderColor: colors.gray300,
        borderStyle: 'dashed',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },

    cardIcon: {
        marginBottom: spacing.md,
    },

    cardFrontText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.medium,
        color: colors.gray600,
        textAlign: 'center',
        lineHeight: typography.fontSize.lg * 1.4,
    },

    // Card back styling
    cardBack: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },

    wordLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.gray300,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },

    wordText: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },

    wordInstruction: {
        fontSize: typography.fontSize.sm,
        color: colors.gray300,
        textAlign: 'center',
        lineHeight: typography.fontSize.sm * 1.4,
    },

    spyText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.medium,
        color: colors.error,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },

    spyTitle: {
        fontSize: typography.fontSize['4xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.error,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },

    spyInstruction: {
        fontSize: typography.fontSize.sm,
        color: colors.gray300,
        textAlign: 'center',
        lineHeight: typography.fontSize.sm * 1.4,
    },

    nextButton: {
        width: '100%',
    },

    readyTitle: {
        textAlign: 'center',
        marginBottom: spacing.md,
        color: colors.primary,
    },

    readySubtitle: {
        textAlign: 'center',
        marginBottom: spacing.xl,
        color: colors.gray600,
    },

    playerSummary: {
        width: '100%',
        backgroundColor: colors.gray100,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.xl,
    },

    playerSummaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
    },

    startButton: {
        width: '100%',
    },
});