import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
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

// Goal zone colors from wavelength-gamestart
const goalZoneColors = [
    '#B3E5FC', // Lightest blue 
    '#81D4FA', // Light blue 
    '#4DABF7'  
];

export default function WavelengthResults() {
    const params = useLocalSearchParams();
    const players = useMemo(() => JSON.parse(params.players as string || '[]') as string[], [params.players]);
    const currentPair = useMemo(() => JSON.parse(params.currentPair as string || '{}') as WordPairs, [params.currentPair]);
    const playerVotes = useMemo(() => JSON.parse(params.playerVotes as string || '[]') as PlayerVote[], [params.playerVotes]);

    // Parse goal zone values once and memoize them
    const goalZoneStart = useMemo(() => parseInt(params.goalZoneStart as string) || 8, [params.goalZoneStart]);
    const goalZoneEnd = useMemo(() => parseInt(params.goalZoneEnd as string) || 12, [params.goalZoneEnd]);
    
    // Get the scale player from params
    const scalePlayer = useMemo(() => params.firstPlayer as string || '', [params.firstPlayer]);
    
    // Parse player history to track who has seen scales
    const playerHistory = useMemo(() => {
        try {
            return JSON.parse(params.playerHistory as string || '[]') as PlayerHistory[];
        } catch {
            // Initialize history if not provided - mark current player as having seen scale
            return players.map(player => ({
                playerName: player,
                hasSeenScale: player === scalePlayer
            }));
        }
    }, [params.playerHistory, scalePlayer, players]);
    
    const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
    const [showFinalScoreboard, setShowFinalScoreboard] = useState(false);

    const previousScoresParam = useMemo(() => params.previousScores as string || '[]', [params.previousScores]);

    const scaleSize = 40;

    // Memoize the goal zone check function
    const isInGoalZone = useCallback((rowIndex: number) => {
        return rowIndex >= goalZoneStart && rowIndex <= goalZoneEnd;
    }, [goalZoneStart, goalZoneEnd]);

    // Memoize the points calculation function
    const calculatePoints = useCallback((rowIndex: number): number => {
        if (!isInGoalZone(rowIndex)) return 0;
        
        // Goal zone scoring: center gets 3, next rows get 2, outer rows get 1
        const goalZoneCenter = Math.floor((goalZoneStart + goalZoneEnd) / 2);
        const distanceFromCenter = Math.abs(rowIndex - goalZoneCenter);
        
        if (distanceFromCenter === 0) return 3; // Center row = 3 points
        if (distanceFromCenter === 1) return 2; // Next to center = 2 points  
        if (distanceFromCenter === 2) return 1; // Outer goal zone = 1 point
        return 0; // Outside goal zone
    }, [goalZoneStart, goalZoneEnd, isInGoalZone]);

    useEffect(() => {
        const previousScores = JSON.parse(previousScoresParam) as PlayerScore[];
        
        // Count how many voting players landed in the goal zone
        const votingPlayersInGoalZone = playerVotes.filter(vote => 
            vote.selectedRow !== null && 
            vote.hasVoted && 
            isInGoalZone(vote.selectedRow)
        ).length;
        
        console.log('Scale Player:', scalePlayer);
        console.log('Voting Players in Goal Zone:', votingPlayersInGoalZone);
        console.log('Player Votes:', playerVotes);
        
        const scores: PlayerScore[] = players.map(playerName => {
            let roundPoints = 0;
            
            if (playerName === scalePlayer) {
                // Scale player gets points equal to number of voting players in goal zone
                roundPoints = votingPlayersInGoalZone;
                console.log(`Scale player ${playerName} gets ${roundPoints} points`);
            } else {
                // Regular voting players get points based on their position
                const vote = playerVotes.find(v => v.playerName === playerName);
                roundPoints = vote && vote.selectedRow !== null ? calculatePoints(vote.selectedRow) : 0;
                console.log(`Voting player ${playerName} gets ${roundPoints} points`);
            }
            
            const previousScore = previousScores.find(p => p.playerName === playerName)?.score || 0;
            
            return {
                playerName,
                score: previousScore + roundPoints,
                roundPoints
            };
        });
        
        console.log('Final Scores:', scores);
        setPlayerScores(scores);
    }, [players, playerVotes, goalZoneStart, goalZoneEnd, previousScoresParam, calculatePoints, scalePlayer, isInGoalZone]);

    const getPlayerColor = useCallback((playerName: string): string => {
        const playerIndex = players.indexOf(playerName);
        return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
    }, [players]);

    const getPlayersOnRow = useCallback((rowIndex: number): string[] => {
        return playerVotes
            .filter(vote => vote.selectedRow === rowIndex && vote.hasVoted)
            .map(vote => vote.playerName);
    }, [playerVotes]);

    // Get point value for each row based on distance from goal zone
    const getRowPoints = useCallback((rowIndex: number): number => {
        return calculatePoints(rowIndex);
    }, [calculatePoints]);

    // Enhanced function to render overlapping player circles (non-interactive)
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

        // For 2+ players, use overlapping circles (cascade all!)
        const overlapOffset = 10;
        const totalWidth = (playersOnThisRow.length - 1) * overlapOffset + 18;
        
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

    // Determine next player logic
    const getNextPlayerInfo = useCallback(() => {
        // Find players who haven't seen a scale yet
        const unseenPlayers = playerHistory.filter(p => !p.hasSeenScale).map(p => p.playerName);
        
        if (unseenPlayers.length > 0) {
            // If there are players who haven't seen a scale, prioritize them
            if (unseenPlayers.length === 1) {
                return {
                    nextPlayer: unseenPlayers[0],
                    isAutomatic: true,
                    message: `${unseenPlayers[0]} hasn't seen a scale yet`
                };
            } else {
                return {
                    nextPlayer: null,
                    isAutomatic: false,
                    message: `${unseenPlayers.length} players haven't seen a scale yet`
                };
            }
        } else {
            // All players have seen a scale, any player can go
            return {
                nextPlayer: null,
                isAutomatic: false,
                message: 'All players have seen a scale - choose any player'
            };
        }
    }, [playerHistory]);

    const handleHome = () => {
        setShowFinalScoreboard(true);
    };

    const handleBackToSetup = () => {
        router.push('/wavelength/wavelength-setup');
    };

    const handleNextRound = () => {
        const nextPlayerInfo = getNextPlayerInfo();
        
        if (nextPlayerInfo.isAutomatic && nextPlayerInfo.nextPlayer) {
            // Automatically assign the next player
            navigateToNextRound(nextPlayerInfo.nextPlayer);
        } else {
            // Show selection options
            showNextPlayerOptions();
        }
    };

    const showNextPlayerOptions = () => {
        const nextPlayerInfo = getNextPlayerInfo();
        const unseenPlayers = playerHistory.filter(p => !p.hasSeenScale).map(p => p.playerName);
        const availablePlayers = unseenPlayers.length > 0 ? unseenPlayers : players;

        Alert.alert(
            'Choose Next Player',
            nextPlayerInfo.message,
            [
                {
                    text: 'Random Player',
                    onPress: () => {
                        const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
                        navigateToNextRound(randomPlayer);
                    }
                },
                {
                    text: 'Choose Player',
                    onPress: () => showPlayerSelection(availablePlayers)
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    const showPlayerSelection = (availablePlayers: string[]) => {
        const buttons = availablePlayers.map(player => ({
            text: player,
            onPress: () => navigateToNextRound(player)
        }));
        
        buttons.push({
            text: 'Cancel',
            style: 'cancel' as const
        });

        Alert.alert(
            'Select Next Player',
            'Who should see the next scale?',
            buttons
        );
    };

    const navigateToNextRound = (nextPlayer: string) => {
        // Update player history
        const updatedHistory = playerHistory.map(p => 
            p.playerName === nextPlayer ? { ...p, hasSeenScale: true } : p
        );

        // Navigate to pairs selection for next round
        router.push({
            pathname: '/wavelength/wavelength-pairs',
            params: {
                players: JSON.stringify(players),
                firstPlayer: nextPlayer,
                playerScores: JSON.stringify(playerScores), // Pass current scores
                playerHistory: JSON.stringify(updatedHistory) // Pass updated history
            }
        });
    };

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

    // Final Scoreboard Modal
    if (showFinalScoreboard) {
        return (
            <View style={styles.finalScoreboardContainer}>
                <View style={styles.finalScoreboardContent}>
                    <Text style={styles.finalScoreboardTitle}>Final Scores</Text>
                    
                    <View style={styles.finalScoresList}>
                        {playerScores
                            .sort((a, b) => b.score - a.score)
                            .map((playerScore, index) => {
                                const playerColor = getPlayerColor(playerScore.playerName);
                                return (
                                    <View
                                        key={playerScore.playerName}
                                        style={[
                                            styles.finalScoreItem,
                                            index === 0 && styles.finalWinnerItem
                                        ]}
                                    >
                                        <View style={styles.finalScoreLeft}>
                                            <Text style={styles.finalScorePosition}>
                                                {index + 1}.
                                            </Text>
                                            <View style={[
                                                styles.playerColorIndicator,
                                                { backgroundColor: playerColor }
                                            ]} />
                                            <Text style={[
                                                styles.finalScorePlayerName,
                                                index === 0 && styles.finalWinnerText
                                            ]}>
                                                {playerScore.playerName}
                                            </Text>
                                        </View>
                                        <Text style={[
                                            styles.finalScoreValue,
                                            index === 0 && styles.finalWinnerText
                                        ]}>
                                            {playerScore.score}
                                        </Text>
                                    </View>
                                );
                            })}
                    </View>

                    <View style={styles.finalButtonContainer}>
                        <Button
                            title="New Game"
                            variant="primary"
                            size="lg"
                            icon="refresh-outline"
                            onPress={handleBackToSetup}
                            style={styles.finalButton}
                        />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header - visible on black background */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleHome}>
                    <Ionicons name="home-outline" size={layout.iconSize.sm} color={colors.white} />
                </TouchableOpacity>

                {/* Center - the term */}
                <Text style={styles.topTerm}>{currentPair?.positive}</Text>

                <View style={styles.headerSpacer} />
            </View>

            {/* Main content area */}
            <View style={styles.content}>
                {/* White scale box in the center */}
                <View style={styles.scaleBox}>
                    <View style={styles.horizontalContainer}>
                        
                        {/* Left side - Player Scores */}
                        <View style={styles.leftContainer}>
                            {/* Results header */}
                            <Text style={styles.resultsHeaderText}>
                                RESULTS
                            </Text>

                            {/* Scale player indicator */}
                            <Text style={styles.scalePlayerIndicator}>
                                Scale: {scalePlayer} (+{playerScores.find(p => p.playerName === scalePlayer)?.roundPoints || 0})
                            </Text>

                            {/* Player scores list */}
                            <View style={styles.playerList}>
                                {playerScores
                                    .sort((a, b) => b.score - a.score) // Sort by score descending
                                    .map((playerScore, index) => {
                                        const playerColor = getPlayerColor(playerScore.playerName);
                                        const isScalePlayer = playerScore.playerName === scalePlayer;
                                        return (
                                            <View
                                                key={playerScore.playerName}
                                                style={[
                                                    styles.playerScoreItem,
                                                    index === 0 && styles.winnerItem, // Highlight winner
                                                    isScalePlayer && styles.scalePlayerItem // Highlight scale player
                                                ]}
                                            >
                                                <View style={styles.playerScoreLeft}>
                                                    <View style={[
                                                        styles.playerColorIndicator,
                                                        { backgroundColor: playerColor }
                                                    ]} />
                                                    <Text style={[
                                                        styles.playerScoreText,
                                                        index === 0 && styles.winnerText,
                                                        isScalePlayer && styles.scalePlayerText
                                                    ]}>
                                                        {playerScore.playerName}
                                                        {isScalePlayer && ' (Scale)'}
                                                    </Text>
                                                </View>
                                                <View style={styles.scoreContainer}>
                                                    <Text style={[
                                                        styles.roundPointsText,
                                                        { color: playerColor }
                                                    ]}>
                                                        +{playerScore.roundPoints}
                                                    </Text>
                                                    <Text style={[
                                                        styles.totalScoreText,
                                                        index === 0 && styles.winnerText
                                                    ]}>
                                                        {playerScore.score}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.buttonContainer}>
                                <Button
                                    title="HOME"
                                    variant="outline"
                                    size="sm"
                                    icon="home-outline"
                                    onPress={handleHome}
                                    style={styles.actionButton}
                                />
                                <Button
                                    title="NEXT ROUND"
                                    variant="secondary"
                                    size="sm"
                                    icon="play-outline"
                                    onPress={handleNextRound}
                                    style={styles.actionButton}
                                />
                            </View>
                        </View>
                        
                        {/* Scale - Static display with results */}
                        <View style={styles.scaleContainer}>
                            {Array.from({ length: scaleSize }, (_, index) => {
                                const playersOnThisRow = getPlayersOnRow(index);
                                const rowPoints = getRowPoints(index);
                                const inGoalZone = isInGoalZone(index);
                                const goalZoneColor = getGoalZoneColor(index);
                                
                                return (
                                    <View
                                        key={index}
                                        style={styles.scaleRowContainer}
                                    >
                                        {/* Left side of scale - shows player votes */}
                                        <View
                                            style={[
                                                styles.scaleRowLeft,
                                                { 
                                                    backgroundColor: goalZoneColor || colors.gray200,
                                                    borderColor: inGoalZone ? '#7FDBFF' : colors.gray300,
                                                    borderWidth: inGoalZone ? 2 : 1,
                                                }
                                            ]}
                                        >
                                            {/* Player vote circles */}
                                            {renderPlayerCircles(playersOnThisRow)}
                                        </View>

                                        {/* Right side of scale - shows points or arrow */}
                                        <View style={styles.scaleRowRight}>
                                            {inGoalZone ? (
                                                <View style={styles.goalZoneIndicator}>
                                                    <Ionicons 
                                                        name="arrow-back" 
                                                        size={12} 
                                                        color="#0074D9" 
                                                    />
                                                    <Text style={styles.goalZonePointsText}>
                                                        {rowPoints} 
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
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
    
    // Left container - Player scores
    leftContainer: {
        width: '60%',
        justifyContent: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    
    resultsHeaderText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },

    scalePlayerIndicator: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.warning,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    
    playerList: {
        flex: 1,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    
    playerScoreItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs, 
        paddingHorizontal: spacing.xs, 
        borderRadius: 6, 
        backgroundColor: colors.gray100,
        borderWidth: 1,
        borderColor: colors.gray200,
        minHeight: 32, 
    },
    
    winnerItem: {
        backgroundColor: colors.success + '20',
        borderColor: colors.success,
        borderWidth: 2,
    },

    scalePlayerItem: {
        backgroundColor: colors.warning + '10',
        borderColor: colors.warning,
        borderWidth: 1,
    },
    
    playerScoreLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    
    playerColorIndicator: {
        width: 10, 
        height: 10, 
        borderRadius: 5, 
    },
    
    playerScoreText: {
        fontSize: typography.fontSize.xs, 
        color: colors.gray700,
        fontWeight: typography.fontWeight.medium,
    },
    
    winnerText: {
        color: colors.success,
        fontWeight: typography.fontWeight.bold,
    },

    scalePlayerText: {
        color: colors.warning,
        fontWeight: typography.fontWeight.semibold,
    },
    
    scoreContainer: {
        alignItems: 'flex-end',
        gap: 2,
    },
    
    roundPointsText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        // color set dynamically to player color
    },
    
    totalScoreText: {
        fontSize: typography.fontSize.sm, 
        fontWeight: typography.fontWeight.bold,
        color: colors.gray800,
    },
    
    buttonContainer: {
        gap: spacing.sm,
    },
    
    actionButton: {
        width: '100%',
    },
    
    // Scale styling - static display
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
        borderBottomWidth: 0,
        flexDirection: 'row',
        paddingHorizontal: 4,
        overflow: 'hidden', 
        position: 'relative', 
    },

    scaleRowRight: {
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    pointsText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        textAlign: 'center',
    },

    // Goal zone indicator styling
    goalZoneIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },

    goalZonePointsText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: '#0074D9',
        textAlign: 'center',
    },

    // Player circle styles (same as gameplay)
    scaleVoteIndicators: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },

    overlappingContainer: {
        position: 'relative',
        height: 18,
        minWidth: 18,
        alignItems: 'center',
        justifyContent: 'flex-start',
        maxWidth: 120,
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
        shadowOpacity: 0.4,
        shadowRadius: 2,
        elevation: 4,
    },

    scaleVoteCircleText: {
        fontSize: 10,
        fontWeight: typography.fontWeight.bold,
        color: colors.white,
        textAlign: 'center',
    },

    // Final Scoreboard Modal Styles
    finalScoreboardContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },

    finalScoreboardContent: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },

    finalScoreboardTitle: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.primary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },

    finalScoresList: {
        width: '100%',
        marginBottom: spacing.xl,
    },

    finalScoreItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 8,
        backgroundColor: colors.gray100,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.gray200,
    },

    finalWinnerItem: {
        backgroundColor: colors.success + '20',
        borderColor: colors.success,
        borderWidth: 2,
    },

    finalScoreLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },

    finalScorePosition: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.gray600,
        minWidth: 24,
    },

    finalScorePlayerName: {
        fontSize: typography.fontSize.base,
        color: colors.gray700,
        fontWeight: typography.fontWeight.medium,
    },

    finalWinnerText: {
        color: colors.success,
        fontWeight: typography.fontWeight.bold,
    },

    finalScoreValue: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.gray800,
    },

    finalButtonContainer: {
        width: '100%',
    },

    finalButton: {
        width: '100%',
    },
});