import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="pages/AllMissionsPage" options={{ headerShown: false }}/>
      <Stack.Screen name="pages/CreateMissionPage" options={{ headerShown: false }}/>
      <Stack.Screen name="pages/UserMissionsPage" options={{ headerShown: false }}/>
      <Stack.Screen name="index" options={{ headerShown: false }}/>
    </Stack>
  );
}
