import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, spacing, layout, typography } from '../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  createButtonStyle, 
  createButtonTextStyle,
  createInputStyle,
  combineStyles 
} from '../utils/styles';
import { Button } from '../components/Button';


export default function WordSetup() {
  const [playerCount, setPlayerCount] = useState(4);
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState(['MAX', 'ORLANDO', 'JOHN', 'POUYA']);
  const [selectedTheme, setSelectedTheme] = useState('Hobbies');

  const themes = ['Drinks', 'Hobbies', 'Room', 'Vegetables', 'Sports'];

  const handleBack = () => {
    router.back();
  };

  const handleAddPlayer = () => {
    if (playerName.trim() && players.length < 8) {
      setPlayers([...players, playerName.trim().toUpperCase()]);
      setPlayerName('');
      setPlayerCount(players.length + 1);
    }
  };

  const handleRemovePlayer = (index: number) => {
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
    setPlayerCount(newPlayers.length);
  };

  const handleStart = () => {
    console.log('Starting Word Chameleon with:', { players, theme: selectedTheme });
  };

  return (
    <ScrollView style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h4}>Word Chameleon</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={layoutStyles.content}>
        <Text style={combineStyles(textStyles.bodySmall, styles.subtitle)}>
          How to play
        </Text>

        {/* Player Count Section */}
        <View style={layoutStyles.section}>
          <Text style={textStyles.h4}>Players: {playerCount}</Text>
          <View style={styles.playerCountControls}>
            <TouchableOpacity 
              style={styles.countButton}
              onPress={() => setPlayerCount(Math.max(3, playerCount - 1))}
            >
              <Text style={styles.countButtonText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.countButton}
              onPress={() => setPlayerCount(Math.min(8, playerCount + 1))}
            >
              <Text style={styles.countButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Players Section */}
        <View style={layoutStyles.section}>
          <Text style={textStyles.h4}>ADD PLAYERS</Text>
          
          <View style={styles.playerInputContainer}>
            <TextInput
              style={styles.playerInput}
              placeholder="Player name"
              placeholderTextColor={colors.gray400}
              value={playerName}
              onChangeText={setPlayerName}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
              <Ionicons 
                name="add-circle-outline" 
                size={layout.iconSize.md} 
                color={colors.gray500} 
              />
            </TouchableOpacity>
          </View>

          {/* Player List */}
          <View style={styles.playerList}>
            {players.map((player, index) => (
              <View key={index} style={styles.playerItem}>
                <Ionicons 
                  name="person-circle-outline" 
                  size={layout.iconSize.xl} 
                  color={colors.primary} 
                />
                <Text style={combineStyles(textStyles.body, styles.playerName)}>
                  {player}
                </Text>
                <TouchableOpacity onPress={() => handleRemovePlayer(index)}>
                  <Ionicons 
                    name="close-circle-outline" 
                    size={layout.iconSize.sm} 
                    color={colors.gray400} 
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Theme Selection */}
        <View style={layoutStyles.section}>
          <Text style={textStyles.h4}>Choose Theme</Text>
          <View style={styles.themeList}>
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme}
                style={combineStyles(
                  styles.themeItem,
                  selectedTheme === theme && styles.themeItemSelected
                )}
                onPress={() => setSelectedTheme(theme)}
              >
                <Text style={combineStyles(
                  textStyles.body,
                  selectedTheme === theme && styles.themeTextSelected
                )}>
                  {theme}
                </Text>
                {selectedTheme === theme && (
                  <Ionicons 
                    name="checkmark" 
                    size={layout.iconSize.sm} 
                    color={colors.secondary} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Button using our Button component */}
        <Button
          title="START"
          variant="primary"
          size="lg"
          onPress={handleStart}
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
    paddingTop: spacing['3xl'], // Was: paddingTop: 60
    paddingHorizontal: spacing.lg, // Was: paddingHorizontal: 20
    paddingBottom: spacing.lg, // Was: paddingBottom: 20
  },
  
  headerButton: {
    padding: spacing.sm, // Was: padding: 8
  },
  
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl, // Was: marginBottom: 30
  },
  
  playerCountControls: {
    flexDirection: 'row',
    gap: spacing.sm, // Was: gap: 10
    marginTop: spacing.md, // Added for better spacing
  },
  
  countButton: {
    backgroundColor: colors.gray100, // Was: backgroundColor: '#f0f0f0'
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  countButtonText: {
    fontSize: typography.fontSize.xl, // Was: fontSize: 20
    fontWeight: typography.fontWeight.bold, // Was: fontWeight: 'bold'
    color: colors.primary, // Was: color: '#333'
  },
  
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg, // Was: marginBottom: 20
    marginTop: spacing.md, // Added for consistency
  },
  
  playerInput: {
    ...createInputStyle('default'), // Using our input factory!
    flex: 1,
  },
  
  addButton: {
    marginLeft: spacing.sm, // Was: marginLeft: 10
    padding: spacing.sm, // Was: padding: 8
  },
  
  playerList: {
    gap: spacing.sm, // Was: gap: 12
  },
  
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm, // Was: gap: 12
    paddingVertical: spacing.xs, // Added for better touch targets
  },
  
  playerName: {
    flex: 1,
    // fontSize and color now come from textStyles.body
  },
  
  themeList: {
    gap: spacing.sm, // Was: gap: 12
    marginTop: spacing.md, // Added for consistency
  },
  
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md, // Was: paddingVertical: 15
    paddingHorizontal: spacing.lg, // Was: paddingHorizontal: 20
    borderWidth: 1,
    borderColor: colors.gray300, // Was: borderColor: '#ddd'
    borderRadius: 8,
  },
  
  themeItemSelected: {
    borderColor: colors.secondary, // Was: borderColor: '#007AFF'
    backgroundColor: colors.secondary + '10', // Was: backgroundColor: '#f0f8ff'
  },
  
  themeTextSelected: {
    color: colors.secondary, // Was: color: '#007AFF'
    fontWeight: typography.fontWeight.semibold, // Was: fontWeight: '600'
  },
  
  startButton: {
    marginTop: spacing.lg, // Was: marginTop: 20
  },
});