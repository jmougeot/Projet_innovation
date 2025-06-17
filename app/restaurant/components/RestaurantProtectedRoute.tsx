import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRestaurant } from '../SelectionContext';
import Header from '@/app/components/Header';

interface RestaurantProtectedRouteProps {
  children: ReactNode;
  fallbackRoute?: string;
  loadingMessage?: string;
}

/**
 * Composant qui protège une route en s'assurant qu'un restaurant est sélectionné
 */
export default function RestaurantProtectedRoute({
  children,
  fallbackRoute = '/restaurant/select',
  loadingMessage = 'Vérification des accès...'
}: RestaurantProtectedRouteProps) {
  const router = useRouter();
  const { user, currentRestaurant, isUserConnected, isConnectedToRestaurant, isLoading } = useRestaurant();

  // Redirection automatique si pas connecté
  React.useEffect(() => {
    if (!isLoading) {
      if (!isUserConnected) {
        // Use setTimeout to defer navigation until after render
        setTimeout(() => {
          router.replace('/connexion' as any);
        }, 0);
      } else if (isUserConnected && !currentRestaurant) {
        // Use setTimeout to defer navigation until after render
        setTimeout(() => {
          router.replace(fallbackRoute as any);
        }, 0);
      }
    }
  }, [isLoading, isUserConnected, currentRestaurant, router, fallbackRoute]);

  // Affichage du loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Chargement" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Si pas connecté, ne pas afficher le contenu
  if (!isUserConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Connexion requise" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="lock" size={64} color="#DDD" />
          <Text style={styles.errorTitle}>Connexion requise</Text>
          <Text style={styles.errorText}>
            Vous devez être connecté pour accéder à cette page
          </Text>
          <Pressable style={styles.actionButton} onPress={() => router.replace('/connexion' as any)}>
            <LinearGradient colors={['#D4AF37', '#B8941F']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Se connecter</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Si pas de restaurant sélectionné
  if (!currentRestaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Restaurant requis" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="restaurant" size={64} color="#DDD" />
          <Text style={styles.errorTitle}>Restaurant requis</Text>
          <Text style={styles.errorText}>
            Vous devez sélectionner un restaurant pour accéder à cette page
          </Text>
          <Pressable style={styles.actionButton} onPress={() => router.replace(fallbackRoute as any)}>
            <LinearGradient colors={['#D4AF37', '#B8941F']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Sélectionner un restaurant</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Tout est OK, afficher le contenu
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
