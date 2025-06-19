/**
 * ⚡ AutoRedirect - Version simplifiée
 * 
 * UTILISATION:
 * <AutoRedirect requireRole="manager" restaurantId="rest_123">
 *   <ManagerContent />
 * </AutoRedirect>
 */

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import RestaurantStorage from '../asyncstorage/restaurantStorage';

// Import des fonctions Custom Claims optimisées
import { canAccessRestaurant, hasRestaurantRole, getAccessibleRestaurants } from '../firebase/firebaseRestaurantAccess';
import { auth } from '../firebase/firebaseConfig';

interface AutoRedirectProps {
  children?: React.ReactNode;
  loadingMessage?: string;
  showLoading?: boolean;
  restaurantId?: string;           // Restaurant spécifique requis
  requireRole?: 'manager' | 'waiter' | 'chef' | 'cleaner'; // Rôle requis
  requireAnyAccess?: boolean;      // Juste vérifier qu'il a accès à un restaurant
  
  // 🎨 UI/UX
  fallbackRoute?: '/connexion' | '/home' | '/' | string; // Où rediriger si pas d'accès (défaut: /connexion)
}

// AMÉLIORATION SÉCURITÉ : Validation stricte des paramètres
const validateSecureParams = (restaurantId?: string, fallbackRoute?: string) => {
  // Validation de l'ID restaurant
  if (restaurantId && !/^[a-zA-Z0-9_-]+$/.test(restaurantId)) {
    console.warn('🚨 [Security] Restaurant ID invalide détecté');
    return false;
  }
  
  // Validation de la route de fallback
  const allowedRoutes = ['/connexion', '/home', '/', '/restaurant/select'];
  if (fallbackRoute && !allowedRoutes.includes(fallbackRoute)) {
    console.warn('🚨 [Security] Route de fallback non autorisée:', fallbackRoute);
    return false;
  }
  
  return true;
};

