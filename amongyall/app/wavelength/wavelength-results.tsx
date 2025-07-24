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
import { WordPairs, getRandomPair } from '../../constants/theme';

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
    
    const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
    const [previousPlayer, setPreviousPlayer] = useState<string>('');

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
        
        const scores: PlayerScore[] = players.map(playerName => {
            const vote = playerVotes.find(v => v.playerName === playerName);
            const roundPoints = vote && vote.selectedRow !== null ? calculatePoints(vote.selectedRow) : 0;
            
            // Find previous score for this player, or start at 0
            const previousScore = previousScores.find(p => p.playerName === playerName)?.score || 0;
            
            return {
                playerName,
                score: previousScore + roundPoints, // Add current round to previous total
                roundPoints
            };
        });
        setPlayerScores(scores);
    }, [players, playerVotes, goalZoneStart, goalZoneEnd, previousScoresParam]);

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

    const handleRestart = () => {
        Alert.alert(
            'Restart Game',
            'Are you sure you want to start a new round?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Yes, Restart',
                    onPress: () => {
                        router.push({
                            pathname: '/wavelength/wavelength-setup',
                            params: {
                                players: JSON.stringify(players),
                            }
                        });
                    },
                },
            ]
        );
    };

    const handleNextPlayer = () => {
        // Select a random player that's different from the previous one
        const availablePlayers = players.filter(player => player !== previousPlayer);
        const randomPlayer = availablePlayers.length > 0 
            ? availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
            : players[Math.floor(Math.random() * players.length)];
        
        setPreviousPlayer(randomPlayer);

        // Navigate back to gamestart for the reveal process
        router.push({
            pathname: '/wavelength/wavelength-gamestart',
            params: {
                players: JSON.stringify(players),
                playerScores: JSON.stringify(playerScores),
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

    const handleBackToHome = () => {
        router.push('/');
    };

    return (
        <View style={styles.container}>
            {/* Header - visible on black background */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBackToHome}>
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

                            {/* Player scores list */}
                            <View style={styles.playerList}>
                                {playerScores
                                    .sort((a, b) => b.score - a.score) // Sort by score descending
                                    .map((playerScore, index) => {
                                        const playerColor = getPlayerColor(playerScore.playerName);
                                        return (
                                            <View
                                                key={playerScore.playerName}
                                                style={[
                                                    styles.playerScoreItem,
                                                    index === 0 && styles.winnerItem // Highlight winner
                                                ]}
                                            >
                                                <View style={styles.playerScoreLeft}>
                                                    <View style={[
                                                        styles.playerColorIndicator,
                                                        { backgroundColor: playerColor }
                                                    ]} />
                                                    <Text style={[
                                                        styles.playerScoreText,
                                                        index === 0 && styles.winnerText
                                                    ]}>
                                                        {playerScore.playerName}
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
                                    title="RESTART"
                                    variant="outline"
                                    size="sm"
                                    icon="refresh-outline"
                                    onPress={handleRestart}
                                    style={styles.actionButton}
                                />
                                <Button
                                    title="NEXT ROUND"
                                    variant="secondary"
                                    size="sm"
                                    icon="play-outline"
                                    onPress={handleNextPlayer}
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
        marginBottom: spacing.lg,
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
        paddingVertical: spacing.xs, // Reduced from spacing.sm
        paddingHorizontal: spacing.xs, // Reduced from spacing.sm
        borderRadius: 6, // Reduced from 8
        backgroundColor: colors.gray100,
        borderWidth: 1,
        borderColor: colors.gray200,
        minHeight: 32, // Smaller minimum height
    },
    
    winnerItem: {
        backgroundColor: colors.success + '20',
        borderColor: colors.success,
        borderWidth: 2,
    },
    
    playerScoreLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    
    playerColorIndicator: {
        width: 10, // Reduced from 12
        height: 10, // Reduced from 12
        borderRadius: 5, // Reduced from 6
    },
    
    playerScoreText: {
        fontSize: typography.fontSize.xs, // Reduced from sm
        color: colors.gray700,
        fontWeight: typography.fontWeight.medium,
    },
    
    winnerText: {
        color: colors.success,
        fontWeight: typography.fontWeight.bold,
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
        fontSize: typography.fontSize.sm, // Reduced from base
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
        overflow: 'hidden', // Changed from 'visible' to prevent circles from extending outside
        position: 'relative', // Add relative positioning for better circle containment
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
});