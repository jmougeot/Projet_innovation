import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '@/app/components/Header';
import { useRestaurant } from './SelectionContext';
import { getAllRestaurantToUser } from '../firebase/firebaseUser';
import { getRestaurant, Restaurant } from '../firebase/firebaseRestaurant';

export default function RestaurantSelectPage() {
  const router = useRouter();
  const { user, isUserConnected, isConnectedToRestaurant, isLoading, setCurrentRestaurant, currentRestaurant } = useRestaurant();
  const [availableRestaurants, setAvailableRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    // Ne plus rediriger automatiquement si un restaurant est sélectionné
    // Laisser l'utilisateur choisir de continuer ou changer de restaurant
    if (!isUserConnected) {
      setTimeout(() => {
        router.replace('../connexion' as any);
      }, 0);
      return;
    }
    // Charger les restaurants disponibles pour l'utilisateur
    loadUserRestaurants();
  }, [user, isUserConnected]);

  const loadUserRestaurants = async () => {
    if (!user) return;
    
    try {
      setRestaurantsLoading(true);
      console.log('🔄 Chargement des restaurants pour l\'utilisateur:', user.uid);
      
      // Récupérer les IDs des restaurants de l'utilisateur
      const restaurantIds = await getAllRestaurantToUser(user.uid);
      
      if (!restaurantIds || restaurantIds.length === 0) {
        console.log('⚠️ Aucun restaurant trouvé pour cet utilisateur');
        setAvailableRestaurants([]);
        return;
      }

      // Charger les détails de chaque restaurant
      const restaurants: Restaurant[] = [];
      for (const restaurantId of restaurantIds) {
        try {
          const restaurant = await getRestaurant(restaurantId);
          if (restaurant) {
            restaurants.push(restaurant);
          }
        } catch (error) {
          console.error(`Erreur lors du chargement du restaurant ${restaurantId}:`, error);
        }
      }

      console.log(`🏪 ${restaurants.length} restaurants chargés pour l'utilisateur`);
      setAvailableRestaurants(restaurants);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des restaurants:', error);
      setAvailableRestaurants([]);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const handleSelectRestaurant = async (restaurant: Restaurant) => {
    try {
      setSelectedRestaurantId(restaurant.id);
      
      // Utiliser le nouveau contexte pour définir le restaurant
      await setCurrentRestaurant({
        id: restaurant.id,
        name: restaurant.name
      });
      
      console.log(`✅ Restaurant ${restaurant.name} sélectionné`);
      
      // Rediriger vers la page principale du restaurant
      router.replace('/restaurant' as any);
    } catch (error) {
      console.error('Erreur lors de la sélection du restaurant:', error);
      Alert.alert(
        'Erreur',
        'Impossible de sélectionner ce restaurant. Vérifiez vos permissions.'
      );
    } finally {
      setSelectedRestaurantId(null);
    }
  };

  const handleCreateRestaurant = () => {
    router.push('/restaurant/create' as any);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            // Ici vous pouvez ajouter la logique de déconnexion
            router.replace('/connexion' as any);
          }
        }
      ]
    );
  };

  const handleDisconnectFromRestaurant = () => {
    Alert.alert(
      'Changer de restaurant',
      `Vous êtes actuellement connecté au restaurant "${currentRestaurant?.name}". Voulez-vous vous déconnecter pour sélectionner un autre restaurant ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Changer de restaurant',
          style: 'default',
          onPress: async () => {
            try {
              console.log('🔄 Déconnexion du restaurant actuel...');
              await setCurrentRestaurant(null);
              console.log('✅ Déconnecté du restaurant');
            } catch (error) {
              console.error('Erreur lors de la déconnexion du restaurant:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter du restaurant');
            }
          }
        }
      ]
    );
  };

  if (isLoading || restaurantsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Chargement" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Chargement des restaurants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Sélection Restaurant" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.userInfo}>
            <MaterialIcons name="account-circle" size={40} color="#D4AF37" />
            <View style={styles.userDetails}>
              <Text style={styles.welcomeText}>Bienvenue</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
          
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#666" />
          </Pressable>
        </View>

        {/* Current Restaurant Section (if connected) */}
        {isConnectedToRestaurant && currentRestaurant && (
          <View style={styles.currentRestaurantSection}>
            <View style={styles.currentRestaurantCard}>
              <MaterialIcons name="restaurant" size={32} color="#194A8D" />
              <View style={styles.currentRestaurantInfo}>
                <Text style={styles.currentRestaurantTitle}>Restaurant actuel</Text>
                <Text style={styles.currentRestaurantName}>{currentRestaurant.name}</Text>
              </View>
            </View>
            
            <View style={styles.currentRestaurantActions}>
              <Pressable 
                style={[styles.actionButton, styles.continueButton]} 
                onPress={() => router.replace('/restaurant' as any)}
              >
                <MaterialIcons name="arrow-forward" size={20} color="white" />
                <Text style={styles.continueButtonText}>Continuer</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.actionButton, styles.changeButton]} 
                onPress={handleDisconnectFromRestaurant}
              >
                <MaterialIcons name="swap-horiz" size={20} color="#194A8D" />
                <Text style={styles.changeButtonText}>Changer</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>
            {isConnectedToRestaurant ? 'Ou sélectionnez un autre restaurant' : 'Sélectionnez votre restaurant'}
          </Text>
          <Text style={styles.instructionsText}>
            {isConnectedToRestaurant 
              ? 'Vous pouvez changer de restaurant en sélectionnant un autre dans la liste ci-dessous'
              : 'Choisissez le restaurant avec lequel vous souhaitez travailler aujourd\'hui'
            }
          </Text>
        </View>

        {/* Restaurant List */}
        <View style={styles.restaurantList}>
          {availableRestaurants.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="store" size={64} color="#DDD" />
              <Text style={styles.emptyStateTitle}>Aucun restaurant disponible</Text>
              <Text style={styles.emptyStateText}>
                Vous n'avez accès à aucun restaurant pour le moment.
              </Text>
            </View>
          ) : (
            availableRestaurants.map((restaurant) => (
              <Pressable
                key={restaurant.id}
                style={[
                  styles.restaurantCard,
                  selectedRestaurantId === restaurant.id && styles.restaurantCardSelected
                ]}
                onPress={() => handleSelectRestaurant(restaurant)}
                disabled={selectedRestaurantId === restaurant.id}
              >
                <LinearGradient
                  colors={['#D4AF37', '#B8941F']}
                  style={styles.restaurantCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.restaurantCardContent}>
                    <View style={styles.restaurantInfo}>
                      <MaterialIcons name="restaurant" size={32} color="white" />
                      <View style={styles.restaurantDetails}>
                        <Text style={styles.restaurantName}>{restaurant.name}</Text>
                        <Text style={styles.restaurantAddress}>
                          {restaurant.address || 'Adresse non renseignée'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.restaurantActions}>
                      {selectedRestaurantId === restaurant.id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <MaterialIcons name="arrow-forward" size={24} color="white" />
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            ))
          )}
        </View>

        {/* Create Restaurant Button */}
        <View style={styles.createSection}>
          <Text style={styles.createSectionTitle}>Nouveau restaurant ?</Text>
          <Pressable onPress={handleCreateRestaurant} style={styles.createButton}>
            <LinearGradient
              colors={['#2E7D32', '#1B5E20']}
              style={styles.createButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="add" size={24} color="white" />
              <Text style={styles.createButtonText}>Créer un restaurant</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: '#666',
    textAlign: 'center',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  restaurantList: {
    marginBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  restaurantCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  restaurantCardSelected: {
    opacity: 0.7,
  },
  restaurantCardGradient: {
    borderRadius: 16,
    padding: 20,
  },
  restaurantCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantDetails: {
    marginLeft: 16,
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  restaurantActions: {
    marginLeft: 16,
  },
  createSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  createSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  createButton: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  
  // Current Restaurant Styles
  currentRestaurantSection: {
    marginBottom: 24,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#194A8D',
  },
  currentRestaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentRestaurantInfo: {
    marginLeft: 12,
    flex: 1,
  },
  currentRestaurantTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  currentRestaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#194A8D',
  },
  currentRestaurantActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  continueButton: {
    backgroundColor: '#194A8D',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  changeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#194A8D',
  },
  changeButtonText: {
    color: '#194A8D',
    fontSize: 16,
    fontWeight: '600',
  },
});
