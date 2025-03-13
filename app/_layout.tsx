import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="service" options={{ headerShown: false }} />
      <Stack.Screen name="cuisine" options={{ headerShown: false }}/>
      <Stack.Screen name="manageur" options={{ headerShown: false }} />
      <Stack.Screen name="mission" options={{ headerShown: false }}/>
      <Stack.Screen name="connexion" options={{ headerShown: false }}/>
    </Stack>
  );
}
