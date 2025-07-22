import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';

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

// FRONT of the player card (shows name)
const PlayerCardFront = ({ playerName }: { playerName: string }) => {
    return (
      <View style={styles.playerCardFront}>
        <Ionicons 
            name="person-circle-outline" 
            size={32} 
            color={colors.primary} 
            style={styles.playerIcon}
        />
        <Text style={styles.playerNameText}>
            {playerName}
        </Text>
        <Text style={styles.tapToRevealText}>
            Tap to reveal answer
        </Text>
      </View>
    );
};

// BACK of the player card (shows response)
const PlayerCardBack = ({ playerName, response }: { playerName: string; response: string }) => {
    return (
        <View style={styles.playerCardBack}>
            <Text style={styles.responsePlayerName}>{playerName}</Text>
            <Text style={styles.responseText}>{response}</Text>
        </View>
    );
};

// Individual Player Flip Card Component
const PlayerFlipCard = ({
    playerName,
    response,
    isRevealed,
    onPress,
    cardStyle,
}: {
    playerName: string;
    response: string;
    isRevealed: boolean;
    onPress: () => void;
    cardStyle: any;
}) => {
    const isFlipped = useSharedValue(false);

    // Update animation when isRevealed changes
    useEffect(() => {
        isFlipped.value = isRevealed;
    }, [isRevealed]);

    const regularCardAnimatedStyle = useAnimatedStyle(() => {
      const spinValue = interpolate(Number(isFlipped.value), [0, 1], [0, 180]);
      const rotateValue = withTiming(`${spinValue}deg`, { duration: 600 });

      return {
        transform: [{ rotateY: rotateValue }],
      };
    });

    const flippedCardAnimatedStyle = useAnimatedStyle(() => {
      const spinValue = interpolate(Number(isFlipped.value), [0, 1], [180, 360]);
      const rotateValue = withTiming(`${spinValue}deg`, { duration: 600 });

      return {
        transform: [{ rotateY: rotateValue }],
      };
    });

    return (
      <Pressable onPress={onPress} style={[cardStyle, styles.pressableContainer]}>
        <Animated.View
          style={[
            styles.regularCard,
            regularCardAnimatedStyle,
          ]}>
          <PlayerCardFront playerName={playerName} />
        </Animated.View>
        <Animated.View
          style={[
            styles.flippedCard,
            flippedCardAnimatedStyle,
          ]}>
          <PlayerCardBack playerName={playerName} response={response} />
        </Animated.View>
      </Pressable>
    );
};

export default function QuestionGameplay() {
  const params = useLocalSearchParams();
  const set = params.set as string || 'Sports';
  const gameQuestion = JSON.parse(params.gameQuestion as string || '{}') as QuestionPair;
  const spyIndex = parseInt(params.spyIndex as string) || 0;
  const players = JSON.parse(params.players as string || '[]') as string[];
  const responses = JSON.parse(params.responses as string || '[]') as PlayerResponse[];
  
  const [revealedCards, setRevealedCards] = useState<boolean[]>(new Array(players.length).fill(false));
  const [allRevealed, setAllRevealed] = useState(false);

  // Check if all cards are revealed
  useEffect(() => {
    const areAllRevealed = revealedCards.every(revealed => revealed);
    setAllRevealed(areAllRevealed);
  }, [revealedCards]);

  const handleBack = () => {
    router.push('/');
  };

  const handleCardPress = (index: number) => {
    if (revealedCards[index]) return; // Already revealed, do nothing

    setRevealedCards(prev => {
      const newRevealed = [...prev];
      newRevealed[index] = true;
      return newRevealed;
    });
  };

  const revealAllCards = () => {
    setRevealedCards(new Array(players.length).fill(true));
  };

  const resetAllCards = () => {
    setRevealedCards(new Array(players.length).fill(false));
  };

  // Calculate grid layout based on number of players
  const getGridLayout = (playerCount: number) => {
    if (playerCount <= 4) {
      return { cardsPerRow: 2, cardHeight: 120 };
    } else {
      // For 5+ players, keep 2 cards per row with medium size
      return { cardsPerRow: 2, cardHeight: 110 };
    }
  };

  const { cardsPerRow, cardHeight } = getGridLayout(players.length);
  const horizontalPadding = spacing.lg;
  const cardSpacing = spacing.sm;
  const totalSpacing = horizontalPadding * 2 + cardSpacing * (cardsPerRow - 1);
  const cardWidth = (screenWidth - totalSpacing) / cardsPerRow;

  // Create rows of players
  const createRows = (playerResponses: PlayerResponse[], cardsPerRow: number) => {
    const rows = [];
    for (let i = 0; i < playerResponses.length; i += cardsPerRow) {
      rows.push(playerResponses.slice(i, i + cardsPerRow));
    }
    return rows;
  };

  const playerRows = createRows(responses, cardsPerRow);

  // Get the majority question (normal question)
  const majorityQuestion = gameQuestion.normal;

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>???? Chameleon</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={layoutStyles.content}>
        {/* Question Display */}
        <View style={styles.questionContainer}>
          <Text style={textStyles.h4}>The question was:</Text>
          <Text style={styles.questionText}>{majorityQuestion}</Text>
          <Text style={combineStyles(textStyles.caption, styles.instructionText)}>
            Tap each card to reveal answers. Find who got a different question!
          </Text>
        </View>

        {/* Player Cards Grid */}
        <ScrollView 
          style={styles.cardsContainer}
          contentContainerStyle={styles.cardsContent}
          showsVerticalScrollIndicator={false}
        >
          {playerRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.cardRow}>
              {row.map((playerResponse, colIndex) => {
                const playerIndex = rowIndex * cardsPerRow + colIndex;
                return (
                  <PlayerFlipCard
                    key={playerResponse.playerId}
                    playerName={playerResponse.playerName}
                    response={playerResponse.response}
                    isRevealed={revealedCards[playerIndex]}
                    onPress={() => handleCardPress(playerIndex)}
                    cardStyle={[
                      styles.playerCard,
                      { width: cardWidth, height: cardHeight }
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {!allRevealed ? (
            <Button
              title="Reveal All"
              variant="outline"
              size="md"
              icon="eye-outline"
              onPress={revealAllCards}
              style={styles.controlButton}
            />
          ) : (
            <Button
              title="Hide All"
              variant="outline"
              size="md"
              icon="eye-off-outline"
              onPress={resetAllCards}
              style={styles.controlButton}
            />
          )}
        </View>

        {/* Back to home button - show when discussion is done */}
        {allRevealed && (
          <View style={styles.backButtonContainer}>
            <Button
              title="Back to Home"
              variant="primary"
              size="lg"
              icon="home-outline"
              onPress={handleBack}
              style={styles.backButton}
            />
          </View>
        )}
      </View>
    </View>
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

  questionContainer: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },

  questionText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.lg * 1.4,
  },

  instructionText: {
    textAlign: 'center',
    color: colors.gray500,
  },

  cardsContainer: {
    flex: 1,
  },

  cardsContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    width: '100%',
    gap: spacing.sm,
  },

  playerCard: {
    // Width and height set dynamically
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

  // Player card front styling
  playerCardFront: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  playerIcon: {
    marginBottom: spacing.xs,
  },

  playerNameText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  tapToRevealText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textAlign: 'center',
  },

  // Player card back styling
  playerCardBack: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  responsePlayerName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
    opacity: 0.9,
  },

  responseText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.2,
  },

  controlsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  controlButton: {
    minWidth: 120,
  },

  backButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  backButton: {
    width: '100%',
  },
});