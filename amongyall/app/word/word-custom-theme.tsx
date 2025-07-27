import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  createInputStyle,
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';

export default function WordCustomTheme() {
  const params = useLocalSearchParams();
  const numCards = parseInt(params.numCards as string) || 8;
  const players = JSON.parse(params.players as string || '[]');
  
  const [themeName, setThemeName] = useState('');
  const [words, setWords] = useState<string[]>(Array(numCards).fill(''));
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const handleBack = () => {
    router.back();
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
  };

  const addWord = () => {
    if (words.length < 20) { // Maximum limit
      setWords([...words, '']);
    }
  };

  const removeWord = (index: number) => {
    if (words.length > 4) { // Minimum limit
      const newWords = words.filter((_, i) => i !== index);
      setWords(newWords);
    }
  };

  const validateAndStartGame = () => {
    // Validate theme name
    if (!themeName.trim()) {
      Alert.alert('Error', 'Please enter a theme name.');
      return;
    }

    // Validate words
    const filledWords = words.filter(word => word.trim() !== '');
    if (filledWords.length < 4) {
      Alert.alert('Error', 'Please enter at least 4 words.');
      return;
    }

    // Navigate to game start with custom theme
    router.push({
      pathname: '/word/word-gamestart',
      params: {
        theme: themeName.trim(),
        numCards: filledWords.length.toString(),
        players: JSON.stringify(players),
        words: JSON.stringify(filledWords)
      }
    });
  };

  const handleAIAssistance = () => {
    router.push({
      pathname: '/word/word-ai-theme',
      params: {
        numCards: words.length.toString(),
        players: JSON.stringify(players),
        themeName: themeName,
        existingWords: JSON.stringify(words.filter(word => word.trim() !== ''))
      }
    });
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save theme:', { themeName, words: words.filter(word => word.trim() !== '') });
  };

  const filledWordsCount = words.filter(word => word.trim() !== '').length;

  return (
    <ScrollView style={layoutStyles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>Custom Theme</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={layoutStyles.content}>
        
        {/* Theme Name Section */}
        <View style={layoutStyles.section}>
          <Text style={textStyles.h4}>Theme Name</Text>
          <TextInput
            style={styles.themeNameInput}
            placeholder="Enter your theme name..."
            placeholderTextColor={colors.gray400}
            value={themeName}
            onChangeText={setThemeName}
            maxLength={30}
          />
        </View>

        {/* Words Section */}
        <View style={layoutStyles.section}>
          <View style={styles.wordsHeader}>
            <Text style={textStyles.h4}>Words ({filledWordsCount}/{words.length})</Text>
            <View style={styles.wordControls}>
              <TouchableOpacity 
                style={[
                  styles.controlButton,
                  words.length >= 20 && styles.controlButtonDisabled
                ]}
                onPress={addWord}
                disabled={words.length >= 20}
              >
                <Ionicons 
                  name="add" 
                  size={layout.iconSize.sm} 
                  color={words.length >= 20 ? colors.gray400 : colors.primary} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.controlButton,
                  words.length <= 4 && styles.controlButtonDisabled
                ]}
                onPress={() => removeWord(words.length - 1)}
                disabled={words.length <= 4}
              >
                <Ionicons 
                  name="remove" 
                  size={layout.iconSize.sm} 
                  color={words.length <= 4 ? colors.gray400 : colors.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.wordsHint}>
            Enter at least 4 words. Maximum 20 words.
          </Text>

          {/* Word Input Fields */}
          <View style={styles.wordsList}>
            {words.map((word, index) => (
              <View key={index} style={styles.wordInputContainer}>
                <Text style={styles.wordNumber}>{index + 1}.</Text>
                <TextInput
                  style={styles.wordInput}
                  placeholder={`Word ${index + 1}`}
                  placeholderTextColor={colors.gray400}
                  value={word}
                  onChangeText={(value) => handleWordChange(index, value)}
                  maxLength={25}
                />
                {words.length > 4 && (
                  <TouchableOpacity 
                    style={styles.removeWordButton}
                    onPress={() => removeWord(index)}
                  >
                    <Ionicons 
                      name="close-circle" 
                      size={layout.iconSize.sm} 
                      color={colors.gray400} 
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Save"
            variant="ghost"
            size="sm"
            icon="bookmark-outline"
            onPress={handleSave}
            style={styles.saveButton}
          />
          
          <Button
            title="Use AI Assistance"
            variant="outline"
            size="md"
            icon="sparkles-outline"
            onPress={handleAIAssistance}
            style={styles.aiButton}
          />
        </View>

        {/* Start Button */}
        <Button
          title="START GAME"
          variant="primary"
          size="lg"
          onPress={validateAndStartGame}
          disabled={!themeName.trim() || filledWordsCount < 4}
          style={styles.startButton}
        />
      </View>
    </ScrollView>
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

  themeNameInput: {
    ...createInputStyle('default'),
    marginTop: spacing.md,
  },

  wordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  wordControls: {
    flexDirection: 'row',
    gap: spacing.xs,
  },

  controlButton: {
    backgroundColor: colors.gray100,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  controlButtonDisabled: {
    backgroundColor: colors.gray200,
    opacity: 0.5,
  },

  wordsHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  wordsList: {
    gap: spacing.sm,
  },

  wordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  wordNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray600,
    width: 24,
  },

  wordInput: {
    ...createInputStyle('default'),
    flex: 1,
  },

  removeWordButton: {
    padding: spacing.xs,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  saveButton: {
    minWidth: 80,
  },

  aiButton: {
    flex: 1,
    marginLeft: spacing.md,
  },

  startButton: {
    marginBottom: spacing.xl,
  },
});