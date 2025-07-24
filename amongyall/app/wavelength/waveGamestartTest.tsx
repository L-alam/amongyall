import React, { useState, useEffect } from 'react';
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
import { getRandomPair, WordPairs } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WavelengthGameStart() {
    const params = useLocalSearchParams();
    const players = JSON.parse(params.players as string || '[]') as string[];
    
    const [currentPair, setCurrentPair] = useState<WordPairs | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<string>('');
    const [showScale, setShowScale] = useState(false);

    // Scale State
    const [goalZoneStart, setGoalZoneStart] = useState(8);
    const [goalZoneEnd, setGoalZoneEnd] = useState(12);
    const [scaleAreaHeight, setScaleAreaHeight] = useState(0);

    // Create scale segments (like the visual - appears to be about 40 segments)
    const scaleSegments = Array.from({ length: 40 }, (_, i) => i);

    // Runs once when the component mounts 
    useEffect(() => {
        // Get a random word pair for this round
        const pair = getRandomPair();
        setCurrentPair(pair);
        
        // Select a random player
        if (players.length > 0) {
            const randomPlayer = players[Math.floor(Math.random() * players.length)];
            setSelectedPlayer(randomPlayer);
        }

        // Initialize random goal zone (5 segments wide)
        const zoneWidth = 5;
        const maxStart = scaleSegments.length - zoneWidth;
        const start = Math.floor(Math.random() * maxStart);
        setGoalZoneStart(start);
        setGoalZoneEnd(start + zoneWidth - 1);
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

    const startGameplay = () => {
        router.push({
            pathname: '/wavelength/wavelength-gameplay',
            params: {
                players: JSON.stringify(players),
                currentPair: JSON.stringify(currentPair),
                goalZoneStart: goalZoneStart.toString(),
                goalZoneEnd: goalZoneEnd.toString(),
            }
        });
    };

    const isInGoalZone = (segmentIndex: number) => {
        return segmentIndex >= goalZoneStart && segmentIndex <= goalZoneEnd;
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

    // Scale Screen (Black Background) - Planning Phase
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

                        {/* Left side - Instructions and Start Button */}
                        <View style={styles.leftContainer}>
                            <Text style={styles.instructionText}>
                                Come up with a one word clue to guide the group to this area of the scale
                            </Text>
                            
                            <Button
                                title="START"
                                variant="primary"
                                size="md"
                                onPress={startGameplay}
                                style={styles.startButton}
                            />
                        </View>
                        
                        {/* Scale - Read Only */}
                        <View style={styles.scaleContainer}>
                            <View 
                                style={styles.scaleArea}
                                onLayout={(event) => {
                                    const { height } = event.nativeEvent.layout;
                                    setScaleAreaHeight(height);
                                }}
                            >
                                {scaleSegments.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.scaleSegment,
                                            { 
                                                backgroundColor: isInGoalZone(index) ? '#4DABF7' : colors.gray200,
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                            
                            {/* Scale marks */}
                            <View style={styles.scaleMarks}>
                                {[1, 2, 3, 2, 1].map((number, index) => (
                                    <View key={index} style={styles.markContainer}>
                                        <Text style={styles.markNumber}>{number}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Right side spacer */}
                        <View style={styles.rightSpacer} />
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
    // Player Selection Screen Styles
    playerSelectionContainer: {
        flex: 1,
        backgroundColor: colors.white,
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
        width: '100%',
        maxWidth: 300,
    },
    
    // Scale Screen Styles
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
        width: '40%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
    },
    
    instructionText: {
        fontSize: typography.fontSize.sm,
        color: colors.gray600,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: typography.fontSize.sm * 1.4,
    },
    
    startButton: {
        width: '80%',
    },
    
    scaleContainer: {
        flex: 1,
        paddingHorizontal: spacing.sm,
    },
    
    scaleArea: {
        flex: 1,
        width: '100%',
        flexDirection: 'column',
    },
    
    scaleSegment: {
        flex: 1,
        width: '100%',
        borderBottomWidth: 1,
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
    
    rightSpacer: {
        width: '10%',
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