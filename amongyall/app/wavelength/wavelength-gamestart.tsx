import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, Alert } from 'react-native';
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
    const [selectedPlayer, setSelectedPlayer] = useState<string>('');
    const [showScale, setShowScale] = useState(false);

    useEffect(() => {
        // Get a random word pair for this round
        const pair = getRandomPair();
        setCurrentPair(pair);
        
        // Select a random player
        if (players.length > 0) {
            const randomPlayer = players[Math.floor(Math.random() * players.length)];
            setSelectedPlayer(randomPlayer);
        }
    }, []);

    const handleBack = () => {
        router.back();
    };

    const confirmPlayer = () => {
        Alert.alert(
            'Confirm Player',
            `Are you really ${selectedPlayer}?`,
            [
                {
                    text: 'No',
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    onPress: () => revealScale(),
                },
            ]
        );
    };

    const revealScale = () => {
        setShowScale(true);
    };

    // Player Selection Screen (White Background)
    if (!showScale) {
        return (
            <View style={styles.playerSelectionContainer}>
                {/* Header */}
                <View style={styles.playerSelectionHeader}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
                    </TouchableOpacity>
                    
                    <Text style={textStyles.h2}>Wavelength</Text>
                    
                    <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                        <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Main content */}
                <View style={styles.playerSelectionContent}>
                    <Text style={[textStyles.h1, styles.givePhoneText]}>
                        Give the phone to:
                    </Text>
                    
                    <Text style={[textStyles.h1, styles.playerNameText]}>
                        {selectedPlayer}
                    </Text>

                    <Button
                        title="REVEAL SCALE"
                        variant="primary"
                        size="lg"
                        icon="eye-outline"
                        onPress={confirmPlayer}
                        style={styles.revealButton}
                    />
                </View>
            </View>
        );
    }

    // Scale Screen (Black Background)
    return (
        <View style={styles.container}>
            {/* Header - visible on black background */}
            <View style={styles.header}>
                {/* Left spacer - empty but takes up space */}
                <View style={styles.headerSpacer} />
                
                {/* Center - the term */}
                <Text style={styles.topTerm}>{currentPair.positive}</Text>
                
                {/* Right - close button */}
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <Ionicons name="close" size={layout.iconSize.sm} color={colors.white} />
                </TouchableOpacity>
            </View>

            {/* Main content area */}
            <View style={styles.content}>
                {/* White scale box in the center */}
                <View style={styles.scaleBox}>
                    
                    {/* Scale area - this is where the wavelength scale will go */}
                    <View style={styles.scaleArea}>
                        <Text style={styles.placeholderText}>
                            Scale will go here
                        </Text>
                    </View>
                    
                </View>
            </View>

            <View style={styles.header}>
                <Text style={styles.bottomTerm}>{currentPair.negative}</Text>
            </View>



        </View>
    );
}

const styles = StyleSheet.create({
    // Player Selection Screen Styles (White Background)
    playerSelectionContainer: {
        flex: 1,
        backgroundColor: colors.white, // White background for player selection
    },
    
    playerSelectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing['3xl'],
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    
    playerSelectionContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    
    givePhoneText: {
        textAlign: 'center',
        marginBottom: spacing.sm,
        color: colors.gray600,
    },
    
    playerNameText: {
        textAlign: 'center',
        marginBottom: spacing.xl,
        color: colors.primary,
        fontWeight: typography.fontWeight.bold,
    },
    
    revealButton: {
        height: '60%',
        width: '100%',
        maxHeight: 400,
        maxWidth: 300,
    },
    
    // Scale Screen Styles (Black Background)
    container: {
        flex: 1,
        backgroundColor: colors.black, // Black background for the scale screen
    },
    
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    
    scaleBox: {
        backgroundColor: colors.white,
        padding: spacing.xl,
        width: screenWidth, // Full width minus padding
        maxWidth: 400, // Maximum width for larger screens
        minHeight: 300,
        height: '100%',
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

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing['3xl'],
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    
    headerSpacer: {
        width: layout.iconSize.sm + spacing.sm * 2,
    },
    
    topTerm: {
        color: "white",
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
        textAlign: 'center',
        flex: 1,
        marginTop: spacing.xl,
    },

    bottomTerm: {
        color: "white",
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
        textAlign: 'center',
        flex: 1,
        marginBottom: spacing.xl,
    },
    
    headerButton: {
        padding: spacing.sm,
    },
});
