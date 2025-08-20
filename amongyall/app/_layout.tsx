import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' },
          gestureEnabled: false,
        }}
      >

        <Stack.Screen name="test" />    
      </Stack>
  );
}

// export default function RootLayout() {
//     return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <StatusBar style="dark" />
//       <Stack
//         screenOptions={{
//           headerShown: false,
//           contentStyle: { backgroundColor: '#ffffff' },
//           gestureEnabled: false,
//         }}
//       >

//         <Stack.Screen name="test" />    
//         <Stack.Screen name="index" />
//         <Stack.Screen name="word/word-setup" />
//         <Stack.Screen name="question/question-setup" />
//         <Stack.Screen name="wavelength/wavelength-setup" />
//         <Stack.Screen name="word/word-ai-theme" />
//       </Stack>
//     </GestureHandlerRootView>
//   );
// }
