// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import mobileAds from 'react-native-google-mobile-ads';

export default function RootLayout() {
  useEffect(() => {
    // Initialize Google Mobile Ads
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        // Initialization complete!
        console.log('Google Mobile Ads initialized');
      });
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