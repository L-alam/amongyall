// app/_layout.tsx (Expo Go Safe)
import Constants from 'expo-constants';
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  useEffect(() => {
    // Only initialize AdMob if not in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (!isExpoGo) {
      // This will only run in TestFlight/production builds
      try {
        const mobileAds = require('react-native-google-mobile-ads').default;
        mobileAds()
          .initialize()
          .then((adapterStatuses: any) => {
            console.log('Google Mobile Ads initialized');
          });
      } catch (error) {
        console.warn('Failed to initialize AdMob:', error);
      }
    } else {
      console.log('Running in Expo Go - AdMob disabled');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' },
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/callback" />
        
        {/* Profile sub-screens */}
        <Stack.Screen name="profile/themes" />
        <Stack.Screen name="profile/pairs" />
        <Stack.Screen name="profile/questions" />
        
        {/* Game screens */}
        <Stack.Screen name="word/word-setup" />
        <Stack.Screen name="question/question-setup" />
        <Stack.Screen name="wavelength/wavelength-setup" />
        <Stack.Screen name="word/word-ai-theme" />
      </Stack>
    </GestureHandlerRootView>
  );
}