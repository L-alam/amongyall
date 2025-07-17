import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Pressable, SafeAreaView, Alert, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  createButtonStyle, 
  createButtonTextStyle,
  createInputStyle,
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { themes, getRandomWordsFromTheme, getAllThemeNames } from '../../constants/theme';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface PlayerCard {
    playerId: number;
    playerName: string;
    isRevealed: boolean;
    isSpy: boolean;
    word: string;
    hasConfirmed: boolean;
  }

  // FRONT of the card
const RegularContent = () => {
    return (
      <View style={regularContentStyles.card}>
        <Ionicons 
            name="eye-outline" 
            size={48} 
            color={colors.gray400} 
            style={styles.cardIcon}
        />
        <Text style={styles.cardFrontText}>
            Click here to reveal{'\n'}your word
        </Text>
      </View>
    );
  };
  
  
//   const FlippedContent = () => {
//     return (
//         <View style={styles.cardBack}>
//         {isSpy ? (
//           <>
//             <Text style={styles.spyText}>YOU ARE THE</Text>
//             <Text style={styles.spyTitle}>SPY</Text>
//             <Text style={styles.spyInstruction}>
//               Try to blend in with the group{'\n'}
//               Guess the word to win
//             </Text>
//           </>
//         ) : (
//           <>
//             <Text style={styles.wordLabel}>The WORD is:</Text>
//             <Text style={styles.wordText}>{word}</Text>
//             <Text style={styles.wordInstruction}>
//               Make sure to keep this{'\n'}word to yourself
//             </Text>
//           </>
//         )}
//       </View>
//     );
//   };

  const FlippedContent = () => {
    return (
    <View style={styles.cardBack}>
        <>
            <Text style={styles.spyText}>YOU ARE THE</Text>
            <Text style={styles.spyTitle}>SPY</Text>
            <Text style={styles.spyInstruction}>
                Try to blend in with the group{'\n'}
                Guess the word to win
            </Text>
        </>
    </View>
    );
  };
  
  
  const FlipCard = ({
    isFlipped,
    cardStyle,
    direction = 'y',
    duration = 500,
    RegularContent,
    FlippedContent,
    onPress,
  }) => {
    const isDirectionX = direction === 'x';
  
    const regularCardAnimatedStyle = useAnimatedStyle(() => {
      const spinValue = interpolate(Number(isFlipped.value), [0, 1], [0, 180]);
      const rotateValue = withTiming(`${spinValue}deg`, { duration });
  
      return {
        transform: [
          isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
        ],
      };
    });
  
    const flippedCardAnimatedStyle = useAnimatedStyle(() => {
      const spinValue = interpolate(Number(isFlipped.value), [0, 1], [180, 360]);
      const rotateValue = withTiming(`${spinValue}deg`, { duration });
  
      return {
        transform: [
          isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
        ],
      };
    });
  
    return (
      <Pressable onPress={onPress} style={flipCardStyles.pressableContainer}>
        <Animated.View
          style={[
            flipCardStyles.regularCard,
            cardStyle,
            regularCardAnimatedStyle,
          ]}>
          {RegularContent}
        </Animated.View>
        <Animated.View
          style={[
            flipCardStyles.flippedCard,
            cardStyle,
            flippedCardAnimatedStyle,
          ]}>
          {FlippedContent}
        </Animated.View>
      </Pressable>
    );
  };


    const regularContentStyles = StyleSheet.create({
        card: {
        flex: 1,
        backgroundColor: '#b6cff7',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        },
        text: {
        color: '#001a72',
        },
    });


    const flippedContentStyles = StyleSheet.create({
        card: {
        flex: 1,
        backgroundColor: '#baeee5',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        },
        text: {
        color: '#001a72',
        },
    });

  
  const flipCardStyles = StyleSheet.create({
    pressableContainer: {
      // Ensure the pressable area covers the entire card
    },
    regularCard: {
      position: 'absolute',
      zIndex: 1,
    },
    flippedCard: {
      zIndex: 2,
    },
  });

  

export default function WordGameplay() {
    const params = useLocalSearchParams();

    const handleCardPress = () => {
        isFlipped.value = !isFlipped.value;
    };

    const theme = params.theme as string || 'Countries';
    const numCards = parseInt(params.numCards as string) || 8;
    const players = JSON.parse(params.players as string || '[]') as string[];
    const words = JSON.parse(params.words as string || '[]') as string[];

    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
    const [gameWord, setGameWord] = useState('');
    const [spyIndex, setSpyIndex] = useState(-1);
    const [allPlayersRevealed, setAllPlayersRevealed] = useState(false);

    // Reanimated shared value for flip state
    const isFlipped = useSharedValue(false);

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
        isFlipped.value = true;
        
        // Mark current player as revealed
        setPlayerCards(prev => 
        prev.map((card, index) => 
            index === currentPlayerIndex 
            ? { ...card, isRevealed: true, hasConfirmed: true }
            : card
        )
        );
    };

    const proceedToNextPlayer = () => {
        if (currentPlayerIndex < players.length - 1) {
        // Reset flip animation for next player
        isFlipped.value = false;
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
            </View>

            {/* Flip Card */}
            <SafeAreaView style={styles.container}>
                <FlipCard                                               
                isFlipped={isFlipped}
                cardStyle={styles.flipCard}
                FlippedContent={<FlippedContent />}
                RegularContent={<RegularContent />}
                onPress={confirmPlayer} // Pass the press handler
                />

                {/* Next button - only show after card is flipped */}
                {isFlipped.value && (
                <Button
                    title={currentPlayerIndex === players.length - 1 ? "FINISH SETUP" : "NEXT PLAYER"}
                    variant="primary"
                    size="sm"
                    onPress={proceedToNextPlayer}
                    style={styles.nextButton}
                />
                )}
            </SafeAreaView>

        </View>
    )
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
    
    container: {
        flex: 1,
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
      },
      buttonContainer: {
        marginTop: 16,
        justifyContent: 'center',
        alignItems: 'center',
      },
      toggleButton: {
        backgroundColor: '#b58df1',
        padding: 12,
        borderRadius: 48,
      },
      toggleButtonText: {
        color: '#fff',
        textAlign: 'center',
      },
      flipCard: {
        width: 170,
        height: 200,
        backfaceVisibility: 'hidden',
      },
      startButton: {
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
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
    
    //   flipCard: {                                           From First DRAFT
    //     width: screenWidth - spacing.lg * 2,
    //     height: 300,
    //     marginBottom: spacing.xl,
    //     backfaceVisibility: 'hidden',
    //   },
    
      regularCard: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 1,
        backfaceVisibility: 'hidden',
      },
    
      flippedCard: {
        width: '100%',
        height: '100%',
        zIndex: 2,
        backfaceVisibility: 'hidden',
      },
    
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
      
})


