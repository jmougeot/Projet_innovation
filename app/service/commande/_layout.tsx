import { Stack } from "expo-router";

export default function CommandeLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="commande_Table" 
        options={{ 
          headerShown: false,
          title: "Commande Table" 
        }} 
      />
      <Stack.Screen 
        name="encaissement" 
        options={{ 
          headerShown: false,
          title: "Encaissement" 
        }} 
      />
      <Stack.Screen 
        name="map_settings" 
        options={{ 
          headerShown: false,
          title: "Modifier le Plan" 
        }} 
      />
    </Stack>
  );
}
