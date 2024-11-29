import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="ajouter_plats" options={{ headerShown: false }} />
      <Stack.Screen name="gestion_menu" options={{ headerShown: false }} />
    </Stack>
  );
}
