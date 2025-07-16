import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false, // Hide the default header for all screens
          contentStyle: { backgroundColor: '#ffffff' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="word-setup" />
        <Stack.Screen name="question-setup" />
        <Stack.Screen name="wavelength-setup" />
      </Stack>
    </>
  );
}
