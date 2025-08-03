import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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


export default function WavelengthSetup() {
  const [playerCount, setPlayerCount] = useState(4);
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState(['MAX', 'ORLANDO', 'JOHN', 'LABEEB']);
  const [firstPlayerMode, setFirstPlayerMode] = useState<'random' | 'selected'>('random');
  const [selectedFirstPlayer, setSelectedFirstPlayer] = useState('');

  // Go back to the home screen
  const handleBack = () => {
    router.back();
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleNext = () => {
    // Determine who goes first
    let firstPlayer = '';
    if (firstPlayerMode === 'random') {
      firstPlayer = players[Math.floor(Math.random() * players.length)];
    } else {
      firstPlayer = selectedFirstPlayer || players[0];
    }

    router.push({
      pathname: '/wavelength/wavelength-pairs',
      params: {
         players: JSON.stringify(players),
         firstPlayer: firstPlayer,
      }
    })
  }

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
    
    // If the selected first player was removed, reset to first player in list
    if (selectedFirstPlayer === players[index]) {
      setSelectedFirstPlayer(newPlayers.length > 0 ? newPlayers[0] : '');
    }
  };

  const handleFirstPlayerModeChange = (mode: 'random' | 'selected') => {
    setFirstPlayerMode(mode);
    if (mode === 'selected' && !selectedFirstPlayer && players.length > 0) {
      setSelectedFirstPlayer(players[0]);
    }
  };

  return (
    <ScrollView style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBackToHome}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>Wavelength</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={layoutStyles.content}>

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
                size={layout.iconSize.lg} 
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

        {/* First Player Selection */}
        <View style={layoutStyles.section}>
          <Text style={textStyles.h4}>WHO GOES FIRST?</Text>
          
          <View style={styles.firstPlayerModeContainer}>
            <TouchableOpacity
              style={[
                styles.firstPlayerModeButton,
                firstPlayerMode === 'random' && styles.firstPlayerModeButtonSelected
              ]}
              onPress={() => handleFirstPlayerModeChange('random')}
            >
              <Ionicons 
                name="shuffle-outline" 
                size={layout.iconSize.sm} 
                color={firstPlayerMode === 'random' ? colors.secondary : colors.gray500}
              />
              <Text style={[
                styles.firstPlayerModeText,
                firstPlayerMode === 'random' && styles.firstPlayerModeTextSelected
              ]}>
                Random
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.firstPlayerModeButton,
                firstPlayerMode === 'selected' && styles.firstPlayerModeButtonSelected
              ]}
              onPress={() => handleFirstPlayerModeChange('selected')}
            >
              <Ionicons 
                name="person-outline" 
                size={layout.iconSize.sm} 
                color={firstPlayerMode === 'selected' ? colors.secondary : colors.gray500}
              />
              <Text style={[
                styles.firstPlayerModeText,
                firstPlayerMode === 'selected' && styles.firstPlayerModeTextSelected
              ]}>
                Choose
              </Text>
            </TouchableOpacity>
          </View>

          {/* Player Selection Dropdown (only show when 'selected' mode is active) */}
          {firstPlayerMode === 'selected' && (
            <View style={styles.playerSelectionContainer}>
              <Text style={styles.playerSelectionLabel}>Select first player:</Text>
              <View style={styles.playerSelectionList}>
                {players.map((player, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.playerSelectionItem,
                      selectedFirstPlayer === player && styles.playerSelectionItemSelected
                    ]}
                    onPress={() => setSelectedFirstPlayer(player)}
                  >
                    <Ionicons 
                      name={selectedFirstPlayer === player ? "radio-button-on" : "radio-button-off"}
                      size={layout.iconSize.sm} 
                      color={selectedFirstPlayer === player ? colors.secondary : colors.gray400}
                    />
                    <Text style={[
                      styles.playerSelectionText,
                      selectedFirstPlayer === player && styles.playerSelectionTextSelected
                    ]}>
                      {player}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
        
        {/* Next Button */}
        <Button
          title="NEXT"
          variant="primary"
          size="lg"
          onPress={handleNext}
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
  
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl, 
  },
  
  playerCountControls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md, 
  },
  
  countButton: {
    backgroundColor: colors.gray100, 
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countButtonDisabled: {
    backgroundColor: colors.gray200,
    opacity: 0.5,
  },
  
  countButtonText: {
    fontSize: typography.fontSize.xl, 
    fontWeight: typography.fontWeight.bold, 
    color: colors.primary, 
  },

  countButtonTextDisabled: {
    color: colors.gray400,
  },
  
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg, 
    marginTop: spacing.md,
  },
  
  playerInput: {
    ...createInputStyle('default'),
    flex: 1,
  },
  
  addButton: {
    marginLeft: spacing.sm, 
    padding: spacing.sm, 
  },
  
  playerList: {
    gap: spacing.sm, 
  },
  
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm, 
    paddingVertical: spacing.xs, 
  },
  
  playerName: {
    flex: 1,
  },

  // First Player Selection Styles
  firstPlayerModeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  firstPlayerModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },

  firstPlayerModeButtonSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '10',
  },

  firstPlayerModeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray600,
  },

  firstPlayerModeTextSelected: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.semibold,
  },

  // Player Selection Dropdown Styles
  playerSelectionContainer: {
    marginTop: spacing.sm,
  },

  playerSelectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },

  playerSelectionList: {
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: spacing.sm,
    gap: spacing.xs,
  },

  playerSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },

  playerSelectionItemSelected: {
    backgroundColor: colors.secondary + '10',
  },

  playerSelectionText: {
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    flex: 1,
  },

  playerSelectionTextSelected: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
  
  startButton: {
    marginTop: spacing.lg, 
  },
});