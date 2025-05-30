import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="AllMissionsPage" options={{ headerShown: false }}/>
      <Stack.Screen name="CreateMissionPage" options={{ headerShown: false }}/>
      <Stack.Screen name="UserMissionsPage" options={{ headerShown: false }}/>
      <Stack.Screen name="ProgressBarDemo" options={{ headerShown: false }}/>
      <Stack.Screen name="index" options={{ headerShown: false }}/>
    </Stack>
  );
}
