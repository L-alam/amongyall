import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '../../components/Button';
import { colors, layout, spacing, typography } from '../../constants/theme';
import {
  combineStyles,
  layoutStyles,
  textStyles,
} from '../../utils/styles';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useInterstitialAd } from '../../components/InterstitialAd';

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
const PlayerCardBack = ({ playerName, response, isSpy }: { playerName: string; response: string; isSpy: boolean }) => {
    return (
        <View style={[styles.playerCardBack, isSpy && styles.spyCardBack]}>
            <Text style={styles.responsePlayerName}>{playerName}</Text>
            <Text style={styles.responseText}>{response}</Text>
        </View>
    );
};

// Individual Player Flip Card Component
const PlayerFlipCard = ({
    playerName,
    response,
    isSpy,
    isRevealed,
    onPress,
    cardStyle,
}: {
    playerName: string;
    response: string;
    isSpy: boolean;
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
          <PlayerCardBack playerName={playerName} response={response} isSpy={isSpy} />
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
  const [showImposterReveal, setShowImposterReveal] = useState(false);
  const [imposterRevealed, setImposterRevealed] = useState(false);

  const { showAd } = useInterstitialAd();

  // Find the spy player
  const spyPlayer = responses.find(response => response.isSpy);

  // Check if all cards are revealed
  useEffect(() => {
    const areAllRevealed = revealedCards.every(revealed => revealed);
    setAllRevealed(areAllRevealed);
  }, [revealedCards]);

  const handleBack = () => {
    router.push('/');
  };

  const handleGoBackHome = () => {
    // Show interstitial ad before going home
    showAd(() => {
      // This callback runs after ad closes
      router.push('/'); // Navigate to home
    });
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

  const handleRevealImposter = () => {
    Alert.alert(
      'Reveal Imposter',
      'Are you sure you\'re ready to reveal who the imposter is and end the game?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reveal',
          style: 'destructive',
          onPress: () => setShowImposterReveal(true),
        },
      ]
    );
  };

  const closeImposterReveal = () => {
    setShowImposterReveal(false);
    setImposterRevealed(true);
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
  
  // Use the same padding for everything to align all elements
  const containerPadding = spacing.lg;
  const cardSpacing = spacing.sm;
  const totalSpacing = cardSpacing * (cardsPerRow - 1);
  const cardWidth = (screenWidth - (containerPadding * 2) - totalSpacing) / cardsPerRow;

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
  const spyQuestion = gameQuestion.spy;

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      

        
        <TouchableOpacity style={styles.headerButton} onPress={handleGoBackHome}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Player Cards Grid */}
      <ScrollView 
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Display */}
        <View style={styles.questionContainer}>
          <Text style={textStyles.body}>The question was:</Text>
          <Text style={styles.questionText}>{majorityQuestion}</Text>
          <Text style={combineStyles(textStyles.caption, styles.instructionText)}>
            Tap each card to reveal answers. Find who got a different question!
          </Text>
        </View>

        {playerRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.cardRow}>
            {row.map((playerResponse, colIndex) => {
              const playerIndex = rowIndex * cardsPerRow + colIndex;
              return (
                <PlayerFlipCard
                  key={playerResponse.playerId}
                  playerName={playerResponse.playerName}
                  response={playerResponse.response}
                  isSpy={playerResponse.isSpy && imposterRevealed}
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
        ) : !imposterRevealed ? (
          <Button
            title="Reveal Imposter"
            variant="outline"
            size="md"
            icon="person-outline"
            onPress={handleRevealImposter}
            style={styles.controlButton}
          />
        ) : null}
      </View>

      {/* Back to home button - show when imposter is revealed */}
      {imposterRevealed && (
        <View style={styles.backButtonContainer}>
          <Button
            title="Back to Home"
            variant="primary"
            size="md"
            icon="home-outline"
            onPress={handleGoBackHome}
            style={styles.backButton}
          />
        </View>
      )}

      {/* Imposter Reveal Modal */}
      <Modal
        visible={showImposterReveal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImposterReveal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons 
                name="person-circle" 
                size={48} 
                color={colors.error} 
                style={styles.modalIcon}
              />
              <Text style={styles.modalTitle}>Imposter Revealed!</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.imposterName}>
                {spyPlayer?.playerName || 'Unknown'}
              </Text>
              <Text style={styles.modalDescription}>
                Their question was:
              </Text>
              <Text style={styles.spyQuestionText}>
                "{spyQuestion}"
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={closeImposterReveal}
            >
              <Text style={styles.modalCloseText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: spacing.sm,
  },
  
  headerButton: {
    padding: spacing.sm,
  },

  questionContainer: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },

  questionText: {
    fontSize: typography.fontSize.xl,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    width: '100%',
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

  spyCardBack: {
    backgroundColor: colors.error,
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
    paddingVertical: spacing.sm, // Reduce from spacing.md
    alignItems: 'center',
    marginBottom: spacing.sm, // Reduce from spacing.md
  },

  controlButton: {
    width: '100%',
  },

  backButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md, // Reduce from spacing.lg
    paddingTop: 0, // Remove any top padding
  },
  

  backButton: {
    width: '100%',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl, // Add vertical padding to prevent edge touching
  },

  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 350, // Reduce from 400 to make it more centered visually
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Add these for better centering:
    marginHorizontal: 'auto',
    alignSelf: 'center',
  },
  

  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  modalIcon: {
    marginBottom: spacing.md,
  },

  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    textAlign: 'center',
  },

  modalBody: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  imposterName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  modalDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  spyQuestionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray800,
    textAlign: 'center',
    backgroundColor: colors.gray100,
    padding: spacing.md,
    borderRadius: 8,
    fontStyle: 'italic',
  },

  modalCloseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    minWidth: 120,
  },

  modalCloseText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
});