// app/_layout.tsx
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
        {/* Let Expo Router auto-discover all routes */}
      </Stack>
    </GestureHandlerRootView>
  );
}