import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { playerStorageService } from '../../lib/playerStorageService';
import { useEffect } from 'react';
import { Alert } from 'react-native'; 

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  createButtonStyle, 
  createButtonTextStyle,
  createInputStyle,
  combineStyles 
} from '../../utils/styles';
import { Button } from '../../components/Button';

export default function WordSetup() {
  const [playerCount, setPlayerCount] = useState(4);
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('Hobbies');
  const [numCards, setNumCards] = useState(8);

  // Constraints for numCards
  const MIN_CARDS = 4;
  const MAX_CARDS = 16;

  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 380;

  useEffect(() => {
    loadSavedPlayers();
  }, []);

  // Go back to the home screen
  const handleBack = () => {
    router.back();
  };

  const handleTheme = async () => {
    // Validate minimum players
    if (players.length < 3) {
      Alert.alert(
        'Not Enough Players', 
        'You need at least 3 players to start the game. Please add more players.',
        [{ text: 'OK' }]
      );
      return;
    }
  
    // Save players before navigating
    if (players.length > 0) {
      await playerStorageService.savePlayers(players);
    }
    
    router.push({
      pathname: '/word/word-theme',
      params: { 
        numCards: numCards.toString(),
        players: JSON.stringify(players),
      }
    });
  };

  const handleAddPlayer = () => {
    if (playerName.trim() && players.length < 8) {
      setPlayers([...players, playerName.trim().toUpperCase()]);
      setPlayerName('');
      setPlayerCount(players.length + 1);
    }
  };

  const handleRemovePlayer = async (index: number) => {
    const playerToRemove = players[index];
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
    setPlayerCount(newPlayers.length);
    
    // Remove from persistent storage as well
    await playerStorageService.removePlayer(playerToRemove);
  };

  const increaseCards = () => {
    if (numCards < MAX_CARDS) {
      setNumCards(numCards + 1);
    }
  };

  const decreaseCards = () => {
    if (numCards > MIN_CARDS) {
      setNumCards(numCards - 1);
    }
  };
  
  const handleAITheme = async () => {
    // Validate minimum players
    if (players.length < 3) {
      Alert.alert(
        'Not Enough Players', 
        'You need at least 3 players to start the game. Please add more players.',
        [{ text: 'OK' }]
      );
      return;
    }
  
    // Save players before navigating
    if (players.length > 0) {
      await playerStorageService.savePlayers(players);
    }
  
    router.push({
      pathname: '/word/word-ai-theme',
      params: { 
        numCards: numCards.toString(),
        players: JSON.stringify(players),
      }
    });
  };

  const loadSavedPlayers = async () => {
    try {
      const savedPlayers = await playerStorageService.getSavedPlayers();
      setPlayers(savedPlayers);
      setPlayerCount(savedPlayers.length);
    } catch (error) {
      console.error('Error loading saved players:', error);
      // If there's an error, start with empty array instead of preset names
      setPlayers([]);
      setPlayerCount(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header - Flat icons without borders/shadows */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons 
            name="arrow-back" 
            size={isSmallScreen ? layout.iconSize.md : layout.iconSize.lg} 
            color={colors.primary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons 
            name="close" 
            size={isSmallScreen ? layout.iconSize.md : layout.iconSize.lg} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={[
          styles.scrollContentContainer,
          isSmallScreen && styles.scrollContentContainerSmall
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Players Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
            ADD PLAYERS
          </Text>
          
          {/* Enhanced Player Input - Bigger text field and plus icon */}
          <View style={[styles.playerInputContainer, isSmallScreen && styles.playerInputContainerSmall]}>
            <TextInput
              style={[
                styles.playerInput,
                isSmallScreen && styles.playerInputSmall
              ]}
              placeholder="Enter player name"
              placeholderTextColor={colors.gray400}
              value={playerName}
              onChangeText={setPlayerName}
              returnKeyType="done"
              onSubmitEditing={handleAddPlayer}
            />
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddPlayer}
              disabled={!playerName.trim() || players.length >= 8}
            >
              <Ionicons 
                name="add-circle" 
                size={isSmallScreen ? layout.iconSize.xl : layout.iconSize['2xl']} 
                color={playerName.trim() && players.length < 8 ? colors.accent : colors.gray300} 
              />
            </TouchableOpacity>
          </View>

          {/* Enhanced Player List with Pills */}
          <View style={[styles.playerList, isSmallScreen && styles.playerListSmall]}>
            {players.map((player, index) => (
              <View key={index} style={[styles.playerPill, isSmallScreen && styles.playerPillSmall]}>
                <View style={styles.playerPillContent}>
                  <Ionicons 
                    name="person-circle" 
                    size={isSmallScreen ? layout.iconSize.md : layout.iconSize.lg} 
                    color={colors.primary} 
                  />
                  <Text style={[styles.playerName, isSmallScreen && styles.playerNameSmall]}>
                    {player}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemovePlayer(index)}
                >
                  <Ionicons 
                    name="close-circle" 
                    size={layout.iconSize.md} 
                    color={colors.gray500} 
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Player count indicator */}
          {players.length > 0 && (
            <Text style={[styles.playerCountText, isSmallScreen && styles.playerCountTextSmall]}>
              {players.length} player{players.length !== 1 ? 's' : ''} added
            </Text>
          )}
        </View>

        {/* Bottom spacer to prevent content hiding behind footer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Footer - Closer to bottom, no borders/shadows */}
      <View style={[styles.footer, isSmallScreen && styles.footerSmall]}>
        {players.length < 3 && (
          <View style={styles.warningContainer}>
            <Ionicons 
              name="information-circle-outline" 
              size={layout.iconSize.sm} 
              color={colors.black} 
            />
            <Text style={[styles.warningText, isSmallScreen && styles.warningTextSmall]}>
              Add at least {3 - players.length} more player{3 - players.length > 1 ? 's' : ''} to continue
            </Text>
          </View>
        )}
        
        <Button
          title="NEXT"
          onPress={handleTheme}
          variant="primary"
          size={isSmallScreen ? "md" : "lg"}
          disabled={players.length < 3}
          style={[
            styles.nextButton,
            players.length < 3 && styles.nextButtonDisabled
          ]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Fixed Header - Clean, flat design without borders
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    // Removed borderBottomWidth and borderBottomColor
  },
  
  headerButton: {
    padding: spacing.sm,
    // Removed borderRadius, backgroundColor, and shadows
  },
  
  // Scrollable Content
  scrollContent: {
    flex: 1,
  },
  
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  
  section: {
    marginBottom: spacing.xl,
  },
  
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  // Enhanced Player Input - Bigger text field
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  
  playerInput: {
    ...createInputStyle('default'),
    flex: 1,
    height: 56, // Bigger input field
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
  },
  
  addButton: {
    padding: spacing.xs,
    // Removed any styling - just the icon
  },
  
  // Enhanced Player List with Pills
  playerList: {
    gap: spacing.md,
  },
  
  playerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface || colors.gray100, // Light background for pills
    borderRadius: 25, // Full pill shape
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  
  playerPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  
  playerName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
    flex: 1,
  },
  
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  
  playerCountText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: typography.fontWeight.medium,
  },
  
  bottomSpacer: {
    height: spacing['6xl'],
  },
  
  // Fixed Footer - Closer to bottom, no borders/shadows
  footer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md, // Reduced bottom padding to bring closer to edge
    paddingTop: spacing.sm, // Reduced top padding
    // Removed borderTopWidth, borderTopColor, and shadows
  },
  
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm, // Reduced margin
    gap: spacing.sm,
  },
  
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.black, // Changed to black text
    fontWeight: typography.fontWeight.medium,
  },
  
  nextButton: {
    width: '100%',
    // Button component handles its own styling - no additional shadow/border changes needed
  },
  
  nextButtonDisabled: {
    opacity: 0.5,
  },
  
  // Responsive Styles for Small Screens
  scrollContentContainerSmall: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  
  sectionTitleSmall: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
  },
  
  playerInputContainerSmall: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  
  playerInputSmall: {
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
  },
  
  playerListSmall: {
    gap: spacing.sm,
  },
  
  playerPillSmall: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  
  playerNameSmall: {
    fontSize: typography.fontSize.base,
  },
  
  playerCountTextSmall: {
    fontSize: typography.fontSize.xs,
  },
  
  footerSmall: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  
  warningTextSmall: {
    fontSize: typography.fontSize.xs,
  },
});