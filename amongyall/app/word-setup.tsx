import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
    // TODO: Navigate to game screen
    console.log('Starting Word Chameleon with:', { players, theme: selectedTheme });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Word Chameleon</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>How to play</Text>

        {/* Player Count */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Players: {playerCount}</Text>
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

        {/* Add Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADD PLAYERS</Text>
          <View style={styles.playerInputContainer}>
            <TextInput
              style={styles.playerInput}
              placeholder="Player name"
              value={playerName}
              onChangeText={setPlayerName}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
              <Ionicons name="add-circle-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Player List */}
          <View style={styles.playerList}>
            {players.map((player, index) => (
              <View key={index} style={styles.playerItem}>
                <Ionicons name="person-circle-outline" size={32} color="#333" />
                <Text style={styles.playerName}>{player}</Text>
                <TouchableOpacity onPress={() => handleRemovePlayer(index)}>
                  <Ionicons name="close-circle-outline" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Theme Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Theme</Text>
          <View style={styles.themeList}>
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme}
                style={[
                  styles.themeItem,
                  selectedTheme === theme && styles.themeItemSelected
                ]}
                onPress={() => setSelectedTheme(theme)}
              >
                <Text style={[
                  styles.themeText,
                  selectedTheme === theme && styles.themeTextSelected
                ]}>
                  {theme}
                </Text>
                {selectedTheme === theme && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>START</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  playerCountControls: {
    flexDirection: 'row',
    gap: 10,
  },
  countButton: {
    backgroundColor: '#f0f0f0',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    marginLeft: 10,
    padding: 8,
  },
  playerList: {
    gap: 12,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  themeList: {
    gap: 12,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  themeItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  themeText: {
    fontSize: 16,
    color: '#333',
  },
  themeTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#333',
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});