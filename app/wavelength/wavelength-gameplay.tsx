import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';

import { Button } from '../../components/Button';
import { colors, layout, spacing, typography } from '../../constants/theme';
import { WordPairs } from '../../lib/wavelengthService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PlayerVote {
    playerName: string;
    selectedRow: number | null;
    hasVoted: boolean;
}

interface PlayerScore {
    playerName: string;
    score: number;
    roundPoints: number;
}

interface PlayerHistory {
    playerName: string;
    hasSeenScale: boolean;
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
    const previousScores = JSON.parse(params.playerScores as string || '[]') as PlayerScore[];
    const playerHistory = JSON.parse(params.playerHistory as string || '[]') as PlayerHistory[];
    const scalePlayer = params.firstPlayer as string || '';
    
    // Filter out the scale player from voting
    const votingPlayers = players.filter(player => player !== scalePlayer);
    
    const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
    const [scaleAreaHeight, setScaleAreaHeight] = useState(0);
    const [playerVotes, setPlayerVotes] = useState<PlayerVote[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<string>(votingPlayers[0] || '');

    const scaleSize = 40;

    // Initialize player votes for voting players only
    useEffect(() => {
        const initialVotes: PlayerVote[] = votingPlayers.map(player => ({
            playerName: player,
            selectedRow: null,
            hasVoted: false
        }));
        setPlayerVotes(initialVotes);
    }, [votingPlayers.length]);

    // Memoized functions to prevent re-renders
    const updatePlayerVote = useCallback((playerName: string, rowIndex: number) => {
        setPlayerVotes(prev => 
            prev.map(vote => 
                vote.playerName === playerName 
                    ? { ...vote, selectedRow: rowIndex, hasVoted: true }
                    : vote
            )
        );
    }, []);

    // Memoized pan gesture to prevent recreation on every render
    const panGesture = useMemo(() => 
        Gesture.Pan()
            .onUpdate((event) => {
                const { y } = event;
                
                // Safety check to prevent division by zero
                if (scaleAreaHeight === 0) {
                    return;
                }
                
                // Calculate which row based on y position
                const rowIndex = Math.floor(y / (scaleAreaHeight / scaleSize));
                
                // Clamp to valid range
                const clampedIndex = Math.max(0, Math.min(scaleSize - 1, rowIndex));
                
                if (clampedIndex !== selectedRowIndex) {
                    // Use runOnJS to safely call React state setter on JS thread
                    runOnJS(setSelectedRowIndex)(clampedIndex);
                    runOnJS(updatePlayerVote)(selectedPlayer, clampedIndex);
                }
            })
    , [scaleAreaHeight, scaleSize, selectedRowIndex, selectedPlayer, updatePlayerVote]);

    const handlePlayerSelect = useCallback((playerName: string) => {
        setSelectedPlayer(playerName);
        // Load this player's current vote if they have one
        const playerVote = playerVotes.find(vote => vote.playerName === playerName);
        setSelectedRowIndex(playerVote?.selectedRow || null);
    }, [playerVotes]);

    const handleRowPress = useCallback((rowIndex: number) => {
        setSelectedRowIndex(rowIndex);
        updatePlayerVote(selectedPlayer, rowIndex);
    }, [selectedPlayer, updatePlayerVote]);

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
                previousScores: JSON.stringify(previousScores),
                playerHistory: JSON.stringify(playerHistory),
                firstPlayer: scalePlayer, // Pass the scale player
            }
        });
    };

    const getPlayerColor = useCallback((playerName: string): string => {
        const playerIndex = players.indexOf(playerName);
        return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
    }, [players]);

    const getPlayersOnRow = useCallback((rowIndex: number): string[] => {
        return playerVotes
            .filter(vote => vote.selectedRow === rowIndex && vote.hasVoted)
            .map(vote => vote.playerName);
    }, [playerVotes]);

    const hasPlayerVoted = useCallback((playerName: string): boolean => {
        const vote = playerVotes.find(vote => vote.playerName === playerName);
        return vote?.hasVoted || false;
    }, [playerVotes]);

    const isInGoalZone = (rowIndex: number) => {
        return rowIndex >= goalZoneStart && rowIndex <= goalZoneEnd;
    };

    // Enhanced function to render overlapping player circles
    const renderPlayerCircles = useCallback((playersOnThisRow: string[]) => {
        if (playersOnThisRow.length === 0) return null;

        // If only 1 player, show normally without overlap
        if (playersOnThisRow.length === 1) {
            return (
                <View style={styles.scaleVoteIndicators}>
                    <View
                        style={[
                            styles.scaleVoteCircle,
                            { backgroundColor: getPlayerColor(playersOnThisRow[0]) }
                        ]}
                    >
                        <Text style={styles.scaleVoteCircleText}>
                            {playersOnThisRow[0].charAt(0)}
                        </Text>
                    </View>
                </View>
            );
        }

        // For 2+ players, always use overlapping circles (cascade all 8!)
        const overlapOffset = 10; // Slightly smaller offset to fit more circles
        const totalWidth = (playersOnThisRow.length - 1) * overlapOffset + 18; // Calculate total width needed
        
        return (
            <View style={[styles.overlappingContainer, { width: Math.min(totalWidth, 120) }]}>
                {playersOnThisRow.map((playerName, playerIndex) => (
                    <View
                        key={`${playerName}-${playerIndex}`}
                        style={[
                            styles.scaleVoteCircleOverlapping,
                            { 
                                backgroundColor: getPlayerColor(playerName),
                                left: playerIndex * overlapOffset,
                                zIndex: playerIndex + 1
                            }
                        ]}
                    >
                        <Text style={styles.scaleVoteCircleText}>
                            {playerName.charAt(0)}
                        </Text>
                    </View>
                ))}
            </View>
        );
    }, [getPlayerColor]);

    return (
        <View style={styles.container}>
            {/* Header - visible on black background */}
            <View style={styles.header}>
                <View style={styles.headerSpacer} />

                {/* Center - the term */}
                <Text style={styles.topTerm}>{currentPair?.positive}</Text>

                <View style={styles.headerSpacer} />
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

                            {/* Scale player indicator */}
                            <Text style={styles.scalePlayerText}>
                                Scale: {scalePlayer}
                            </Text>

                            {/* Player list - only voting players */}
                            <View style={styles.playerList}>
                                {votingPlayers.map((player) => {
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
                                {Array.from({ length: scaleSize }, (_, index) => {

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
                                                        backgroundColor: colors.scale200,
                                                        borderColor: selectedRowIndex === index ? getPlayerColor(selectedPlayer) : colors.scale300,
                                                        borderWidth: selectedRowIndex === index ? 2 : 1,
                                                    }
                                                ]}
                                            >
                                                {/* Enhanced player vote circles */}
                                                {renderPlayerCircles(playersOnThisRow)}
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
        flex: 1, // Add this
    },
    
    currentPlayerText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: colors.secondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },

    scalePlayerText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.warning,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    
    playerList: {
        flex: 1,
        justifyContent: 'center', // Change from 'space-evenly' to 'center'
        paddingVertical: spacing.sm,
        gap: spacing.xs, // Add back the gap for closer spacing
    },
    
    playerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md, // Increase to make taller
        paddingHorizontal: spacing.sm,
        borderRadius: 8,
        backgroundColor: colors.scale100,
        gap: spacing.xs,
        borderWidth: 2,
        borderColor: 'transparent',
        minHeight: 48, // Increase from 40
    },
    
    playerColorIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: spacing.xs,
    },
    
    playerButtonSelected: {
        backgroundColor: colors.scale200,
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
        borderBottomWidth: 1, // Add this back
        flexDirection: 'row',
        paddingHorizontal: 4,
        overflow: 'visible',
    },

    // ENHANCED: Original vote indicators for 1-2 players
    scaleVoteIndicators: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },

    // ENHANCED: Container for overlapping circles - now supports up to 8 players
    overlappingContainer: {
        position: 'relative',
        height: 18,
        minWidth: 18,
        alignItems: 'center',
        justifyContent: 'flex-start',
        // Allow container to expand horizontally for all 8 players
        maxWidth: 120, // Enough space for 8 overlapping circles
    },

    // ENHANCED: Standard vote circle (for 1-2 players)
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

    // ENHANCED: Overlapping vote circle - optimized for cascading up to 8 players
    scaleVoteCircleOverlapping: {
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.white,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.4, // Slightly stronger shadow for better depth
        shadowRadius: 2,
        elevation: 4, // Higher elevation for better layering
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