const AutoRedirect = ({ 
  children, 
  loadingMessage = "Vérification des permissions...", 
  showLoading = true,
  restaurantId,
  requireRole,
  requireAnyAccess = false,
  fallbackRoute = '/connexion'
}: AutoRedirectProps) => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [authStateLoaded, setAuthStateLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [checkCompleted, setCheckCompleted] = useState(false);

  // Écouter les changements d'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 [AutoRedirect] État d\'authentification changé:', user ? 'connecté' : 'déconnecté');
      setCurrentUser(user);
      setAuthStateLoaded(true);
    });

    return unsubscribe;
  }, []);

  // ⚡ Vérification ultra-rapide avec Custom Claims
  useEffect(() => {
    if (checkCompleted) {
      return;
    }
    if (!authStateLoaded) {
      console.log('⏳ [AutoRedirect] En attente de l\'authentification...', { authStateLoaded });
      return;
    }

    const checkAccess = async () => {
      try {
        // SÉCURITÉ : Validation stricte des paramètres dès le début
        if (!validateSecureParams(restaurantId, fallbackRoute)) {
          console.error('🚨 [Security] Paramètres non sécurisés détectés');
          router.replace('/connexion');
          return;
        }

        console.log('🔍 [AutoRedirect] Démarrage vérification Custom Claims...');
        const startTime = Date.now();
        setCheckCompleted(true);

        // Vérification utilisateur connecté avec null check
        if (!currentUser) {
          console.log('🚫 [AutoRedirect] Utilisateur non connecté');
          setIsChecking(false);
          router.replace('/connexion'); // Route sécurisée fixe
          return;
        }
        
        // SÉCURITÉ : Vérifier la validité du token (currentUser est garanti non-null ici)
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          if (!tokenResult?.token) {
            console.warn('🚨 [Security] Token invalide');
            router.replace('/connexion');
            return;
          }
        } catch (tokenError) {
          console.error('🚨 [Security] Erreur de validation du token:', tokenError);
          router.replace('/connexion');
          return;
        }

        // SÉCURITÉ : Récupérer l'ID du restaurant avec validation
        let targetRestaurantId: string | undefined | null = restaurantId;
        if (!targetRestaurantId) {
          try {
            const savedId = await RestaurantStorage.GetSelectedRestaurantId();
            targetRestaurantId = savedId; // savedId peut être string | null
            // SÉCURITÉ : Ne pas logger l'ID complet
            console.log('📱 [AutoRedirect] Restaurant depuis AsyncStorage:', targetRestaurantId ? 'trouvé' : 'non trouvé');
          } catch (storageError) {
            console.error('❌ [AutoRedirect] Erreur AsyncStorage:', storageError);
            // SÉCURITÉ : En cas d'erreur AsyncStorage, rediriger vers sélection
            router.replace('/restaurant/select');
            return;
          }
        }
        // SÉCURITÉ : Validation de l'ID restaurant
        if (targetRestaurantId && !/^[a-zA-Z0-9_-]+$/.test(targetRestaurantId)) {
          console.warn('🚨 [Security] ID restaurant invalide détecté');
          router.replace('/restaurant/select');
          return;
        }
        // Si on demande juste un accès à n'importe quel restaurant
        if (requireAnyAccess) {
          const accessibleRestaurants = await getAccessibleRestaurants();
          const hasAnyAccess = accessibleRestaurants && accessibleRestaurants.length > 0;
          
          if (!hasAnyAccess) {
            console.log('🚫 [AutoRedirect] Aucun accès restaurant trouvé');
            setAccessError('Aucun accès restaurant');
            router.replace(fallbackRoute as any);
            return;
          }
          
          console.log('✅ [AutoRedirect] Accès restaurant trouvé:', accessibleRestaurants.length);
          setHasAccess(true);
          setIsChecking(false);
          return;
        }

        // Si un restaurant spécifique est requis (soit via prop, soit via AsyncStorage)
        if (targetRestaurantId) {

          const canAccess = await canAccessRestaurant(targetRestaurantId);
          
          if (!canAccess) {
            console.log('🚫 [AutoRedirect] Pas d\'accès au restaurant:', targetRestaurantId);
            setAccessError(`Pas d'accès au restaurant ${targetRestaurantId}`);
            router.replace(fallbackRoute as any);
            return;
          }

          // Si un rôle spécifique est requis
          if (requireRole) {
            const hasRole = await hasRestaurantRole(targetRestaurantId, requireRole);
            
            if (!hasRole) {
              console.log('🚫 [AutoRedirect] Rôle insuffisant:', requireRole, 'pour restaurant:', targetRestaurantId);
              setAccessError(`Rôle ${requireRole} requis`);
              router.replace(fallbackRoute as any);
              return;
            }
          }
        } else {
          console.log('🚫 [AutoRedirect] Aucun restaurant sélectionné');
          setAccessError('Aucun restaurant sélectionné');
          router.replace(fallbackRoute as any);
          return;
        }

        const endTime = Date.now();
        console.log(`✅ [AutoRedirect] Accès autorisé en ${endTime - startTime}ms - Rendu du contenu`);
        
        setHasAccess(true);
        setIsChecking(false);

      } catch (error) {
        console.error('❌ [AutoRedirect] Erreur Custom Claims:', error);
        setAccessError('Erreur de vérification');
        setIsChecking(false);
        router.replace(fallbackRoute as any);
      }
    };

    checkAccess();
  }, [authStateLoaded, checkCompleted, currentUser, restaurantId, requireRole, fallbackRoute, requireAnyAccess]);

  // Affichage du loading si nécessaire
  if (isChecking) {
    if (!showLoading) return null;
    
    // Message de chargement dynamique selon l'état
    let currentMessage = loadingMessage;
    if (!authStateLoaded) {
      currentMessage = "Initialisation de l'authentification...";
    } else if (!currentUser) {
      currentMessage = "Vérification de la connexion...";
    }
    
    return (
      <LinearGradient
        colors={['#1e3c72', '#2a5298', '#3b6fb0']}
        style={styles.container}
      >
        <View style={styles.loadingContent}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="security" size={60} color="white" />
          </View>
          <ActivityIndicator size="large" color="white" style={styles.spinner} />
          <Text style={styles.loadingText}>{currentMessage}</Text>
          <Text style={styles.subText}>
            État: {!authStateLoaded ? 'Chargement auth...' : !currentUser ? 'Non connecté' : 'Vérification permissions...'}
          </Text>
          {restaurantId && (
            <Text style={styles.restaurantText}>
              Restaurant: {restaurantId}
            </Text>
          )}
          {requireRole && (
            <Text style={styles.roleText}>
              Rôle requis: {requireRole}
            </Text>
          )}
        </View>
      </LinearGradient>
    );
  }

  // Affichage d'erreur si problème d'accès
  if (accessError) {
    return (
      <LinearGradient
        colors={['#d32f2f', '#f44336']}
        style={styles.container}
      >
        <View style={styles.loadingContent}>
          <MaterialIcons name="error" size={60} color="white" />
          <Text style={styles.errorText}>Accès refusé</Text>
          <Text style={styles.subText}>{accessError}</Text>
          <Text 
            style={styles.retryText}
            onPress={() => router.replace(fallbackRoute as any)}
          >
            Retour →
          </Text>
        </View>
      </LinearGradient>
    );
  }

  // ✅ Accès autorisé - afficher le contenu
  if (hasAccess) {
    return <>{children}</>;
  }
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
    maxWidth: 300,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  spinner: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '300',
  },
  restaurantText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    fontWeight: '400',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  errorText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    marginVertical: 16,
  },
  retryText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default AutoRedirect;
