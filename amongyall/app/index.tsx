import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, spacing, layout, typography } from '../constants/theme';
import { textStyles, layoutStyles, gameStyles, combineStyles } from '../utils/styles';
import { Button } from '../components/Button';

console.log('Index.tsx is rendering');

export default function Index() {

  const handleGameModePress = (gameMode: string) => {
    switch (gameMode) {
      case 'Word Chameleon':
        router.push('/word/word-setup');
        break;
      case 'Question Chameleon':
        router.push('/question/question-setup');
        break;
      case 'WaveLength':
        router.push('/wavelength/wavelength-setup');
        break;
      default:
        console.log(`Selected game mode: ${gameMode}`);
    }
  };

  // SETTINGS
  const handleSettingsPress = () => {
    // TODO: Navigate to settings screen
    console.log('Settings pressed');
  };

  return (
    <View style={layoutStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={layoutStyles.header}>
        <View /> {/* This empty View might be the issue */}
        <Text>Right</Text>
      </View>
      
      <Text>Testing with empty View</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  indexTesting: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }

});