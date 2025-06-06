import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Page d'accueil du module connexion.
 * Cette page redirige automatiquement vers la page de connexion
 */
export default function ConnexionIndex() {
  // Rediriger vers la page de connexion
  return <Redirect href="/connexion/connexion" />;
}