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
import { getRandomWordsFromTheme } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function WordGameplay() {
  const params = useLocalSearchParams();
  const theme = params.theme as string || 'Countries';
  const gameWord = params.gameWord as string || '';
  const spyIndex = parseInt(params.spyIndex as string) || 0;
  const players = JSON.parse(params.players as string || '[]') as string[];
  
  // Get words from params, or fallback to generating new ones if missing
  let words: string[] = [];
  try {
    words = JSON.parse(params.words as string || '[]') as string[];
  } catch (error) {
    console.log('Error parsing words:', error);
  }
  
  const [gameState, setGameState] = useState<'playing' | 'spy_wins' | 'group_wins'>('playing');
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [correctWord, setCorrectWord] = useState<string>(gameWord);
  const [displayWords, setDisplayWords] = useState<string[]>([]);

  // Initialize words on component mount - only run once
  useEffect(() => {
    console.log('Initializing words. Received words:', words);
    
    if (words && words.length > 0) {
      console.log('Using provided words:', words);
      setDisplayWords(words);
    } else {
      // Fallback: generate words from theme if none provided
      console.log('No words provided, generating words from theme:', theme);
      const fallbackWords = getRandomWordsFromTheme(theme, 8);
      console.log('Generated fallback words:', fallbackWords);
      setDisplayWords(fallbackWords);
    }
  }, []); // Empty dependency array to run only once on mount

  const handleBack = () => {
    router.push('/');
  };

  const handleWordPress = (word: string) => {
    if (gameState !== 'playing') return;

    Alert.alert(
      'Make Your Guess',
      'Are you sure this is the word everyone else has?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, I\'m sure',
          onPress: () => makeGuess(word),
        },
      ]
    );
  };

  const makeGuess = (guessedWord: string) => {
    setSelectedWord(guessedWord);
    
    if (guessedWord === correctWord) {
      setGameState('spy_wins');
    } else {
      setGameState('group_wins');
    }
  };

  const getWordButtonStyle = (word: string) => {
    if (gameState === 'playing') {
      return styles.wordButton;
    }
    
    if (word === correctWord) {
      return [styles.wordButton, styles.correctWordButton];
    }
    
    if (word === selectedWord && word !== correctWord) {
      return [styles.wordButton, styles.incorrectWordButton];
    }
    
    return [styles.wordButton, styles.inactiveWordButton];
  };

  const getWordTextStyle = (word: string) => {
    if (gameState === 'playing') {
      return styles.wordButtonText;
    }
    
    if (word === correctWord || (word === selectedWord && word !== correctWord)) {
      return [styles.wordButtonText, styles.resultWordText];
    }
    
    return [styles.wordButtonText, styles.inactiveWordText];
  };

  // Calculate responsive grid layout based on number of words
  const getGridLayout = (wordCount: number) => {
    if (wordCount <= 4) {
      return { wordsPerRow: 2, cardHeight: 100 };
    } else if (wordCount <= 6) {
      return { wordsPerRow: 2, cardHeight: 90 };
    } else if (wordCount <= 8) {
      return { wordsPerRow: 2, cardHeight: 80 };
    } else {
      return { wordsPerRow: 3, cardHeight: 70 };
    }
  };

  const { wordsPerRow, cardHeight } = getGridLayout(displayWords.length);
  const horizontalPadding = spacing.lg;
  const cardSpacing = spacing.sm;
  const totalSpacing = horizontalPadding * 2 + cardSpacing * (wordsPerRow - 1);
  const cardWidth = (screenWidth - totalSpacing) / wordsPerRow;

  // Create rows of words
  const createRows = (words: string[], wordsPerRow: number) => {
    const rows = [];
    for (let i = 0; i < words.length; i += wordsPerRow) {
      rows.push(words.slice(i, i + wordsPerRow));
    }
    return rows;
  };

  const wordRows = createRows(displayWords, wordsPerRow);

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        
        <Text style={textStyles.h2}>
          {gameState === 'playing' && 'DISCUSS'}
          {gameState === 'spy_wins' && 'SPY WINS!'}
          {gameState === 'group_wins' && 'GROUP WINS!'}
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <View style={layoutStyles.content}>
        {/* Game info */}
        {gameState === 'playing' && (
          <View style={styles.gameInfo}>
            <Text style={combineStyles(textStyles.body, styles.gameInfoText)}>
              Theme: {theme}
            </Text>
            <Text style={combineStyles(textStyles.caption, styles.instructionText)}>
              Discuss the words below. The spy should guess the correct word when ready.
            </Text>
          </View>
        )}

        {/* Result info */}
        {gameState !== 'playing' && (
          <View style={styles.resultInfo}>
            <Text style={combineStyles(textStyles.body, styles.resultText)}>
              {gameState === 'spy_wins' 
                ? `The spy correctly guessed "${correctWord}"!`
                : `The spy guessed "${selectedWord}" but the word was "${correctWord}"`
              }
            </Text>
          </View>
        )}

        {/* Words grid */}
        <View style={styles.wordsContainer}>
          {displayWords.length > 0 ? (
            <View style={styles.wordsGrid}>
              {wordRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.wordRow}>
                  {row.map((word, colIndex) => {
                    const wordIndex = rowIndex * wordsPerRow + colIndex;
                    return (
                      <TouchableOpacity
                        key={wordIndex}
                        style={[
                          getWordButtonStyle(word),
                          { width: cardWidth, height: cardHeight }
                        ]}
                        onPress={() => handleWordPress(word)}
                        disabled={gameState !== 'playing'}
                        activeOpacity={0.8}
                      >
                        <Text 
                          style={getWordTextStyle(word)}
                          numberOfLines={2}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {word}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noWordsContainer}>
              <Text style={styles.noWordsText}>Loading words...</Text>
            </View>
          )}
        </View>

        {/* Back to home button - only show after game ends */}
        {gameState !== 'playing' && (
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
  
  headerSpacer: {
    width: layout.iconSize.md,
  },

  gameInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },

  gameInfoText: {
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: typography.fontWeight.semibold,
  },

  instructionText: {
    textAlign: 'center',
    color: colors.gray500,
  },

  resultInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: spacing.lg,
  },

  resultText: {
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
  },

  wordsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  wordsGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  wordRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    width: '100%',
    gap: spacing.sm,
  },

  wordButton: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  correctWordButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },

  incorrectWordButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },

  inactiveWordButton: {
    backgroundColor: colors.gray200,
    borderColor: colors.gray300,
    opacity: 0.6,
  },

  wordButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.2,
  },

  resultWordText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },

  inactiveWordText: {
    color: colors.gray500,
  },

  backButtonContainer: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },

  backButton: {
    width: '100%',
  },

  noWordsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  noWordsText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  debugText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textAlign: 'center',
  },
});