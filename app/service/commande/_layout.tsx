import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="change_plan" options={{ headerShown: false }} />
      <Stack.Screen name="encaissement" options={{ headerShown: false }} />
      <Stack.Screen name="commande_Table" options={{ headerShown: false }} />
    </Stack>
  );
}
