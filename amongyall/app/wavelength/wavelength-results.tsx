import React, { useState, useEffect, useCallback } from 'react';
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
    roundPoints: number; // Points earned this round
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

export default function WavelengthResults() {
    const params = useLocalSearchParams();
    const players = JSON.parse(params.players as string || '[]') as string[];
    const currentPair = JSON.parse(params.currentPair as string || '{}') as WordPairs;
    const goalZoneStart = parseInt(params.goalZoneStart as string) || 8;
    const goalZoneEnd = parseInt(params.goalZoneEnd as string) || 12;
    const playerVotes = JSON.parse(params.playerVotes as string || '[]') as PlayerVote[];
    
    const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
    const [previousPlayer, setPreviousPlayer] = useState<string>('');

    const scaleSize = 40;

    // Calculate points based on distance from goal zone
    const calculatePoints = useCallback((rowIndex: number): number => {
        const goalZoneCenter = (goalZoneStart + goalZoneEnd) / 2;
        const distance = Math.abs(rowIndex - goalZoneCenter);
        
        // Points system: closer to center = more points
        if (distance === 0) return 4; // Perfect center
        if (distance <= 1) return 3;  // Very close
        if (distance <= 2) return 2;  // Close
        if (distance <= 3) return 1;  // Somewhat close
        return 0; // Too far
    }, [goalZoneStart, goalZoneEnd]);

    // Initialize player scores
    useEffect(() => {
        const scores: PlayerScore[] = players.map(playerName => {
            const vote = playerVotes.find(v => v.playerName === playerName);
            const roundPoints = vote && vote.selectedRow !== null ? calculatePoints(vote.selectedRow) : 0;
            
            return {
                playerName,
                score: roundPoints, // For now, just this round's points
                roundPoints
            };
        });
        setPlayerScores(scores);
    }, [players, playerVotes, calculatePoints]);

    const getPlayerColor = useCallback((playerName: string): string => {
        const playerIndex = players.indexOf(playerName);
        return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
    }, [players]);

    const getPlayersOnRow = useCallback((rowIndex: number): string[] => {
        return playerVotes
            .filter(vote => vote.selectedRow === rowIndex && vote.hasVoted)
            .map(vote => vote.playerName);
    }, [playerVotes]);

    const isInGoalZone = (rowIndex: number) => {
        return rowIndex >= goalZoneStart && rowIndex <= goalZoneEnd;
    };

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
                            pathname: '/wavelength/wavelength-gamestart',
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
        // Get a new random pair
        const newPair = getRandomPair();
        if (!newPair) return;

        // Select a random player that's different from the previous one
        const availablePlayers = players.filter(player => player !== previousPlayer);
        const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
        
        setPreviousPlayer(randomPlayer);

        // Generate new random goal zone
        const zoneWidth = 5;
        const maxStart = scaleSize - zoneWidth;
        const newGoalZoneStart = Math.floor(Math.random() * maxStart);
        const newGoalZoneEnd = newGoalZoneStart + zoneWidth - 1;

        router.push({
            pathname: '/wavelength/wavelength-gameplay',
            params: {
                players: JSON.stringify(players),
                currentPair: JSON.stringify(newPair),
                goalZoneStart: newGoalZoneStart.toString(),
                goalZoneEnd: newGoalZoneEnd.toString(),
            }
        });
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
                                                    backgroundColor: inGoalZone ? colors.secondary + '30' : colors.gray200,
                                                    borderColor: inGoalZone ? colors.secondary : colors.gray400,
                                                    borderWidth: inGoalZone ? 2 : 1,
                                                }
                                            ]}
                                        >
                                            {/* Player vote circles */}
                                            {renderPlayerCircles(playersOnThisRow)}
                                        </View>

                                        {/* Right side of scale - shows points */}
                                        <View style={styles.scaleRowRight}>
                                            <Text style={[
                                                styles.pointsText,
                                                { 
                                                    color: inGoalZone ? colors.secondary : colors.gray500,
                                                    fontWeight: inGoalZone ? typography.fontWeight.bold : typography.fontWeight.normal
                                                }
                                            ]}>
                                                {rowPoints}
                                            </Text>
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
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: 8,
        backgroundColor: colors.gray100,
        borderWidth: 1,
        borderColor: colors.gray200,
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
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    
    playerScoreText: {
        fontSize: typography.fontSize.sm,
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
        fontSize: typography.fontSize.base,
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
        borderBottomWidth: 1,
        flexDirection: 'row',
        paddingHorizontal: 4,
        overflow: 'visible',
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