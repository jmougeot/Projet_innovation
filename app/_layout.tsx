import { Slot } from "expo-router";
import './firebase/firebaseConfig'; // Initialiser Firebase au démarrage
import { RestaurantProvider } from './contexts/RestaurantContext';

export default function RootLayout() {
  return (
    <RestaurantProvider>
      <Slot />
    </RestaurantProvider>
  );
}
