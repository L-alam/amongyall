import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { Button } from '../../components/Button';
import { colors, layout, spacing, typography } from '../../constants/theme';
import { WordPairs, getRandomPair } from '../../lib/wavelengthService';
import {
    textStyles
} from '../../utils/styles';

interface PlayerScore {
    playerName: string;
    score: number;
    roundPoints: number;
}

interface PlayerHistory {
    playerName: string;
    hasSeenScale: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const SCALE_BOX_CONFIG = {
  phone: {
    width: screenWidth,
    maxWidth: 400,
    leftContainerWidth: '60%',
    scaleWidth: '40%'
  },
  tablet: {
    width: Math.min(screenWidth * 1, 800), // Use 85% of screen width, max 800px
    maxWidth: 800,
    leftContainerWidth: '55%',
    scaleWidth: '45%'
  }
};

const config = isTablet ? SCALE_BOX_CONFIG.tablet : SCALE_BOX_CONFIG.phone;



export default function WavelengthGameStart() {
    const params = useLocalSearchParams();
    const players = JSON.parse(params.players as string || '[]') as string[];
    const firstPlayer = params.firstPlayer as string || '';
    const selectedPair = params.selectedPair ? JSON.parse(params.selectedPair as string) as WordPairs : null;
    const previousScores = JSON.parse(params.playerScores as string || '[]') as PlayerScore[];
    const playerHistory = JSON.parse(params.playerHistory as string || '[]') as PlayerHistory[];
    
    const [currentPair, setCurrentPair] = useState<WordPairs | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<string>(firstPlayer);
    const [showScale, setShowScale] = useState(false);
    const [showAllScores, setShowAllScores] = useState(false);

    // Scale State
    const [goalZoneStart, setGoalZoneStart] = useState(8);
    const [goalZoneEnd, setGoalZoneEnd] = useState(12);

    const scaleColors = [
        '#FFFFFF', '#FCEAEA', '#F8D5D5', '#F5C0C0', '#F1ABAB',
        '#EE9696', '#EA8181', '#E66C6C', '#E25757', '#DE4242',
        '#DA2D2D', '#D61919', '#C91519', '#BD1218', '#B00E18',
        '#A40A17', '#970716', '#8B0316', '#880215', '#8B0000',
        '#8B0000', '#880215', '#8B0316', '#970716', '#A40A17',
        '#B00E18', '#BD1218', '#C91519', '#D61919', '#DA2D2D',
        '#DE4242', '#E25757', '#E66C6C', '#EA8181', '#EE9696',
        '#F1ABAB', '#F5C0C0', '#F8D5D5', '#FCEAEA', '#FFFFFF',
    ];

    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [scaleAreaHeight, setScaleAreaHeight] = useState(0);
    const rowHeight = (scaleAreaHeight) / scaleColors.length;
    
    // Goal zone gradient colors
    const goalZoneColors = [
        '#B3E5FC', // Lightest blue (first/last row of goal zone)
        '#81D4FA', // Light blue (second/fourth row of goal zone)
        '#4DABF7'  // Main blue (middle row of goal zone)
    ];

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
        const { y } = event;
        
        // Safety check to prevent division by zero
        if (scaleAreaHeight === 0 || scaleColors.length === 0) {
            console.log('Bailing - no height or colors');
            return;
        }
        
        // Calculate which row based on y position
        const rowIndex = Math.floor(y / (scaleAreaHeight / scaleColors.length));
        
        // Clamp to valid range
        const clampedIndex = Math.max(0, Math.min(scaleColors.length - 1, rowIndex));
        
        if (clampedIndex !== selectedRowIndex) {
            // Use runOnJS to safely call React state setter
            runOnJS(setSelectedRowIndex)(clampedIndex);
        }
    });

    useEffect(() => {
        setupGame();
    }, []);
    
    const setupGame = async () => {
        try {
            // Use the selected pair if provided, otherwise get a random one
            let pair: WordPairs | null = selectedPair;
            
            if (!pair) {
                // Fallback to random pair if none selected
                pair = await getRandomPair();
            }
            
            if (!pair) {
                console.error('No word pairs available');
                Alert.alert('Error', 'No word pairs available. Please try again later.');
                return;
            }
            
            setCurrentPair(pair);
            
            // Initialize random goal zone
            const zoneWidth = 5;
            const maxStart = scaleColors.length - zoneWidth;
            const start = Math.floor(Math.random() * maxStart);
            setGoalZoneStart(start);
            setGoalZoneEnd(start + zoneWidth - 1);
        } catch (error) {
            console.error('Error setting up wavelength game:', error);
            Alert.alert('Error', 'Failed to load game data. Please try again.');
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleCancel = () => {
        router.push('/');
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

    const startGameplay = () => {
        // Ensure we have the current pair and first player
        if (!currentPair) {
            Alert.alert('Error', 'No word pair loaded. Please try again.');
            return;
        }

        router.push({
            pathname: '/wavelength/wavelength-gameplay',
            params: {
                players: JSON.stringify(players),
                currentPair: JSON.stringify(currentPair),
                goalZoneStart: goalZoneStart.toString(),
                goalZoneEnd: goalZoneEnd.toString(),
                playerScores: JSON.stringify(previousScores),
                firstPlayer: firstPlayer, // Ensure first player is passed
                playerHistory: JSON.stringify(playerHistory), // Pass player history
            }
        });
    };

    const handleRowPress = (rowIndex: number) => {
        setSelectedRowIndex(rowIndex);
    };
     
    const isInGoalZone = (rowIndex: number) => {
        return rowIndex >= goalZoneStart && rowIndex <= goalZoneEnd;
    };

    // Get the goal zone color based on position within the goal zone
    const getGoalZoneColor = (rowIndex: number) => {
        if (!isInGoalZone(rowIndex)) {
            return null; // Not in goal zone
        }

        const positionInGoalZone = rowIndex - goalZoneStart;
        const goalZoneSize = goalZoneEnd - goalZoneStart + 1;
        const middleIndex = Math.floor(goalZoneSize / 2);

        if (positionInGoalZone === middleIndex) {
            // Middle row - darkest blue
            return goalZoneColors[2]; // '#4DABF7'
        } else if (positionInGoalZone === middleIndex - 1 || positionInGoalZone === middleIndex + 1) {
            // Second and fourth rows - medium blue
            return goalZoneColors[1]; // '#81D4FA'
        } else {
            // First and fifth rows - lightest blue
            return goalZoneColors[0]; // '#B3E5FC'
        }
    };

    const getScoreForRow = (rowIndex: number) => {
        if (!isInGoalZone(rowIndex)) return null;
        
        const positionInGoalZone = rowIndex - goalZoneStart;
        const goalZoneSize = goalZoneEnd - goalZoneStart + 1;
        const middleIndex = Math.floor(goalZoneSize / 2);
      
        if (positionInGoalZone === middleIndex) {
          return 3; // Middle row - 3 points
        } else if (positionInGoalZone === middleIndex - 1 || positionInGoalZone === middleIndex + 1) {
          return 2; // Second and fourth rows - 2 points
        } else {
          return 1; // First and fifth rows - 1 point
        }
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
                                     
                    <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
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

                    {/* Show previous scores if this isn't the first round */}
                    {previousScores.length > 0 && (
                        <View style={styles.scoresContainer}>
                            <Text style={styles.scoresTitle}>Current Scores:</Text>
                            <View style={styles.scoresList}>
                                {previousScores
                                    .sort((a, b) => b.score - a.score)
                                    .slice(0, showAllScores ? previousScores.length : 3)
                                    .map((playerScore, index) => (
                                        <View key={playerScore.playerName} style={styles.scoreItem}>
                                            <Text style={[
                                                styles.scorePlayerName,
                                                index === 0 && styles.leadingPlayer
                                            ]}>
                                                {playerScore.playerName}
                                            </Text>
                                            <Text style={[
                                                styles.scoreValue,
                                                index === 0 && styles.leadingPlayer
                                            ]}>
                                                {playerScore.score}
                                            </Text>
                                        </View>
                                    ))}
                            </View>
                            
                            {/* Show expand/collapse button only if there are more than 3 players */}
                            {previousScores.length > 3 && (
                                <TouchableOpacity 
                                    style={styles.expandButton}
                                    onPress={() => setShowAllScores(!showAllScores)}
                                >
                                    <Text style={styles.expandButtonText}>
                                        {showAllScores 
                                            ? `Show Less` 
                                            : `Show ${previousScores.length - 3} More`
                                        }
                                    </Text>
                                    <Ionicons 
                                        name={showAllScores ? "chevron-up" : "chevron-down"} 
                                        size={16} 
                                        color={colors.primary} 
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

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
                <View style={styles.headerSpacer} />

                {/* Center - the term */}
                <Text style={styles.topTerm}>{currentPair?.positive}</Text>

                {/* Right - close button */}
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <Ionicons name="close" size={layout.iconSize.sm} color={colors.white} />
                </TouchableOpacity>
            </View>

            {/* Main content area */}
            <View style={styles.content}>

                {/* White scale box in the center */}
                <View style={styles.scaleBox}>
                    <View style={styles.horizontalContainer}>
                        
                        {/* Left side of Scale */}
                        <View style={styles.debugContainer}>
                            <Text style={styles.instructionText}>
                                Come up with a one word clue to guide the group to the blue area of the scale
                            </Text>

                            <Button
                                title="START"
                                variant="primary"
                                size="md"
                                onPress={startGameplay}
                                style={styles.startButton}
                            />
                        </View>
                        
                        {/* Combined Scale Rows */}
                        <View style={styles.scaleContainer}>
                            {scaleColors.map((color, index) => {
                                const goalZoneColor = getGoalZoneColor(index);
                                return (
                                    <View key={index} style={styles.scaleRowContainer}>
                                        {/* Left side of scale */}
                                        <View
                                            style={[
                                                styles.scaleRowLeft,
                                                { 
                                                backgroundColor: goalZoneColor || colors.scale200,
                                                borderColor: selectedRowIndex === index ? colors.gray100 : (isInGoalZone(index) ? 'transparent' : colors.gray400),
                                                }
                                            ]}
                                        />
                                        {/* Right side of scale */}
                                        <View
                                            style={[
                                                styles.scaleRowRight,
                                                { 
                                                backgroundColor: goalZoneColor || colors.white,
                                                }
                                            ]}
                                        >
                                            {isInGoalZone(index) && (
                                                <View style={styles.scoreContainer}>
                                                    <Ionicons 
                                                        name="arrow-back" 
                                                        size={12} 
                                                        color={colors.white} 
                                                    />
                                                    <Text style={styles.scoreText}>
                                                        {getScoreForRow(index)} pts
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                    </View>
                </View>

            </View>

            <View style={styles.header}>
                <Text style={styles.bottomTerm}>{currentPair?.negative}</Text>
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

    // Score display styles
    scoresContainer: {
        width: '80%',
        backgroundColor: colors.gray100,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        alignItems: 'center',
    },

    scoresTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.primary,
        marginBottom: spacing.md,
    },

    scoresList: {
        width: '100%',
        gap: spacing.sm,
    },

    scoreItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.white,
        borderRadius: 6,
    },

    scorePlayerName: {
        fontSize: typography.fontSize.base,
        color: colors.gray700,
    },

    scoreValue: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.gray700,
    },

    leadingPlayer: {
        color: colors.success,
        fontWeight: typography.fontWeight.bold,
    },

    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginTop: spacing.sm,
        backgroundColor: colors.gray50,
        borderRadius: 6,
        gap: spacing.xs,
    },

    expandButtonText: {
        fontSize: typography.fontSize.sm,
        color: colors.primary,
        fontWeight: typography.fontWeight.medium,
    },
    
    revealButton: {
        height: '40%',
        width: '80%',
    },
    
    // Scale Screen Styles (Black Background)
    container: {
        flex: 1,
        backgroundColor: colors.black, 
    },
    
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 0,
    },
    
    scaleBox: {
        backgroundColor: colors.white,
        padding: 0,
        width: config.width,
        maxWidth: config.maxWidth,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 10,
    },

    debugContainer: {
        width: config.leftContainerWidth,
        justifyContent: 'center',
        paddingHorizontal: isTablet ? spacing.xl : spacing.md, // More padding on tablets
    },

    scaleContainer: {
        width: config.scaleWidth, // Make scale wider on tablets
        flex: 1,
    },

    // Add tablet-specific text sizing
    instructionText: {
        fontSize: isTablet ? typography.fontSize.base : typography.fontSize.sm,
        color: colors.gray600,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: (isTablet ? typography.fontSize.base : typography.fontSize.sm) * 1.4,
    },
    
    topLabel: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.black,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    
    placeholderText: {
        fontSize: typography.fontSize.base,
        color: colors.gray500,
        fontStyle: 'italic',
    },

    instructionText: {
        fontSize: typography.fontSize.sm,
        color: colors.gray600,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: typography.fontSize.sm * 1.4,
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

    scaleArea: {
        flex: 1,
        width: '100%',
        borderRadius: 8,
    },
      
    scaleRow: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
      
    rowText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.black,
        textAlign: 'center',
    },

    horizontalContainer: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
    },
    
    debugContainer: {
        width: '60%',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
    },
    
    scaleContainer: {
        flex: 1,
        width: '100%',
    },

    scaleRowContainer: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
    },

    scaleRowLeft: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
    },

    scaleRowRight: {
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    
    scoreText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.white,
    },

    startButton: {
        width: '100%',
    },
});