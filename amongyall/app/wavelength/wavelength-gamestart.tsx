import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, Alert } from 'react-native';
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
    const [selectedRow, setSelectedRow] = useState<number | null>(null); // For arrow placement
    const [showGoalZone, setShowGoalZone] = useState(true); // Toggle goal zone visibility

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
    
    const goalZoneColors = [
        '#0074D9', '#7FDBFF', '#E0F7FF'
    ];

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
        const { y } = event;
        
        console.log('Gesture Y:', y, 'Scale Height:', scaleAreaHeight);
        
        // Safety check to prevent division by zero
        if (scaleAreaHeight === 0 || scaleColors.length === 0) {
            console.log('Bailing - no height or colors');
            return;
        }
        
        // Calculate which row based on y position
        const rowIndex = Math.floor(y / (scaleAreaHeight / scaleColors.length));
        
        // Clamp to valid range
        const clampedIndex = Math.max(0, Math.min(scaleColors.length - 1, rowIndex));
        
        console.log('Row Index:', rowIndex, 'Clamped:', clampedIndex);
        
        if (clampedIndex !== selectedRowIndex) {
            // Use runOnJS to safely call React state setter
            runOnJS(setSelectedRowIndex)(clampedIndex);
        }
    });

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

        // Initialize random goal zone
        const zoneWidth = 5;
        const maxStart = scaleColors.length - zoneWidth;
        const start = Math.floor(Math.random() * maxStart);
        setGoalZoneStart(start);
        setGoalZoneEnd(start + zoneWidth - 1);
    }, []); // Empty dependency array ensures this only runs once

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

    const handleRowPress = (rowIndex: number) => {
        setSelectedRowIndex(rowIndex);
        console.log(`Row ${rowIndex} pressed`);
    };
     
    const isInGoalZone = (rowIndex: number) => {
        return rowIndex >= goalZoneStart && rowIndex <= goalZoneEnd;
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

                    <GestureDetector gesture={panGesture}>
                        <Animated.View 
                            style={{ flex: 1, width: '100%' }}
                            onLayout={(event) => {
                                const { height } = event.nativeEvent.layout;
                                setScaleAreaHeight(height);
                            }}
                        >
                            {scaleColors.map((color, index) => (
                                <TouchableOpacity
                                key={index}
                                style={[
                                    styles.scaleRow,
                                    { 
                                    backgroundColor: isInGoalZone(index) ? '#E0F7FF' : color,
                                    borderWidth: selectedRowIndex === index ? 3 : 0,
                                    borderColor: selectedRowIndex === index ? colors.primary : 'transparent',
                                    }
                                ]}
                                onPress={() => handleRowPress(index)}
                                activeOpacity={0.7}
                                >
                                </TouchableOpacity>
                            ))}
                        </Animated.View>
                    </GestureDetector>
                    
                    <Text style={styles.debugText}>
                        Goal Zone: {goalZoneStart} - {goalZoneEnd}
                    </Text>
                    <Text style={styles.debugText}>
                        Selected Row: {selectedRowIndex !== null ? selectedRowIndex : 'None'}
                    </Text>
                    
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
    
    revealButton: {
        height: '60%',
        width: '100%',
        maxHeight: 400,
        maxWidth: 300,
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
        width: screenWidth,
        maxWidth: 400, 
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 10,
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

    debugText: {
        fontSize: typography.fontSize.sm,
        color: colors.gray400,
        marginTop: spacing.sm,
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
});