// app/_layout.tsx (Fixed - No Duplicates)
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
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
        <Stack.Screen name="profile" />
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