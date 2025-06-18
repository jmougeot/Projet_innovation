import { Slot } from 'expo-router';

// Ce fichier indique à Expo Router que le dossier components n'est pas un groupe de routes
// mais un dossier de modules utilitaires.
export default function ComponentsLayout() {
  return <Slot />;
}