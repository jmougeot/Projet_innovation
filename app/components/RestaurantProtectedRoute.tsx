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
import { useRestaurantSelection } from '../firebase/RestaurantSelectionContext';
import Header from '@/app/components/Header';

interface RestaurantProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallbackRoute?: string;
}

export default function RestaurantProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallbackRoute = '/restaurant/select',
}: RestaurantProtectedRouteProps) {
  const router = useRouter();
  const {
    user,
    userLoading,
    selectedRestaurant,
    selectedRestaurantRole,
    userRestaurantAccess,
  } = useRestaurantSelection();

  // Chargement de l'utilisateur
  if (userLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Vérification..." />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Vérification de l'accès...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Utilisateur non connecté
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Connexion requise" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="account-circle" size={80} color="#ccc" />
          <Text style={styles.errorTitle}>Connexion requise</Text>
          <Text style={styles.errorMessage}>
            Vous devez être connecté pour accéder à cette page.
          </Text>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/connexion')}
          >
            <LinearGradient
              colors={['#D4AF37', '#B8941F']}
              style={styles.buttonGradient}
            >
              <MaterialIcons name="login" size={20} color="white" />
              <Text style={styles.buttonText}>Se connecter</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Aucun restaurant sélectionné
  if (!selectedRestaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Restaurant requis" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="restaurant" size={80} color="#ccc" />
          <Text style={styles.errorTitle}>Restaurant non sélectionné</Text>
          <Text style={styles.errorMessage}>
            Veuillez sélectionner un restaurant pour continuer.
          </Text>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/restaurant/select' as any)}
          >
            <LinearGradient
              colors={['#D4AF37', '#B8941F']}
              style={styles.buttonGradient}
            >
              <MaterialIcons name="restaurant" size={20} color="white" />
              <Text style={styles.buttonText}>Sélectionner un restaurant</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Vérification des rôles requis
  if (requiredRoles.length > 0 && selectedRestaurantRole) {
    if (!requiredRoles.includes(selectedRestaurantRole)) {
      return (
        <SafeAreaView style={styles.container}>
          <Header title="Accès refusé" />
          <View style={styles.errorContainer}>
            <MaterialIcons name="block" size={80} color="#FF6B6B" />
            <Text style={styles.errorTitle}>Accès non autorisé</Text>
            <Text style={styles.errorMessage}>
              Votre rôle ({selectedRestaurantRole}) ne vous permet pas d'accéder à cette page.
              {'\n'}Rôles requis : {requiredRoles.join(', ')}
            </Text>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push(fallbackRoute as any)}
            >
              <LinearGradient
                colors={['#666', '#444']}
                style={styles.buttonGradient}
              >
                <MaterialIcons name="arrow-back" size={20} color="white" />
                <Text style={styles.buttonText}>Retour</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }
  }

  // Vérification des permissions requises
  if (requiredPermissions.length > 0) {
    const userAccess = userRestaurantAccess.find(
      (access) => access.restaurantId === selectedRestaurant.id
    );

    if (!userAccess) {
      return (
        <SafeAreaView style={styles.container}>
          <Header title="Erreur d'accès" />
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={80} color="#FF6B6B" />
            <Text style={styles.errorTitle}>Erreur d'accès</Text>
            <Text style={styles.errorMessage}>
              Impossible de vérifier vos permissions pour ce restaurant.
            </Text>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push(fallbackRoute as any)}
            >
              <LinearGradient
                colors={['#666', '#444']}
                style={styles.buttonGradient}
              >
                <MaterialIcons name="refresh" size={20} color="white" />
                <Text style={styles.buttonText}>Réessayer</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    // Vérifier les permissions spécifiques
    const hasAllPermissions = requiredPermissions.every(
      (permission) =>
        userAccess.permissions.includes('all') ||
        userAccess.permissions.includes(permission) ||
        userAccess.role === 'admin'
    );

    if (!hasAllPermissions) {
      return (
        <SafeAreaView style={styles.container}>
          <Header title="Permissions insuffisantes" />
          <View style={styles.errorContainer}>
            <MaterialIcons name="lock" size={80} color="#FF6B6B" />
            <Text style={styles.errorTitle}>Permissions insuffisantes</Text>
            <Text style={styles.errorMessage}>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              {'\n'}Permissions requises : {requiredPermissions.join(', ')}
            </Text>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push(fallbackRoute as any)}
            >
              <LinearGradient
                colors={['#666', '#444']}
                style={styles.buttonGradient}
              >
                <MaterialIcons name="arrow-back" size={20} color="white" />
                <Text style={styles.buttonText}>Retour</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }
  }

  // Tout est OK, afficher le contenu
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
