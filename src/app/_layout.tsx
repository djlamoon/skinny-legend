import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.cherry,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Skinny Legend' }} />
        <Stack.Screen name="snap" options={{ title: 'Snap it' }} />
        <Stack.Screen name="confirm" options={{ title: 'Spill the tea' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}
