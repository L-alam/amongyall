import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { runOnJS } from 'react-native-reanimated';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { WordPairs } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PlayerVote {
    playerName: string;
    selectedRow: number | null;
    hasVoted: boolean;
}

// Player colors for up to 8 players
const PLAYER_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#82E0AA', // Green
];

export default function WavelengthGameplay() {
    const params = useLocalSearchParams();
    const players = JSON.parse(params.players as string || '[]') as string[];
    const currentPair = JSON.parse(params.currentPair as string || '{}') as WordPairs;
    const goalZoneStart = parseInt(params.goalZoneStart as string) || 8;
    const goalZoneEnd = parseInt(params.goalZoneEnd as string) || 12;
    
    const [selectedPlayer, setSelectedPlayer] = useState<string>(players[0] || '');
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [scaleAreaHeight, setScaleAreaHeight] = useState(0);
    const [playerVotes, setPlayerVotes] = useState<PlayerVote[]>([]);

    // Use the same scale colors as the original gamestart file
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

    // Initialize player votes
    useEffect(() => {
        const initialVotes: PlayerVote[] = players.map(player => ({
            playerName: player,
            selectedRow: null,
            hasVoted: false
        }));
        setPlayerVotes(initialVotes);
    }, [players]);

    // Pan gesture - using JS thread to prevent crashes
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            const { y } = event;
            
            // Safety check to prevent division by zero
            if (scaleAreaHeight === 0 || scaleColors.length === 0) {
                return;
            }
            
            // Calculate which row based on y position
            const rowIndex = Math.floor(y / (scaleAreaHeight / scaleColors.length));
            
            // Clamp to valid range
            const clampedIndex = Math.max(0, Math.min(scaleColors.length - 1, rowIndex));
            
            if (clampedIndex !== selectedRowIndex) {
                // Use runOnJS to safely call React state setter on JS thread
                runOnJS(setSelectedRowIndex)(clampedIndex);
                runOnJS(updatePlayerVote)(selectedPlayer, clampedIndex);
            }
        });

    const handleBack = () => {
        router.back();
    };

    const handlePlayerSelect = (playerName: string) => {
        setSelectedPlayer(playerName);
        // Load this player's current vote if they have one
        const playerVote = playerVotes.find(vote => vote.playerName === playerName);
        setSelectedRowIndex(playerVote?.selectedRow || null);
    };

    const handleRowPress = (rowIndex: number) => {
        setSelectedRowIndex(rowIndex);
        updatePlayerVote(selectedPlayer, rowIndex);
    };

    const updatePlayerVote = (playerName: string, rowIndex: number) => {
        setPlayerVotes(prev => 
            prev.map(vote => 
                vote.playerName === playerName 
                    ? { ...vote, selectedRow: rowIndex, hasVoted: true }
                    : vote
            )
        );
    };

    const handleRevealScores = () => {
        const allVoted = playerVotes.every(vote => vote.hasVoted);
        
        if (!allVoted) {
            const unvotedPlayers = playerVotes
                .filter(vote => !vote.hasVoted)
                .map(vote => vote.playerName)
                .join(', ');
                
            Alert.alert(
                'Not Everyone Has Voted',
                `The following players haven't voted yet: ${unvotedPlayers}`,
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Reveal Scores',
            'Has everyone voted?',
            [
                {
                    text: 'No',
                    style: 'cancel',
                },
                {
                    text: 'Yes, Reveal Scores',
                    onPress: () => navigateToResults(),
                },
            ]
        );
    };

    const navigateToResults = () => {
        router.push({
            pathname: '/wavelength/wavelength-results',
            params: {
                players: JSON.stringify(players),
                currentPair: JSON.stringify(currentPair),
                goalZoneStart: goalZoneStart.toString(),
                goalZoneEnd: goalZoneEnd.toString(),
                playerVotes: JSON.stringify(playerVotes),
            }
        });
    };

    const getPlayerColor = (playerName: string): string => {
        const playerIndex = players.indexOf(playerName);
        return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
    };

    const getPlayersOnRow = (rowIndex: number): string[] => {
        return playerVotes
            .filter(vote => vote.selectedRow === rowIndex && vote.hasVoted)
            .map(vote => vote.playerName);
    };

    const hasPlayerVoted = (playerName: string): boolean => {
        const vote = playerVotes.find(vote => vote.playerName === playerName);
        return vote?.hasVoted || false;
    };

    const isInGoalZone = (rowIndex: number) => {
        return rowIndex >= goalZoneStart && rowIndex <= goalZoneEnd;
    };

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
                        
                        {/* Left side - Player Selection */}
                        <View style={styles.leftContainer}>
                            {/* Current player indicator */}
                            <Text style={styles.currentPlayerText}>
                                {selectedPlayer}'s turn
                            </Text>

                            {/* Player list */}
                            <View style={styles.playerList}>
                                {players.map((player) => {
                                    const playerColor = getPlayerColor(player);
                                    return (
                                        <TouchableOpacity
                                            key={player}
                                            style={[
                                                styles.playerButton,
                                                selectedPlayer === player && styles.playerButtonSelected,
                                                hasPlayerVoted(player) && styles.playerButtonVoted,
                                                selectedPlayer === player && { borderColor: playerColor }
                                            ]}
                                            onPress={() => handlePlayerSelect(player)}
                                        >
                                            <View style={[
                                                styles.playerColorIndicator,
                                                { backgroundColor: playerColor }
                                            ]} />
                                            <Text style={[
                                                styles.playerButtonText,
                                                selectedPlayer === player && [styles.playerButtonTextSelected, { color: playerColor }],
                                                hasPlayerVoted(player) && styles.playerButtonTextVoted
                                            ]}>
                                                {player}
                                            </Text>
                                            {hasPlayerVoted(player) && (
                                                <Ionicons 
                                                    name="checkmark-circle" 
                                                    size={14} 
                                                    color={colors.success} 
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Reveal Scores Button */}
                            <Button
                                title="REVEAL SCORES"
                                variant="secondary"
                                size="sm"
                                icon="eye-outline"
                                onPress={handleRevealScores}
                                style={styles.revealButton}
                            />
                        </View>
                        
                        {/* Scale - Interactive, same styling as gamestart */}
                        <GestureDetector gesture={panGesture}>
                            <Animated.View 
                                style={styles.scaleContainer}
                                onLayout={(event) => {
                                    const { height } = event.nativeEvent.layout;
                                    setScaleAreaHeight(height);
                                }}
                            >
                                {scaleColors.map((color, index) => {
                                    const playersOnThisRow = getPlayersOnRow(index);
                                    
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.scaleRowContainer}
                                            onPress={() => handleRowPress(index)}
                                            activeOpacity={0.7}
                                        >
                                            {/* Left side of scale */}
                                            <View
                                                style={[
                                                    styles.scaleRowLeft,
                                                    { 
                                                        backgroundColor: colors.gray200, // No goal zone visible during gameplay
                                                        borderColor: selectedRowIndex === index ? getPlayerColor(selectedPlayer) : colors.gray400,
                                                        borderWidth: selectedRowIndex === index ? 2 : 1,
                                                    }
                                                ]}
                                            >
                                                {/* Player vote circles directly on the scale */}
                                                <View style={styles.scaleVoteIndicators}>
                                                    {playersOnThisRow.map((playerName, playerIndex) => (
                                                        <View
                                                            key={`${playerName}-${playerIndex}`}
                                                            style={[
                                                                styles.scaleVoteCircle,
                                                                { backgroundColor: getPlayerColor(playerName) }
                                                            ]}
                                                        >
                                                            <Text style={styles.scaleVoteCircleText}>
                                                                {playerName.charAt(0)}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                            {/* Right side of scale */}
                                            <View
                                                style={[
                                                    styles.scaleRowRight,
                                                    { 
                                                        backgroundColor: selectedRowIndex === index ? getPlayerColor(selectedPlayer) + '20' : colors.white,
                                                    }
                                                ]}
                                            >
                                                {/* Current selection indicator */}
                                                {selectedRowIndex === index && (
                                                    <View style={styles.selectedIndicator}>
                                                        <Ionicons 
                                                            name="arrow-back" 
                                                            size={12} 
                                                            color={getPlayerColor(selectedPlayer)} 
                                                        />
                                                        <Text style={[
                                                            styles.selectedText,
                                                            { color: getPlayerColor(selectedPlayer) }
                                                        ]}>
                                                            {selectedPlayer}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </Animated.View>
                        </GestureDetector>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.bottomTerm}>{currentPair?.negative}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Scale Screen Styles (Black Background) - Same as gamestart
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
        width: screenWidth,
        maxWidth: 400, 
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 10,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing['3xl'],
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    
    footer: {
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

    horizontalContainer: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
    },
    
    // Left container - Player selection (same width as gamestart's debugContainer)
    leftContainer: {
        width: '60%',
        justifyContent: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    
    currentPlayerText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: colors.secondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    
    playerList: {
        flex: 1,
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    
    playerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: 8,
        backgroundColor: colors.gray100,
        gap: spacing.xs,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    
    playerColorIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: spacing.xs,
    },
    
    playerButtonSelected: {
        backgroundColor: colors.gray200,
        borderWidth: 2,
        // borderColor will be set dynamically to player color
    },
    
    playerButtonVoted: {
        backgroundColor: colors.success + '10',
    },
    
    playerButtonText: {
        fontSize: typography.fontSize.sm,
        color: colors.gray600,
        flex: 1,
    },
    
    playerButtonTextSelected: {
        fontWeight: typography.fontWeight.semibold,
        // color will be set dynamically to player color
    },
    
    playerButtonTextVoted: {
        color: colors.success,
        fontWeight: typography.fontWeight.medium,
    },
    
    revealButton: {
        width: '100%',
    },
    
    // Scale styling - same as gamestart
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
        flexDirection: 'row',
        paddingHorizontal: 4,
    },

    // Vote circles on the actual scale
    scaleVoteIndicators: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 3,
    },

    scaleVoteCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.white,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },

    scaleVoteCircleText: {
        fontSize: 10,
        fontWeight: typography.fontWeight.bold,
        color: colors.white,
        textAlign: 'center',
    },

    scaleRowRight: {
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    selectedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    
    selectedText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        // color will be set dynamically to player color
    },
});