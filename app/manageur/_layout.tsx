import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="gestion_service" options={{ headerShown: false }} />
      <Stack.Screen name="gestion_menu" options={{ headerShown: false }} />
      <Stack.Screen name="gestion_cuisine" options={{ headerShown: false }} />
      <Stack.Screen name="gestion" options={{ headerShown: false }}/>

    </Stack>
  );
}
