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
  const [gameQuestions, setGameQuestions] = useState(["How old is your best friend?", "How many bones have you broken?"])

  const sets = ['Sports', 'Food', 'Music', 'Movies', 'Random'];

  // Go back to the home screen
  const handleBack = () => {
    router.back();
  };

  const handleSet = () => {
    router.push({
      pathname: '/question/question-set',
      params: {
         players: JSON.stringify(players),
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
  };


  return (
    <ScrollView style={layoutStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>???? Chameleon</Text>
        
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
        
        {/* Start Button using our Button component */}
        <Button
          title="NEXT"
          variant="primary"
          size="lg"
          onPress={handleSet}
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
    ...createInputStyle('default'), // Using our input factory!
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
  
  startButton: {
    marginTop: spacing.lg, 
  },
});