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
        <Stack.Screen name="word-setup" />
        <Stack.Screen name="question-setup" />
        <Stack.Screen name="wavelength-setup" />
        <Stack.Screen name="word/word-ai-theme" />
      </Stack>
    </GestureHandlerRootView>
  );
}
