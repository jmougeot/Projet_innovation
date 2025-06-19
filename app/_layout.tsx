import { Slot } from "expo-router";
import './firebase/firebaseConfig'; // Initialiser Firebase au démarrage

export default function RootLayout() {
  return <Slot />;
}
