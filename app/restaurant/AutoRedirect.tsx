import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurantNavigation } from './RestaurantSelectionContext';

interface AutoRedirectProps {
  children?: React.ReactNode;
  loadingMessage?: string;
  showLoading?: boolean;
  requireRestaurant?: boolean; // New prop to require restaurant selection
}

/**
 * Composant qui redirige automatiquement l'utilisateur vers la bonne page
 * basé sur l'état de sélection du restaurant.
 * Peut aussi être utilisé comme guard pour s'assurer qu'un restaurant est sélectionné.
 */
export default function AutoRedirect({ 
  children, 
  loadingMessage = "Chargement...", 
  showLoading = true,
  requireRestaurant = false
}: AutoRedirectProps) {
  const router = useRouter();
  const { isLoading, shouldRedirect, redirectTarget, isRestaurantSelected } = useRestaurantNavigation();

  useEffect(() => {
    if (shouldRedirect && redirectTarget) {
      console.log('🔄 Redirection automatique vers:', redirectTarget);
      router.replace(redirectTarget as any);
    }
  }, [shouldRedirect, redirectTarget, router]);

  // Si requireRestaurant est true, vérifier qu'un restaurant est sélectionné
  const needsRestaurant = requireRestaurant && !isRestaurantSelected;
  const shouldShowLoading = isLoading || shouldRedirect || needsRestaurant;

  if (shouldShowLoading) {
    if (!showLoading) return null;
    
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#194A8D" />
        <Text style={styles.loadingText}>
          {needsRestaurant ? "Vérification du restaurant..." : loadingMessage}
        </Text>
        {shouldRedirect && (
          <Text style={styles.redirectText}>
            Redirection en cours...
          </Text>
        )}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EFEF',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#194A8D',
    textAlign: 'center',
  },
  redirectText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
