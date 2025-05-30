import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="connexion" options={{ headerShown: false }} />
      <Stack.Screen name="inscription" options={{ headerShown: false }} />
    </Stack>
  );
}