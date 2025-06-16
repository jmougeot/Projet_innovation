import { Stack } from "expo-router";
import './firebase/firebaseConfig'; // Initialiser Firebase au démarrage
import { RestaurantSelectionProvider } from './restaurant/RestaurantSelectionContext';
import RestaurantChangeNotification from './restaurant/components/RestaurantChangeNotification';

export default function RootLayout() {
  return (
    <RestaurantSelectionProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="service" options={{ headerShown: false }} />
        <Stack.Screen name="cuisine" options={{ headerShown: false }}/>
        <Stack.Screen name="manageur" options={{ headerShown: false }} />
        <Stack.Screen name="mission" options={{ headerShown: false }}/>
        <Stack.Screen name="connexion" options={{ headerShown: false }}/>
        <Stack.Screen name="Profil" options={{ headerShown: false }}/>
        <Stack.Screen name="restaurant" options={{ headerShown: false }}/>
      </Stack>
      <RestaurantChangeNotification />
    </RestaurantSelectionProvider>
  );
}
