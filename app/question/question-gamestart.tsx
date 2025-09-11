import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Button } from '../../components/Button';
import { colors, layout, spacing, typography } from '../../constants/theme';
import {
    combineStyles,
    layoutStyles,
    textStyles
} from '../../utils/styles';

import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface PlayerResponse {
    playerId: number;
    playerName: string;
    question: string;
    response: string;
    isSpy: boolean;
    hasAnswered: boolean;
}

type QuestionPair = { normal: string; spy: string };

// FRONT of the card
const RegularContent = () => {
    return (
      <View style={styles.cardFront}>
        <Ionicons 
            name="help-circle-outline" 
            size={48} 
            color={colors.gray400} 
            style={styles.cardIcon}
        />
        <Text style={styles.cardFrontText}>
            Click here to reveal{'\n'}your question
        </Text>
      </View>
    );
};

// BACK of the card  
const FlippedContent = ({ question, onResponseChange, response, isFlipped }: { 
    question: string; 
    onResponseChange: (text: string) => void;
    response: string;
    isFlipped: boolean;
}) => {
    return (
        <View style={styles.cardBack}>
            <Text style={styles.questionLabel}>Your question:</Text>
            <Text style={styles.questionText}>{question}</Text>
            <TextInput
                style={styles.responseInput}
                placeholder="Type your answer here..."
                placeholderTextColor={colors.gray300}
                value={response}
                onChangeText={onResponseChange}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                editable={isFlipped} // Only allow editing when card is flipped
                pointerEvents={isFlipped ? 'auto' : 'none'} // Prevent touch events when not flipped
            />
            <Text style={styles.questionInstruction}>
                Answer honestly but don't{'\n'}give away your question
            </Text>
        </View>
    );
};

// Flip Card Component
const FlipCard = ({
    isFlipped,
    cardStyle,
    direction = 'y',
    duration = 600,
    RegularContent,
    FlippedContent,
    onPress,
}: {
    isFlipped: Animated.SharedValue<boolean>;
    cardStyle: any;
    direction?: 'x' | 'y';
    duration?: number;
    RegularContent: React.ReactNode;
    FlippedContent: React.ReactNode;
    onPress: () => void;
}) => {
    const isDirectionX = direction === 'x';

    const regularCardAnimatedStyle = useAnimatedStyle(() => {
      const spinValue = interpolate(Number(isFlipped.value), [0, 1], [0, 180]);
      const animationDuration = isFlipped.value ? duration : 0;
      const rotateValue = withTiming(`${spinValue}deg`, { duration: animationDuration });

      return {
        transform: [
          isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
        ],
      };
    });

    const flippedCardAnimatedStyle = useAnimatedStyle(() => {
      const spinValue = interpolate(Number(isFlipped.value), [0, 1], [180, 360]);
      const animationDuration = isFlipped.value ? duration : 0;
      const rotateValue = withTiming(`${spinValue}deg`, { duration: animationDuration });

      return {
        transform: [
          isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
        ],
      };
    });

    return (
      <Pressable onPress={onPress} style={[cardStyle, styles.pressableContainer]}>
        <Animated.View
          style={[
            styles.regularCard,
            regularCardAnimatedStyle,
          ]}>
          {RegularContent}
        </Animated.View>
        <Animated.View
          style={[
            styles.flippedCard,
            flippedCardAnimatedStyle,
          ]}>
          {FlippedContent}
        </Animated.View>
      </Pressable>
    );
};

