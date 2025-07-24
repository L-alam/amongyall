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

    // Create scale segments
    const scaleSegments = Array.from({ length: 40 }, (_, i) => i);
    const rowHeight = scaleAreaHeight / scaleSegments.length;

    // Initialize player votes
    useEffect(() => {
        const initialVotes: PlayerVote[] = players.map(player => ({
            playerName: player,
            selectedRow: null,
            hasVoted: false
        }));
        setPlayerVotes(initialVotes);
    }, [players]);

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            const { y } = event;
            
            if (scaleAreaHeight === 0 || scaleSegments.length === 0) {
                return;
            }
            
            const rowIndex = Math.floor(y / (scaleAreaHeight / scaleSegments.length));
            const clampedIndex = Math.max(0, Math.min(scaleSegments.length - 1, rowIndex));
            
            if (clampedIndex !== selectedRowIndex) {
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

    const getPlayerVoteRow = (playerName: string): number | null => {
        const vote = playerVotes.find(vote => vote.playerName === playerName);
        return vote?.selectedRow || null;
    };

    const hasPlayerVoted = (playerName: string): boolean => {
        const vote = playerVotes.find(vote => vote.playerName === playerName);
        return vote?.hasVoted || false;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <Text style={styles.topTerm}>{currentPair?.positive}</Text>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <Ionicons name="close" size={layout.iconSize.sm} color={colors.white} />
                </TouchableOpacity>
            </View>

            {/* Main content area */}
            <View style={styles.content}>
                <View style={styles.scaleBox}>
                    <View style={styles.horizontalContainer}>

                        {/* Left side - Player Selection and Controls */}
                        <View style={styles.leftContainer}>
                            {/* Current player indicator */}
                            <Text style={styles.currentPlayerText}>
                                {selectedPlayer}'s turn
                            </Text>

                            {/* Player list */}
                            <View style={styles.playerList}>
                                {players.map((player) => (
                                    <TouchableOpacity
                                        key={player}
                                        style={[
                                            styles.playerButton,
                                            selectedPlayer === player && styles.playerButtonSelected,
                                            hasPlayerVoted(player) && styles.playerButtonVoted
                                        ]}
                                        onPress={() => handlePlayerSelect(player)}
                                    >
                                        <Ionicons 
                                            name="person-circle-outline" 
                                            size={selectedPlayer === player ? 28 : 20} 
                                            color={
                                                hasPlayerVoted(player) ? colors.success :
                                                selectedPlayer === player ? colors.secondary : colors.gray500
                                            } 
                                        />
                                        <Text style={[
                                            styles.playerButtonText,
                                            selectedPlayer === player && styles.playerButtonTextSelected,
                                            hasPlayerVoted(player) && styles.playerButtonTextVoted
                                        ]}>
                                            {player}
                                        </Text>
                                        {hasPlayerVoted(player) && (
                                            <Ionicons 
                                                name="checkmark-circle" 
                                                size={16} 
                                                color={colors.success} 
                                            />
                                        )}
                                        {selectedPlayer === player && getPlayerVoteRow(player) !== null && (
                                            <Text style={styles.playerVoteIndicator}>
                                                →{getPlayerVoteRow(player)! + 1}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
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
                        
                        {/* Scale - Interactive */}
                        <GestureDetector gesture={panGesture}>
                            <Animated.View 
                                style={styles.scaleContainer}
                                onLayout={(event) => {
                                    const { height } = event.nativeEvent.layout;
                                    setScaleAreaHeight(height);
                                }}
                            >
                                {scaleSegments.map((_, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.scaleSegment,
                                            { 
                                                backgroundColor: colors.gray200,
                                                borderWidth: selectedRowIndex === index ? 3 : 1,
                                                borderColor: selectedRowIndex === index ? colors.secondary : colors.gray400,
                                            }
                                        ]}
                                        onPress={() => handleRowPress(index)}
                                        activeOpacity={0.7}
                                    />
                                ))}
                                
                                {/* Scale marks */}
                                <View style={styles.scaleMarks}>
                                    {[1, 2, 3, 2, 1].map((number, index) => (
                                        <View key={index} style={styles.markContainer}>
                                            <Text style={styles.markNumber}>{number}</Text>
                                        </View>
                                    ))}
                                </View>
                            </Animated.View>
                        </GestureDetector>

                        {/* Right side - Player votes visualization */}
                        <View style={styles.rightContainer}>
                            {players.map((player) => {
                                const voteRow = getPlayerVoteRow(player);
                                return (
                                    <View key={player} style={styles.playerVoteDisplay}>
                                        <Text style={styles.playerVoteText}>{player}</Text>
                                        {voteRow !== null && (
                                            <View style={styles.voteArrow}>
                                                <Text style={styles.voteArrowText}>→</Text>
                                            </View>
                                        )}
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
    container: {
        flex: 1,
        backgroundColor: colors.black,
    },
    
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    scaleBox: {
        backgroundColor: colors.white,
        width: screenWidth,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    horizontalContainer: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
    },
    
    leftContainer: {
        width: '35%',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
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
        width: '100%',
        flex: 1,
        gap: spacing.xs,
    },
    
    playerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: 8,
        backgroundColor: colors.gray100,
        gap: spacing.xs,
    },
    
    playerButtonSelected: {
        backgroundColor: colors.secondary + '20',
        borderWidth: 2,
        borderColor: colors.secondary,
    },
    
    playerButtonVoted: {
        backgroundColor: colors.success + '10',
    },
    
    playerButtonText: {
        fontSize: typography.fontSize.xs,
        color: colors.gray600,
        flex: 1,
    },
    
    playerButtonTextSelected: {
        color: colors.secondary,
        fontWeight: typography.fontWeight.semibold,
    },
    
    playerButtonTextVoted: {
        color: colors.success,
        fontWeight: typography.fontWeight.medium,
    },
    
    playerVoteIndicator: {
        fontSize: typography.fontSize.xs,
        color: colors.secondary,
        fontWeight: typography.fontWeight.bold,
    },
    
    revealButton: {
        width: '90%',
        marginTop: spacing.md,
    },
    
    scaleContainer: {
        flex: 1,
        paddingHorizontal: spacing.sm,
        position: 'relative',
    },
    
    scaleSegment: {
        flex: 1,
        width: '100%',
        borderBottomColor: colors.gray400,
    },
    
    scaleMarks: {
        position: 'absolute',
        right: -40,
        top: 0,
        bottom: 0,
        width: 30,
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    
    markContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    markNumber: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.gray700,
    },
    
    rightContainer: {
        width: '25%',
        justifyContent: 'flex-start',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
    },
    
    playerVoteDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        justifyContent: 'space-between',
    },
    
    playerVoteText: {
        fontSize: typography.fontSize.xs,
        color: colors.gray600,
    },
    
    voteArrow: {
        alignItems: 'center',
    },
    
    voteArrowText: {
        fontSize: typography.fontSize.sm,
        color: colors.secondary,
        fontWeight: typography.fontWeight.bold,
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
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    
    headerSpacer: {
        width: layout.iconSize.sm + spacing.sm * 2,
    },
    
    topTerm: {
        color: colors.white,
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        textAlign: 'center',
        flex: 1,
    },

    bottomTerm: {
        color: colors.white,
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        textAlign: 'center',
    },
    
    headerButton: {
        padding: spacing.sm,
    },
});