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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

  // Calculate layout based on number of words
  const getLayoutConfig = (wordCount: number) => {
    switch (wordCount) {
      case 4:
        return { rows: 2, cols: 2 };
      case 6:
        return { rows: 3, cols: 2 };
      case 8:
        return { rows: 4, cols: 2 };
      case 10:
        return { rows: 5, cols: 2 };
      default:
        return { rows: Math.ceil(wordCount / 2), cols: 2 };
    }
  };

  // Create rows of words based on layout
  const createRows = (words: string[]) => {
    const { cols } = getLayoutConfig(words.length);
    const rows = [];
    for (let i = 0; i < words.length; i += cols) {
      rows.push(words.slice(i, i + cols));
    }
    return rows;
  };

  const wordRows = createRows(displayWords);
  const { rows: totalRows } = getLayoutConfig(displayWords.length);
  
  // Calculate card dimensions
  const containerPadding = spacing.lg;
  const cardSpacing = spacing.md;
  
  // Fixed header heights
  const headerHeight = 80;
  const gameInfoHeight = gameState === 'playing' ? 80 : 60;
  const bottomSectionHeight = gameState !== 'playing' ? 100 : 20;
  
  // Calculate available height for cards
  const availableHeight = screenHeight - headerHeight - gameInfoHeight - bottomSectionHeight - (containerPadding * 2);
  const totalVerticalSpacing = (totalRows - 1) * cardSpacing;
  const cardHeight = Math.max(80, (availableHeight - totalVerticalSpacing) / totalRows);
  
  // Calculate card width
  const cardWidth = (screenWidth - (containerPadding * 2) - cardSpacing) / 2;

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.headerSpacer} />
        
        <Text style={textStyles.h2}>
          {gameState === 'playing' && <Text>DISCUSS</Text>}
          {gameState === 'spy_wins' && <Text>SPY WINS!</Text>}
          {gameState === 'group_wins' && <Text>GROUP WINS!</Text>}
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Game info */}
      {gameState === 'playing' && (
        <View style={[styles.gameInfo, { height: gameInfoHeight }]}>
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
        <View style={[styles.resultInfo, { minHeight: gameInfoHeight }]}>
          <Text style={combineStyles(textStyles.body, styles.resultText)}>
            {gameState === 'spy_wins' 
              ? `The spy correctly guessed "${correctWord}"!`
              : `The spy guessed "${selectedWord}" but the word was "${correctWord}"`
            }
          </Text>
        </View>
      )}

      {/* Words grid */}
      <View style={[styles.wordsContainer, { paddingHorizontal: containerPadding }]}>
        {displayWords.length > 0 ? (
          <View style={styles.wordsGrid}>
            {wordRows.map((row, rowIndex) => (
              <View key={rowIndex} style={[
                styles.wordRow,
                { marginBottom: rowIndex < wordRows.length - 1 ? cardSpacing : 0 }
              ]}>
                {row.map((word, colIndex) => {
                  const wordIndex = rowIndex * 2 + colIndex;
                  return (
                    <TouchableOpacity
                      key={wordIndex}
                      style={[
                        getWordButtonStyle(word),
                        { 
                          width: cardWidth, 
                          height: cardHeight,
                        }
                      ]}
                      onPress={() => handleWordPress(word)}
                      disabled={gameState !== 'playing'}
                      activeOpacity={0.8}
                    >
                      <Text 
                        style={getWordTextStyle(word)}
                        numberOfLines={3}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                      >
                        {word}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {/* Add empty space if odd number of words in last row */}
                {row.length === 1 && (
                  <View style={{ width: cardWidth }} />
                )}
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
        <View style={[styles.backButtonContainer, { height: bottomSectionHeight }]}>
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
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  
  headerSpacer: {
    width: layout.iconSize.md,
  },

  gameInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },

  gameInfoText: {
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.semibold,
  },

  instructionText: {
    textAlign: 'center',
    color: colors.gray500,
  },

  resultInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: spacing.md,
  },

  resultText: {
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
  },

  wordsContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  wordsGrid: {
    flex: 1,
    justifyContent: 'center',
  },

  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  wordButton: {
    backgroundColor: colors.gray600,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray600,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  correctWordButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOpacity: 0.3,
  },

  incorrectWordButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOpacity: 0.3,
  },

  inactiveWordButton: {
    backgroundColor: colors.gray600,
    borderColor: colors.gray600,
    opacity: 0.6,
  },

  wordButtonText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    lineHeight: typography.fontSize.lg * 1.2,
  },

  resultWordText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },

  inactiveWordText: {
    color: colors.gray400,
  },

  backButtonContainer: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
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
});