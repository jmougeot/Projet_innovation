/**
 * 🏪 Page de Sélection Restaurant - Version Custom Claims
 * 
 * NOUVEAU SYSTÈME AVEC CUSTOM CLAIMS:
 * - Chargement ultra-rapide des restaurants accessibles (Custom Claims)
 * - Sélection persistante avec mémoire automatique
 * - Protection par AutoRedirect pour les utilisateurs connectés
 * - Interface moderne et réactive
 * 
 * FONCTIONNALITÉS:
 * - ⚡ Lecture Custom Claims (0-50ms vs 500-8000ms)
 * - 💾 Mémorisation automatique du choix
 * - 🔒 Vérification de sécurité en temps réel
 * - 🎨 Interface utilisateur moderne
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import Header from '@/app/components/Header';
import Deconnexion, { useDeconnexion, useConfirmDialog } from '@/app/components/Deconnexion';
import { getMyRestaurants, getRestaurant, type Restaurant } from '@/app/firebase/firebaseRestaurant';
import { refreshCustomClaims } from '@/app/firebase/firebaseRestaurantAccess';
import { useRestaurant } from '@/app/contexts/RestaurantContext';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/app//firebase/firebaseConfig';

export default function RestaurantSelectPage() {
  const router = useRouter();
  const [availableRestaurants, setAvailableRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // 🎯 Utilisation du contexte restaurant
  const { restaurantId: currentRestaurantId, isLoading: contextLoading, setRestaurantId, refreshRestaurant } = useRestaurant();
  
  // 🚪 Hook pour la déconnexion personnalisée
  const { isVisible: showLogoutDialog, showDialog: openLogoutDialog, hideDialog: closeLogoutDialog } = useDeconnexion();
  
  // 🚨 Hook pour les autres dialogs (erreurs, succès, etc.)
  const { isVisible: showErrorDialog, config: errorConfig, showDialog: openErrorDialog, hideDialog: closeErrorDialog } = useConfirmDialog();
  
  // 🎨 Chargement des fonts
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  // Variables calculées
  const isConnectedToRestaurant = !!currentRestaurantId;
  const isLoading = contextLoading || restaurantsLoading;

  /**
   * ⚡ Charger les restaurants via Custom Claims (ultra-rapide)
   */
  const loadUserRestaurantsWithClaims = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
      setRestaurantsLoading(true);
      console.log('⚡ Chargement restaurants via Custom Claims pour:', currentUser.uid);
      
      // 1. Récupérer les IDs des restaurants via Custom Claims (0-50ms)
      const restaurantIds = await getMyRestaurants();
      
      if (!restaurantIds || restaurantIds.length === 0) {
        console.log('⚠️ Aucun restaurant accessible via Custom Claims');
        setAvailableRestaurants([]);
        return;
      }

      // 2. Charger les détails de chaque restaurant
      const restaurants: Restaurant[] = [];
      for (const restaurantId of restaurantIds) {
        try {
          const restaurant = await getRestaurant(restaurantId);
          if (restaurant) {
            restaurants.push(restaurant);
          }
        } catch (error) {
          console.error(`❌ Erreur chargement restaurant ${restaurantId}:`, error);
        }
      }

      console.log(`✅ ${restaurants.length} restaurants chargés via Custom Claims`);
      setAvailableRestaurants(restaurants);
      
    } catch (error) {
      console.error('❌ Erreur chargement restaurants Custom Claims:', error);
      setAvailableRestaurants([]);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  /**
   * 🏪 Sélectionner un restaurant (avec Custom Claims)
   */
  const handleSelectRestaurant = async (restaurant: Restaurant) => {
    try {
      setSelectedRestaurantId(restaurant.id);
      
      // ⚡ Utiliser le contexte pour sauvegarder
      await setRestaurantId(restaurant.id);
      
      console.log(`✅ Restaurant ${restaurant.name} sélectionné via Custom Claims`);
      
      // Rediriger vers la page principale du restaurant
      router.replace('../home' as any);
    } catch (error) {
      console.error('❌ Erreur sélection restaurant:', error);
      openErrorDialog({
        title: 'Erreur de sélection',
        message: 'Impossible de sélectionner ce restaurant. Vérifiez vos permissions.',
        confirmText: 'OK',
        type: 'warning',
        onConfirm: () => {},
        onClose: closeErrorDialog
      });
    } finally {
      setSelectedRestaurantId(null);
    }
  };

  const handleCreateRestaurant = () => {
    router.push('/restaurant/create' as any);
  };

  /**
   * 🚪 Ouvrir la dialog de déconnexion
   */
  const handleLogout = () => {
    openLogoutDialog();
  };

  /**
   * 🚪 Confirmer la déconnexion Firebase
   */
  const confirmLogout = async () => {
    try {
      await signOut(auth);
      console.log('✅ Déconnexion Firebase réussie');
      closeLogoutDialog();
      router.replace('/connexion' as any);
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      // Utiliser le dialog d'erreur personnalisé
      openErrorDialog({
        title: 'Erreur de déconnexion',
        message: 'Impossible de se déconnecter. Veuillez réessayer.',
        confirmText: 'OK',
        type: 'warning',
        onConfirm: () => {},
        onClose: closeErrorDialog
      });
    }
  };

  /**
   * 🔄 Forcer le refresh des Custom Claims et recharger les restaurants
   */
  const handleRefreshRestaurants = async () => {
    try {
      setRestaurantsLoading(true);
      console.log('🔄 Refresh des Custom Claims et rechargement des restaurants...');
      
      // 1. Forcer le refresh des Custom Claims
      await refreshCustomClaims();
      
      // 2. Refresh du contexte restaurant
      await refreshRestaurant();
      
      // 3. Attendre un peu pour laisser le temps aux claims de se propager
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 4. Recharger les restaurants avec les nouveaux claims
      await loadUserRestaurantsWithClaims();
      
      openErrorDialog({
        title: '✅ Actualisation terminée',
        message: 'Les restaurants ont été rechargés avec succès.',
        confirmText: 'OK',
        type: 'info',
        onConfirm: () => {},
        onClose: closeErrorDialog
      });
      
    } catch (error) {
      console.error('❌ Erreur refresh restaurants:', error);
      openErrorDialog({
        title: '❌ Erreur',
        message: 'Impossible d\'actualiser les restaurants. Vérifiez votre connexion.',
        confirmText: 'OK',
        type: 'warning',
        onConfirm: () => {},
        onClose: closeErrorDialog
      });
    } finally {
      setRestaurantsLoading(false);
    }
  };

  // 🔥 Listener Firebase Auth simplifié
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log('🔐 Auth state changed:', authUser?.uid || 'pas connecté');
      setUser(authUser);
      
      if (authUser) {
        // Utilisateur connecté - charger ses restaurants
        try {
          await loadUserRestaurantsWithClaims();
        } catch (error) {
          console.error('❌ Erreur chargement restaurants:', error);
        }
      } else {
        // Utilisateur déconnecté - rediriger vers connexion
        router.replace('/connexion' as any);
      }
    });

    // Nettoyage du listener
    return () => unsubscribe();
  }, []); // ✅ Dépendances vides - pas de boucle infinie

  if (isLoading || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#194A8D" />
          <Text style={styles.loadingText}>Chargement des restaurants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 🎨 En-tête avec bienvenue */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Sélection Restaurant</Text>
          <LinearGradient
            colors={['transparent', '#CAE1EF', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.separator}
          />
          <Text style={styles.welcomeText}>
            {isConnectedToRestaurant 
              ? 'Changer de restaurant ou continuer avec le restaurant actuel'
              : 'Choisissez votre restaurant pour commencer'
            }
          </Text>
        </View>

        {/* 🏪 Restaurant actuel (si connecté) */}
        {isConnectedToRestaurant && (
          <View style={styles.currentRestaurantSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="restaurant" size={24} color="#194A8D" />
              <Text style={styles.sectionTitle}>Restaurant Actuel</Text>
            </View>
            
            <View style={styles.currentRestaurantCard}>
              <View style={styles.restaurantCardContent}>
                <View style={styles.restaurantInfo}>
                  <MaterialIcons name="storefront" size={32} color="#194A8D" />
                  <View style={styles.restaurantDetails}>
                    <Text style={styles.restaurantName}>Restaurant ID: {currentRestaurantId}</Text>
                    <Text style={styles.restaurantStatus}>✅ Connecté</Text>
                  </View>
                </View>
                
                <View style={styles.restaurantActions}>
                  <Pressable 
                    style={[styles.actionButton, styles.continueButton]} 
                    onPress={() => router.replace('../home' as any)}
                  >
                    <MaterialIcons name="arrow-forward" size={18} color="white" />
                    <Text style={styles.continueButtonText}>Continuer</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 📋 Liste des restaurants disponibles */}
        <View style={styles.restaurantListSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="list" size={24} color="#194A8D" />
            <Text style={styles.sectionTitle}>
              {isConnectedToRestaurant ? 'Autres Restaurants' : 'Restaurants Disponibles'}
            </Text>
          </View>
          
          {restaurantsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#194A8D" />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : availableRestaurants.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="store" size={64} color="#CAE1EF" />
              <Text style={styles.emptyStateTitle}>Aucun restaurant disponible</Text>
              <Text style={styles.emptyStateText}>
                Vous n'avez accès à aucun restaurant actuellement.
              </Text>
            </View>
          ) : (
            <View style={styles.restaurantGrid}>
              {availableRestaurants.map((restaurant) => (
                <Pressable
                  key={restaurant.id}
                  style={[
                    styles.restaurantCard,
                    selectedRestaurantId === restaurant.id && styles.restaurantCardSelected,
                    currentRestaurantId === restaurant.id && styles.restaurantCardCurrent
                  ]}
                  onPress={() => handleSelectRestaurant(restaurant)}
                  disabled={selectedRestaurantId === restaurant.id}
                >
                  <View style={styles.restaurantCardContent}>
                    <View style={styles.restaurantIconContainer}>
                      <MaterialIcons name="restaurant" size={28} color="#194A8D" />
                      {currentRestaurantId === restaurant.id && (
                        <View style={styles.currentBadge}>
                          <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.restaurantInfo}>
                      <Text style={styles.restaurantName}>{restaurant.name}</Text>
                      <Text style={styles.restaurantAddress}>
                        {restaurant.address || 'Adresse non renseignée'}
                      </Text>
                    </View>
                    
                    <View style={styles.restaurantAction}>
                      {selectedRestaurantId === restaurant.id ? (
                        <ActivityIndicator size="small" color="#194A8D" />
                      ) : currentRestaurantId === restaurant.id ? (
                        <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                      ) : (
                        <MaterialIcons name="arrow-forward-ios" size={16} color="#194A8D" />
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* 🔄 Actions */}
        <View style={styles.actionsSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="settings" size={24} color="#194A8D" />
            <Text style={styles.sectionTitle}>Actions</Text>
          </View>
          
          <View style={styles.actionGrid}>
            <Pressable 
              onPress={handleRefreshRestaurants} 
              style={[styles.actionCard, styles.refreshCard]}
              disabled={restaurantsLoading}
            >
              <MaterialIcons 
                name={restaurantsLoading ? "hourglass-empty" : "refresh"} 
                size={24} 
                color="#194A8D" 
              />
              <Text style={styles.actionCardText}>
                {restaurantsLoading ? 'Actualisation...' : 'Actualiser'}
              </Text>
            </Pressable>
            
            <Pressable 
              onPress={handleCreateRestaurant} 
              style={[styles.actionCard, styles.createCard]}
            >
              <MaterialIcons name="add" size={24} color="#194A8D" />
              <Text style={styles.actionCardText}>Créer Restaurant</Text>
            </Pressable>
          </View>
        </View>

        {/* 🚪 Déconnexion */}
        <View style={styles.logoutSection}>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={20} color="#CAE1EF" />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* 🚪 Dialog de déconnexion personnalisée */}
      <Deconnexion
        visible={showLogoutDialog}
        onClose={closeLogoutDialog}
        onConfirm={confirmLogout}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter de l'application ?"
        confirmText="Se déconnecter"
        cancelText="Annuler"
      />

      {/* 🚨 Dialog pour erreurs et notifications */}
      <Deconnexion
        visible={showErrorDialog}
        onClose={closeErrorDialog}
        onConfirm={errorConfig.onConfirm || (() => {})}
        title={errorConfig.title || 'Information'}
        message={errorConfig.message || ''}
        confirmText={errorConfig.confirmText || 'OK'}
        cancelText=""
        type={errorConfig.type || 'info'}
        iconName={errorConfig.iconName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 🎨 Layout principal - Style cohérent avec home.tsx
  container: {
    flex: 1,
    backgroundColor: '#194A8D', // Fond bleu principal comme home
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#CAE1EF',
    textAlign: 'center',
    fontWeight: '600',
  },

  // 🎨 Section d'accueil - Style home.tsx
  welcomeSection: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#F3EFEF', // Fond section comme home
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    color: '#194A8D',
    marginBottom: 10,
    fontFamily: 'AlexBrush',
    letterSpacing: 1,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#194A8D',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  separator: {
    height: 4,
    width: '80%',
    marginBottom: 10,
  },

  // 🏪 Restaurant actuel - Style professionnel
  currentRestaurantSection: {
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#CAE1EF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#194A8D',
    fontFamily: 'AlexBrush',
    letterSpacing: 1,
  },
  currentRestaurantCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },

  // 📋 Liste des restaurants - Grille moderne
  restaurantListSection: {
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  restaurantGrid: {
    gap: 15,
  },
  restaurantCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  restaurantCardSelected: {
    opacity: 0.7,
    borderColor: '#194A8D',
  },
  restaurantCardCurrent: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#F0F8FF',
  },
  restaurantCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // 📍 Informations restaurant
  restaurantIconContainer: {
    position: 'relative',
    marginRight: 15,
  },
  currentBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  restaurantInfo: {
    flex: 1,
    marginRight: 15,
  },
  restaurantDetails: {
    flex: 1,
    marginLeft: 15,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#194A8D',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
    opacity: 0.8,
  },
  restaurantStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  restaurantAction: {
    padding: 5,
  },

  // 🎛️ Actions restaurant
  restaurantActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  continueButton: {
    backgroundColor: '#194A8D',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  changeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#194A8D',
  },
  changeButtonText: {
    color: '#194A8D',
    fontSize: 15,
    fontWeight: '600',
  },

  // 🔄 Section actions - Style grille moderne
  actionsSection: {
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  refreshCard: {
    borderColor: '#CAE1EF',
    borderWidth: 1,
  },
  createCard: {
    borderColor: '#194A8D',
    borderWidth: 1,
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#194A8D',
    textAlign: 'center',
  },

  // 🚪 Déconnexion - Style minimaliste
  logoutSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutButtonText: {
    color: '#CAE1EF',
    fontSize: 16,
    fontWeight: '500',
  },

  // 🚫 État vide - Style cohérent
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#194A8D',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
  },
});
