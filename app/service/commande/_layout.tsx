import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="change_plan" options={{ headerShown: false }} />
      <Stack.Screen name="encaissement" options={{ headerShown: false }} />
      <Stack.Screen name="commande" options={{ headerShown: false }} />
    </Stack>
  );
}