export default function QuestionGameStart() {
    const params = useLocalSearchParams();
    const set = params.set as string || 'Sports';
    const players = JSON.parse(params.players as string || '[]') as string[];
    const questions = JSON.parse(params.questions as string || '[]') as QuestionPair[];

    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [playerResponses, setPlayerResponses] = useState<PlayerResponse[]>([]);
    const [gameQuestion, setGameQuestion] = useState<QuestionPair>({ normal: '', spy: '' });
    const [spyIndex, setSpyIndex] = useState(-1);
    const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);
    const [currentCardFlipped, setCurrentCardFlipped] = useState(false);
    const [currentResponse, setCurrentResponse] = useState('');

    // Reanimated shared value for flip state
    const isFlipped = useSharedValue(false);

    // Initialize game setup
    useEffect(() => {
        setupGame();
    }, []);

    const setupGame = () => {
        // Select random question pair for this round
        const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];
        setGameQuestion(selectedQuestion);

        // Randomly select spy
        const randomSpyIndex = Math.floor(Math.random() * players.length);
        setSpyIndex(randomSpyIndex);

        // Initialize player responses
        const responses: PlayerResponse[] = players.map((playerName, index) => ({
            playerId: index,
            playerName,
            question: index === randomSpyIndex ? selectedQuestion.spy : selectedQuestion.normal,
            response: '',
            isSpy: index === randomSpyIndex,
            hasAnswered: false,
        }));

        setPlayerResponses(responses);
    };

    const confirmPlayer = () => {
        const currentPlayer = players[currentPlayerIndex];
        
        Alert.alert(
        'Confirm Player',
        `Are you really ${currentPlayer}?`,
        [
            {
            text: 'No',
            style: 'cancel',
            },
            {
            text: 'Yes',
            onPress: () => flipCard(),
            },
        ]
        );
    };

    const flipCard = () => {
        isFlipped.value = true;
        setCurrentCardFlipped(true);
        // Load any existing response for this player
        const existingResponse = playerResponses[currentPlayerIndex]?.response || '';
        setCurrentResponse(existingResponse);
    };

    const handleResponseChange = (text: string) => {
        setCurrentResponse(text);
        // Update the response in playerResponses immediately
        setPlayerResponses(prev => 
            prev.map((response, index) => 
                index === currentPlayerIndex 
                ? { ...response, response: text }
                : response
            )
        );
    };

    const proceedToNextPlayer = () => {
        // Mark current player as answered and save their response
        setPlayerResponses(prev => 
            prev.map((response, index) => 
                index === currentPlayerIndex 
                ? { ...response, hasAnswered: true, response: currentResponse }
                : response
            )
        );

        if (currentPlayerIndex < players.length - 1) {
            // Reset card and move to next player
            isFlipped.value = false;
            setCurrentCardFlipped(false);
            setCurrentResponse('');
            setTimeout(() => {
                setCurrentPlayerIndex(currentPlayerIndex + 1);
            }, 50);
        } else {
            // All players have answered
            setAllPlayersAnswered(true);
        }
    };

    const startGameplay = () => {
        // Pass all responses to the gameplay screen
        router.push({
          pathname: '/question/question-gameplay',
          params: {
            set,
            gameQuestion: JSON.stringify(gameQuestion),
            spyIndex: spyIndex.toString(),
            players: JSON.stringify(players),
            responses: JSON.stringify(playerResponses)
          }
        });
    };

    const handleBack = () => {
        router.back();
    };

    const currentPlayer = players[currentPlayerIndex];
    const currentPlayerResponse = playerResponses[currentPlayerIndex];

    // Validation: ensure response is not empty
    const canProceed = currentResponse.trim().length > 0;

    if (allPlayersAnswered) {
        return (
          <View style={layoutStyles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
              </TouchableOpacity>
              
              
              <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
              </TouchableOpacity>
            </View>
    
            <View style={combineStyles(layoutStyles.content, layoutStyles.centered)}>
              <Text style={combineStyles(textStyles.h1, styles.readyTitle)}>
                Ready to Compare!
              </Text>
              
              <Text style={combineStyles(textStyles.body, styles.readySubtitle)}>
                Everyone has answered their question. Time to see who got the different question!
              </Text>
    
              <View style={styles.playerSummary}>
                <Text style={textStyles.h4}>Players:</Text>
                {players.map((player, index) => (
                  <View key={index} style={styles.playerSummaryItem}>
                    <Ionicons 
                      name="person-circle-outline" 
                      size={layout.iconSize.sm} 
                      color={colors.primary} 
                    />
                    <Text style={textStyles.body}>{player}</Text>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={layout.iconSize.sm} 
                      color={colors.success} 
                    />
                  </View>
                ))}
              </View>
    
              <Button
                title="START COMPARISON"
                variant="primary"
                size="lg"
                onPress={startGameplay}
                style={styles.startButton}
              />
            </View>
          </View>
        );
    }
    
    return (
        <KeyboardAvoidingView 
            style={layoutStyles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
                </TouchableOpacity>
                
                
                <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                    <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.scrollContent}
                contentContainerStyle={combineStyles(layoutStyles.content, layoutStyles.centered)}
                keyboardShouldPersistTaps="handled"
            >
                {/* Player instruction - smaller when card is flipped */}
                {!currentCardFlipped ? (
                    <>
                        <Text style={combineStyles(textStyles.h1, styles.playerInstruction)}>
                            Give the phone to:
                        </Text>
                        <Text style={combineStyles(textStyles.h1, styles.playerName)}>
                            {currentPlayer}
                        </Text>
                    </>
                ) : (
                    <Text style={combineStyles(textStyles.h4, styles.playerInstructionSmall)}>
                        {currentPlayer}, answer your question:
                    </Text>
                )}

                {/* Progress indicator */}
                <Text style={combineStyles(textStyles.caption, styles.progressText)}>
                    Player {currentPlayerIndex + 1} of {players.length}
                </Text>

                {/* Flip Card */}
                <FlipCard                                               
                    isFlipped={isFlipped}
                    cardStyle={currentCardFlipped ? styles.flipCardSmall : styles.flipCard}
                    FlippedContent={
                        <FlippedContent 
                            question={currentPlayerResponse?.question || ''} 
                            onResponseChange={handleResponseChange}
                            response={currentResponse}
                            isFlipped={currentCardFlipped}
                        />
                    }
                    RegularContent={<RegularContent />}
                    onPress={currentCardFlipped ? () => {} : confirmPlayer}
                />

                {/* Next button - only show after card is flipped and response is entered */}
                {currentCardFlipped && (
                    <Button
                        title={currentPlayerIndex === players.length - 1 ? "FINISH ANSWERING" : "NEXT PLAYER"}
                        variant="primary"
                        size="lg"
                        onPress={proceedToNextPlayer}
                        disabled={!canProceed}
                        style={styles.nextButton}
                    />
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing['3xl'],
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    
    headerButton: {
      padding: spacing.sm,
    },

    playerInstruction: {
        textAlign: 'center',
        marginBottom: spacing.sm,
        color: colors.gray600,
    },

    playerName: {
        textAlign: 'center',
        marginBottom: spacing.md,
        color: colors.primary,
        fontWeight: typography.fontWeight.bold,
    },

    playerInstructionSmall: {
        textAlign: 'center',
        marginBottom: spacing.sm,
        color: colors.primary,
        fontWeight: typography.fontWeight.semibold,
    },

    progressText: {
        textAlign: 'center',
        marginBottom: spacing.lg, // Reduced spacing when card is smaller
        color: colors.gray500,
    },

    scrollContent: {
        flex: 1,
    },

    // Flip card container
    flipCard: {
        width: screenWidth - spacing.lg * 2,
        height: 350,
        marginBottom: spacing.xl,
    },

    // Smaller card when flipped to make room for keyboard
    flipCardSmall: {
        width: screenWidth - spacing.lg * 2,
        height: 280,
        marginBottom: spacing.md,
    },

    pressableContainer: {
        // Ensure the pressable area covers the entire card
    },

    regularCard: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 1,
        backfaceVisibility: 'hidden',
    },

    flippedCard: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 2,
        backfaceVisibility: 'hidden',
    },

    // Card front styling
    cardFront: {
        flex: 1,
        backgroundColor: colors.gray100,
        borderWidth: 2,
        borderColor: colors.gray300,
        borderStyle: 'dashed',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },

    cardIcon: {
        marginBottom: spacing.md,
    },

    cardFrontText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.medium,
        color: colors.gray600,
        textAlign: 'center',
        lineHeight: typography.fontSize.lg * 1.4,
    },

    // Card back styling
    cardBack: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },

    questionLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.gray300,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },

    questionText: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: typography.fontSize.xl * 1.3,
    },

    responseInput: {
        backgroundColor: colors.white,
        borderRadius: 8,
        padding: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.gray800,
        width: '100%',
        minHeight: 80,
        marginBottom: spacing.md,
        textAlignVertical: 'top',
    },

    questionInstruction: {
        fontSize: typography.fontSize.sm,
        color: colors.gray300,
        textAlign: 'center',
        lineHeight: typography.fontSize.sm * 1.4,
    },

    nextButton: {
        width: '100%',
    },

    readyTitle: {
        textAlign: 'center',
        marginBottom: spacing.md,
        color: colors.primary,
    },

    readySubtitle: {
        textAlign: 'center',
        marginBottom: spacing.xl,
        color: colors.gray600,
    },

    playerSummary: {
        width: '100%',
        backgroundColor: colors.gray100,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.xl,
    },

    playerSummaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
        justifyContent: 'space-between',
    },

    startButton: {
        width: '100%',
    },
});