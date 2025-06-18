import { Slot } from 'expo-router';

// Ce fichier indique à Expo Router que le dossier asyncstorage n'est pas un groupe de routes
// mais un dossier de modules utilitaires.
export default function AsyncStorageLayout() {
  return <Slot />;
}