import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Alert,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  combineStyles 
} from '../../utils/styles';
import { Button } from '../../components/Button';

const { width: screenWidth } = Dimensions.get('window');

interface PlayerCard {
  playerId: number;
  playerName: string;
  isRevealed: boolean;
  isSpy: boolean;
  word: string;
  hasConfirmed: boolean;
}

export default function WordGameStart() {
  const params = useLocalSearchParams();
  const theme = params.theme as string || 'Countries';
  const numCards = parseInt(params.numCards as string) || 8;
  const players = JSON.parse(params.players as string || '[]') as string[];
  const words = JSON.parse(params.words as string || '[]') as string[];

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
  const [gameWord, setGameWord] = useState('');
  const [spyIndex, setSpyIndex] = useState(-1);
  const [allPlayersRevealed, setAllPlayersRevealed] = useState(false);

  // Animation refs
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  // Initialize game setup
  useEffect(() => {
    setupGame();
  }, []);

  const setupGame = () => {
    // Select random word for this round
    const selectedWord = words[Math.floor(Math.random() * words.length)];
    setGameWord(selectedWord);

    // Randomly select spy
    const randomSpyIndex = Math.floor(Math.random() * players.length);
    setSpyIndex(randomSpyIndex);

    // Initialize player cards
    const cards: PlayerCard[] = players.map((playerName, index) => ({
      playerId: index,
      playerName,
      isRevealed: false,
      isSpy: index === randomSpyIndex,
      word: index === randomSpyIndex ? '' : selectedWord,
      hasConfirmed: false,
    }));

    setPlayerCards(cards);
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
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
      
      // Mark current player as revealed
      setPlayerCards(prev => 
        prev.map((card, index) => 
          index === currentPlayerIndex 
            ? { ...card, isRevealed: true, hasConfirmed: true }
            : card
        )
      );
    });
  };

  const proceedToNextPlayer = () => {
    if (currentPlayerIndex < players.length - 1) {
      // Reset flip animation for next player
      setIsFlipped(false);
      flipAnim.setValue(0);
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      // All players have seen their cards
      setAllPlayersRevealed(true);
    }
  };

  const startGameplay = () => {
    router.push({
      pathname: '/word/word-gameplay',
      params: {
        theme,
        gameWord,
        spyIndex: spyIndex.toString(),
        players: JSON.stringify(players),
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  // Animation interpolations
  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  const currentPlayer = players[currentPlayerIndex];
  const currentCard = playerCards[currentPlayerIndex];

  if (allPlayersRevealed) {
    return (
      <View style={layoutStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={textStyles.h2}>Word Chameleon</Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={combineStyles(layoutStyles.content, layoutStyles.centered)}>
          <Text style={combineStyles(textStyles.h1, styles.readyTitle)}>
            Ready to Play!
          </Text>
          
          <Text style={combineStyles(textStyles.body, styles.readySubtitle)}>
            Everyone has seen their word. The discussion can begin!
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
              </View>
            ))}
          </View>

          <Button
            title="START DISCUSSION"
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
    <View style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>Word Chameleon</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={combineStyles(layoutStyles.content, layoutStyles.centered)}>
        {/* Player instruction */}
        <Text style={combineStyles(textStyles.h1, styles.playerInstruction)}>
          Give the phone to:
        </Text>
        <Text style={combineStyles(textStyles.h1, styles.playerName)}>
          {currentPlayer}
        </Text>

        {/* Progress indicator */}
        <Text style={combineStyles(textStyles.caption, styles.progressText)}>
          Player {currentPlayerIndex + 1} of {players.length}
        </Text>

        {/* Card container */}
        <View style={styles.cardContainer}>
          {/* Front of card */}
          <Animated.View 
            style={[
              styles.card, 
              styles.cardFront, 
              frontAnimatedStyle,
              isFlipped && styles.cardHidden
            ]}
          >
            <TouchableOpacity 
              style={styles.cardTouchable} 
              onPress={confirmPlayer}
              disabled={isFlipped}
            >
              <Ionicons 
                name="eye-outline" 
                size={48} 
                color={colors.gray400} 
                style={styles.cardIcon}
              />
              <Text style={styles.cardFrontText}>
                Click here to reveal{'\n'}your word
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Back of card */}
          <Animated.View 
            style={[
              styles.card, 
              styles.cardBack, 
              backAnimatedStyle,
              !isFlipped && styles.cardHidden
            ]}
          >
            <View style={styles.cardTouchable}>
              {currentCard?.isSpy ? (
                <>
                  <Text style={styles.spyText}>YOU ARE THE</Text>
                  <Text style={styles.spyTitle}>SPY</Text>
                  <Text style={styles.spyInstruction}>
                    Try to blend in with the group{'\n'}
                    Guess the word to win
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.wordLabel}>The WORD is:</Text>
                  <Text style={styles.wordText}>{currentCard?.word}</Text>
                  <Text style={styles.wordInstruction}>
                    Make sure to keep this{'\n'}word to yourself
                  </Text>
                </>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Next button - only show after card is flipped */}
        {isFlipped && (
          <Button
            title={currentPlayerIndex === players.length - 1 ? "FINISH SETUP" : "NEXT PLAYER"}
            variant="primary"
            size="lg"
            onPress={proceedToNextPlayer}
            style={styles.nextButton}
          />
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

  progressText: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.gray500,
  },

  cardContainer: {
    width: screenWidth - spacing.lg * 2,
    height: 300,
    marginBottom: spacing.xl,
  },

  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backfaceVisibility: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  cardFront: {
    backgroundColor: colors.gray100,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderStyle: 'dashed',
  },

  cardBack: {
    backgroundColor: colors.primary,
  },

  cardHidden: {
    opacity: 0,
  },

  cardTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
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

  wordLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray300,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  wordText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  wordInstruction: {
    fontSize: typography.fontSize.sm,
    color: colors.gray300,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.4,
  },

  spyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  spyTitle: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  spyInstruction: {
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
  },

  startButton: {
    width: '100%',
  },
});