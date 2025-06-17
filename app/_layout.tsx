import { Stack } from "expo-router";
import './firebase/firebaseConfig'; // Initialiser Firebase au démarrage
import { RestaurantProvider } from './restaurant/SelectionContext';

export default function RootLayout() {
  return (
    <RestaurantProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="service" options={{ headerShown: false }} />
        <Stack.Screen name="cuisine" options={{ headerShown: false }}/>
        <Stack.Screen name="manageur" options={{ headerShown: false }} />
        <Stack.Screen name="mission" options={{ headerShown: false }}/>
        <Stack.Screen name="connexion" options={{ headerShown: false }}/>
        <Stack.Screen name="Profil" options={{ headerShown: false }}/>
        <Stack.Screen name="restaurant" options={{ headerShown: false }}/>
        <Stack.Screen name="home" options={{ headerShown: false }}/>
      </Stack>
    </RestaurantProvider>
  );
}
