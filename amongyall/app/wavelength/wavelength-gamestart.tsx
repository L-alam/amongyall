import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  clamp,
} from 'react-native-reanimated';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { getRandomPair, WordPairs } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


export default function WavelengthGameStart() {
    return (
    <SafeAreaView style={layoutStyles.container}>
        <Text>Wavelength Gamestart</Text>
    </SafeAreaView>
  );
}