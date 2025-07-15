import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {

  // GAME MODE
  const handleGameModePress = (gameMode: string) => {
    // TODO: Navigate to game setup screen
    console.log(`Selected game mode: ${gameMode}`);
  };

  const handleSettingsPress = () => {
    // TODO: Navigate to settings screen
    console.log('Settings pressed');
  };



  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header with settings icon */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#333" />
        </View>

        {/* App title */}
        <Text style={styles.title}>AMONGYALL</Text>

        {/* Game mode selection text */}
        <Text style={styles.subtitle}>Select a game mode:</Text>

        {/* Game mode buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.gameButton} 
            onPress={() => handleGameModePress('Word Chameleon')}
          >
            <Ionicons name="chatbox-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Word Chameleon</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gameButton} 
            onPress={() => handleGameModePress('Question Chameleon')}
          >
            <Ionicons name="help-circle-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Question Chameleon</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gameButton} 
            onPress={() => handleGameModePress('WaveLength')}
          >
            <Ionicons name="radio-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>WaveLength</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 60, // Account for status bar
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80, // Give some space at bottom
  },
  logoContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 60,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  gameButton: {
    backgroundColor: '#333333',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});