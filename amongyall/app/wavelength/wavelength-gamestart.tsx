import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, PanGestureHandler, GestureHandlerRootView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  clamp,
} from 'react-native-reanimated';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { getRandomPair, WordPairs } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PlayerGuess {
  playerId: number;
  playerName: string;
  guessPosition: number; // 0-19 position on scale
}

interface GoalZone {
  start: number; // 0-19
  end: number; // 0-19
  center: number; // The exact center for 3 points
}

export default function WavelengthGameStart() {
  const params = useLocalSearchParams();
  const players = JSON.parse(params.players as string || '[]') as string[];
  
  const [gamePhase, setGamePhase] = useState<'clue_giver' | 'group_guessing' | 'reveal'>('clue_giver');
  const [currentClueGiver, setCurrentClueGiver] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [wordPair, setWordPair] = useState<WordPairs | null>(null);
  const [goalZone, setGoalZone] = useState<GoalZone | null>(null);
  const [clue, setClue] = useState('');
  const [playerGuesses, setPlayerGuesses] = useState<PlayerGuess[]>([]);
  const [scores, setScores] = useState<{ [playerName: string]: number }>({});
  const [showScale, setShowScale] = useState(false);

  // Scale dimensions
  const scaleWidth = screenWidth - spacing.lg * 2;
  const scaleHeight = screenHeight * 0.5;
  const notchCount = 20;
  const notchSpacing = scaleHeight / (notchCount - 1);

  // Animated values for draggable guess markers
  const guessPositions = useSharedValue<{ [playerName: string]: number }>({});

  useEffect(() => {
    setupRound();
    initializeScores();
  }, []);

  const setupRound = () => {
    // Get random word pair
    const pair = getRandomPair();
    if (pair) {
      setWordPair(pair);
    }

    // Generate random goal zone (5 consecutive positions out of 20)
    const startPosition = Math.floor(Math.random() * 16); // 0-15 so we can have 5 consecutive
    const newGoalZone: GoalZone = {
      start: startPosition,
      end: startPosition + 4,
      center: startPosition + 2, // Middle of the 5 positions
    };
    setGoalZone(newGoalZone);

    // Initialize player guesses for non-clue-giver players
    const otherPlayers = players.filter((_, index) => index !== currentClueGiver);
    const initialGuesses: PlayerGuess[] = otherPlayers.map((playerName, index) => ({
      playerId: players.indexOf(playerName),
      playerName,
      guessPosition: 10, // Start in middle
    }));
    setPlayerGuesses(initialGuesses);

    // Initialize guess positions for animation
    const initialPositions: { [playerName: string]: number } = {};
    otherPlayers.forEach(playerName => {
      initialPositions[playerName] = scaleHeight / 2; // Middle of scale
    });
    guessPositions.value = initialPositions;
  };

  const initializeScores = () => {
    const initialScores: { [playerName: string]: number } = {};
    players.forEach(playerName => {
      initialScores[playerName] = 0;
    });
    setScores(initialScores);
  };

  const handleRevealScale = () => {
    Alert.alert(
      'Ready to See Your Scale?',
      `Are you ready to see the scale and give your clue, ${players[currentClueGiver]}?`,
      [
        {
          text: 'Not yet',
          style: 'cancel',
        },
        {
          text: 'Yes, show me!',
          onPress: () => setShowScale(true),
        },
      ]
    );
  };

  const handleClueGiven = () => {
    if (!clue.trim()) {
      Alert.alert('Enter a Clue', 'Please provide a one-word clue before continuing.');
      return;
    }
    setGamePhase('group_guessing');
  };

  const handleRevealResults = () => {
    setGamePhase('reveal');
    calculateScores();
  };

  const calculateScores = () => {
    if (!goalZone) return;

    const newScores = { ...scores };
    
    playerGuesses.forEach(guess => {
      const distance = Math.abs(guess.guessPosition - goalZone.center);
      let points = 0;
      
      if (distance === 0) {
        points = 3; // Exact center
      } else if (distance === 1) {
        points = 2; // One position away
      } else if (distance === 2) {
        points = 1; // Two positions away
      }
      
      newScores[guess.playerName] += points;
    });
    
    setScores(newScores);
  };

  const nextRound = () => {
    setCurrentRound(currentRound + 1);
    setCurrentClueGiver((currentClueGiver + 1) % players.length);
    setGamePhase('clue_giver');
    setShowScale(false);
    setClue('');
    setupRound();
  };

  const handleBack = () => {
    router.back();
  };

  const getPositionFromY = (y: number): number => {
    const position = Math.round(y / notchSpacing);
    return clamp(position, 0, notchCount - 1);
  };

  const getYFromPosition = (position: number): number => {
    return position * notchSpacing;
  };

  const createGestureHandler = (playerName: string) => {
    return useAnimatedGestureHandler({
      onStart: (_, context) => {
        context.startY = guessPositions.value[playerName] || scaleHeight / 2;
      },
      onActive: (event, context) => {
        const newY = clamp(context.startY + event.translationY, 0, scaleHeight);
        guessPositions.value = {
          ...guessPositions.value,
          [playerName]: newY,
        };
      },
      onEnd: () => {
        const currentY = guessPositions.value[playerName];
        const snappedPosition = getPositionFromY(currentY);
        const snappedY = getYFromPosition(snappedPosition);
        
        guessPositions.value = {
          ...guessPositions.value,
          [playerName]: withSpring(snappedY),
        };

        // Update the guess position in state
        setPlayerGuesses(prev => 
          prev.map(guess => 
            guess.playerName === playerName 
              ? { ...guess, guessPosition: snappedPosition }
              : guess
          )
        );
      },
    });
  };

  const renderScale = () => {
    if (!wordPair || !goalZone) return null;

    return (
      <View style={styles.scaleContainer}>
        {/* Positive term at top */}
        <Text style={styles.scaleLabel}>{wordPair.positive}</Text>
        
        {/* Scale area */}
        <View style={[styles.scale, { height: scaleHeight }]}>
          {/* Background notches */}
          {Array.from({ length: notchCount }, (_, index) => (
            <View
              key={index}
              style={[
                styles.notch,
                { top: index * notchSpacing },
                // Highlight goal zone if in reveal phase
                gamePhase === 'reveal' && 
                index >= goalZone.start && 
                index <= goalZone.end && 
                styles.goalZoneNotch,
                // Highlight center for 3 points
                gamePhase === 'reveal' && 
                index === goalZone.center && 
                styles.centerNotch,
              ]}
            />
          ))}
          
          {/* Goal zone highlight (only visible to clue giver or in reveal) */}
          {(gamePhase === 'clue_giver' || gamePhase === 'reveal') && (
            <View
              style={[
                styles.goalZoneHighlight,
                {
                  top: goalZone.start * notchSpacing - 10,
                  height: (goalZone.end - goalZone.start + 1) * notchSpacing + 20,
                }
              ]}
            />
          )}

          {/* Player guess markers (only in group guessing and reveal phases) */}
          {gamePhase !== 'clue_giver' && playerGuesses.map((guess, index) => (
            <GestureHandlerRootView key={guess.playerName} style={StyleSheet.absoluteFillObject}>
              <PanGestureHandler
                onGestureEvent={createGestureHandler(guess.playerName)}
                enabled={gamePhase === 'group_guessing'}
              >
                <Animated.View
                  style={[
                    styles.guessMarker,
                    {
                      backgroundColor: colors.secondary,
                      left: 10 + (index * 30), // Offset multiple markers
                    },
                    useAnimatedStyle(() => ({
                      top: guessPositions.value[guess.playerName] || scaleHeight / 2,
                    })),
                  ]}
                >
                  <Text style={styles.guessMarkerText}>
                    {guess.playerName.substring(0, 2)}
                  </Text>
                </Animated.View>
              </PanGestureHandler>
            </GestureHandlerRootView>
          ))}
        </View>
        
        {/* Negative term at bottom */}
        <Text style={styles.scaleLabel}>{wordPair.negative}</Text>
      </View>
    );
  };

  if (gamePhase === 'clue_giver') {
    return (
      <View style={layoutStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={textStyles.h2}>Wavelength</Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={combineStyles(layoutStyles.content, layoutStyles.centered)}>
          {!showScale ? (
            <>
              <Text style={combineStyles(textStyles.h1, styles.playerInstruction)}>
                Give the phone to:
              </Text>
              <Text style={combineStyles(textStyles.h1, styles.playerName)}>
                {players[currentClueGiver]}
              </Text>
              
              <Text style={combineStyles(textStyles.caption, styles.progressText)}>
                Round {currentRound} • Clue Giver
              </Text>

              <View style={styles.instructionCard}>
                <Ionicons 
                  name="radio-outline" 
                  size={48} 
                  color={colors.gray400} 
                  style={styles.cardIcon}
                />
                <Text style={styles.instructionText}>
                  You will see a scale with a highlighted target zone.{'\n'}
                  Give a ONE WORD clue to help others guess the target!
                </Text>
              </View>

              <Button
                title="REVEAL MY SCALE"
                variant="primary"
                size="lg"
                onPress={handleRevealScale}
                style={styles.actionButton}
              />
            </>
          ) : (
            <>
              <Text style={combineStyles(textStyles.h3, styles.clueGiverTitle)}>
                Your Target Zone
              </Text>
              
              {renderScale()}
              
              <View style={styles.clueInputContainer}>
                <Text style={textStyles.h4}>Give your one-word clue:</Text>
                <TouchableOpacity 
                  style={styles.clueInput}
                  onPress={() => {
                    Alert.prompt(
                      'Your Clue',
                      'Enter a one-word clue:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Set Clue', 
                          onPress: (text) => text && setClue(text.trim().toUpperCase())
                        }
                      ],
                      'plain-text',
                      clue
                    );
                  }}
                >
                  <Text style={clue ? styles.clueText : styles.clueInputPlaceholder}>
                    {clue || 'Tap to enter clue'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title="GIVE CLUE TO GROUP"
                variant="primary"
                size="lg"
                onPress={handleClueGiven}
                disabled={!clue.trim()}
                style={styles.actionButton}
              />
            </>
          )}
        </View>
      </View>
    );
  }

  if (gamePhase === 'group_guessing') {
    return (
      <View style={layoutStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={textStyles.h2}>Wavelength</Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={layoutStyles.content}>
          <View style={styles.clueDisplay}>
            <Text style={textStyles.h4}>The clue is:</Text>
            <Text style={styles.displayedClue}>{clue}</Text>
            <Text style={combineStyles(textStyles.caption, styles.instructionText)}>
              Drag your initials to where you think the clue belongs on the scale
            </Text>
          </View>

          {renderScale()}

          <Button
            title="REVEAL RESULTS"
            variant="primary"
            size="lg"
            onPress={handleRevealResults}
            style={styles.actionButton}
          />
        </View>
      </View>
    );
  }

  // Reveal phase
  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>Wavelength</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={layoutStyles.content}>
        <View style={styles.resultsHeader}>
          <Text style={textStyles.h3}>Results for Round {currentRound}</Text>
          <Text style={styles.clueReveal}>Clue: "{clue}"</Text>
        </View>

        {renderScale()}

        <View style={styles.scoresContainer}>
          <Text style={textStyles.h4}>Round Scores:</Text>
          {playerGuesses.map(guess => {
            const distance = Math.abs(guess.guessPosition - (goalZone?.center || 0));
            let points = 0;
            if (distance === 0) points = 3;
            else if (distance === 1) points = 2;
            else if (distance === 2) points = 1;

            return (
              <View key={guess.playerName} style={styles.scoreItem}>
                <Text style={textStyles.body}>{guess.playerName}</Text>
                <Text style={styles.scoreText}>+{points} points</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totalScoresContainer}>
          <Text style={textStyles.h4}>Total Scores:</Text>
          {Object.entries(scores).map(([playerName, score]) => (
            <View key={playerName} style={styles.scoreItem}>
              <Text style={textStyles.body}>{playerName}</Text>
              <Text style={styles.totalScoreText}>{score} points</Text>
            </View>
          ))}
        </View>

        <Button
          title="NEXT ROUND"
          variant="primary"
          size="lg"
          onPress={nextRound}
          style={styles.actionButton}
        />

        <Button
          title="END GAME"
          variant="outline"
          size="lg"
          onPress={handleBack}
          style={[styles.actionButton, { marginTop: spacing.md }]}
        />
      </ScrollView>
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

  instructionCard: {
    backgroundColor: colors.gray100,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },

  cardIcon: {
    marginBottom: spacing.md,
  },

  instructionText: {
    textAlign: 'center',
    color: colors.gray600,
    lineHeight: typography.fontSize.base * 1.4,
  },

  clueGiverTitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.primary,
  },

  scaleContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },

  scaleLabel: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    textAlign: 'center',
    marginVertical: spacing.md,
    minWidth: 200,
  },

  scale: {
    width: 60,
    backgroundColor: colors.gray200,
    borderRadius: 30,
    position: 'relative',
    marginHorizontal: spacing.xl,
  },

  notch: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: colors.gray400,
    left: 0,
  },

  goalZoneNotch: {
    backgroundColor: colors.success,
    height: 3,
  },

  centerNotch: {
    backgroundColor: colors.warning,
    height: 4,
  },

  goalZoneHighlight: {
    position: 'absolute',
    width: 80,
    backgroundColor: colors.success + '30',
    borderRadius: 40,
    left: -10,
    borderWidth: 2,
    borderColor: colors.success,
  },

  guessMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },

  guessMarkerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },

  clueInputContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.lg,
  },

  clueInput: {
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: spacing.lg,
    marginTop: spacing.md,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
  },

  clueText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  clueInputPlaceholder: {
    fontSize: typography.fontSize.base,
    color: colors.gray500,
  },

  clueDisplay: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  displayedClue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginVertical: spacing.sm,
  },

  resultsHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  clueReveal: {
    fontSize: typography.fontSize.lg,
    fontStyle: 'italic',
    color: colors.gray600,
    marginTop: spacing.sm,
  },

  scoresContainer: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },

  totalScoresContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },

  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  scoreText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },

  totalScoreText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  actionButton: {
    width: '100%',
    marginTop: spacing.xl,
  },
});