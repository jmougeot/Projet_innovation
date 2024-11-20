import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="change_plan" options={{ headerShown: false }} />
      <Stack.Screen name="test" options={{ headerShown: false }} />
      <Stack.Screen name="commande" options={{ headerShown: false }} />
    </Stack>
  );
}
