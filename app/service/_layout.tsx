import { Stack } from "expo-router";

export default function ServiceLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: "Service" 
        }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          title: "Service - Navigation" 
        }} 
      />
      <Stack.Screen 
        name="commande" 
        options={{ 
          headerShown: false,
          title: "Commandes" 
        }} 
      />
    </Stack>
  );
}
