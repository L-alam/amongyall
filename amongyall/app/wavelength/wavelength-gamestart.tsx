import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { getRandomPair, WordPairs } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WavelengthGameStart() {
    const params = useLocalSearchParams();
    const players = JSON.parse(params.players as string || '[]') as string[];
    
    const [currentPair, setCurrentPair] = useState<WordPairs | null>(null);

    useEffect(() => {
        // Get a random word pair for this round
        const pair = getRandomPair();
        setCurrentPair(pair);
    }, []);

    const handleBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            {/* Header - visible on black background */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.white} />
                </TouchableOpacity>
                
                <Text style={[textStyles.h2, { color: colors.white }]}>Wavelength</Text>
                
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <Ionicons name="close" size={layout.iconSize.md} color={colors.white} />
                </TouchableOpacity>
            </View>

            {/* Main content area */}
            <View style={styles.content}>
                {/* White scale box in the center */}
                <View style={styles.scaleBox}>
                    {/* Top label */}
                    {currentPair && (
                        <Text style={styles.topLabel}>{currentPair.positive}</Text>
                    )}
                    
                    {/* Scale area - this is where the wavelength scale will go */}
                    <View style={styles.scaleArea}>
                        <Text style={styles.placeholderText}>
                            Scale will go here
                        </Text>
                    </View>
                    
                    {/* Bottom label */}
                    {currentPair && (
                        <Text style={styles.bottomLabel}>{currentPair.negative}</Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.black, // Black background for the entire screen
    },
    
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
    
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    
    scaleBox: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: spacing.xl,
        width: screenWidth - (spacing.lg * 2), // Full width minus padding
        maxWidth: 400, // Maximum width for larger screens
        minHeight: 300,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    
    topLabel: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.black,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    
    scaleArea: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.gray100,
        borderRadius: 8,
        marginVertical: spacing.md,
    },
    
    placeholderText: {
        fontSize: typography.fontSize.base,
        color: colors.gray500,
        fontStyle: 'italic',
    },
    
    bottomLabel: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.black,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
});