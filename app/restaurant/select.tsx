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
import { useRestaurantSelection } from '../firebase/RestaurantSelectionContext';

export default function RestaurantSelectPage() {
  const router = useRouter();
  const {
    user,
    availableRestaurants,
    restaurantsLoading,
    selectionLoading,
    selectRestaurant,
    refreshRestaurants,
  } = useRestaurantSelection();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
    if (!user) {
      router.replace('/connexion');
      return;
    }

    // Rafraîchir la liste des restaurants
    refreshRestaurants();
  }, [user]);

  const handleSelectRestaurant = async (restaurantId: string) => {
    try {
      setSelectedRestaurantId(restaurantId);
      await selectRestaurant(restaurantId);
      
      // Rediriger vers la page principale du restaurant
      router.replace('/restaurant');
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
    router.push('/restaurant/create');
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
            router.replace('/connexion');
          }
        }
      ]
    );
  };

  if (restaurantsLoading) {
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
            <View>
              <Text style={styles.welcomeText}>Bienvenue</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
          
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#666" />
          </Pressable>
        </View>

        {/* Title */}
        <Text style={styles.title}>Sélectionner un restaurant</Text>
        <Text style={styles.subtitle}>
          Choisissez le restaurant que vous souhaitez gérer
        </Text>

        {/* Restaurants List */}
        {availableRestaurants.length > 0 ? (
          <View style={styles.restaurantsList}>
            {availableRestaurants.map((restaurant) => (
              <Pressable
                key={restaurant.id}
                style={[
                  styles.restaurantCard,
                  selectedRestaurantId === restaurant.id && styles.restaurantCardLoading
                ]}
                onPress={() => handleSelectRestaurant(restaurant.id)}
                disabled={selectionLoading}
              >
                <LinearGradient
                  colors={['#ffffff', '#f8f9fa']}
                  style={styles.cardGradient}
                >
                  <View style={styles.restaurantIcon}>
                    <MaterialIcons name="restaurant" size={30} color="#D4AF37" />
                  </View>
                  
                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName}>{restaurant.name}</Text>
                    <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
                    <View style={styles.restaurantMeta}>
                      <View style={styles.statusBadge}>
                        <View 
                          style={[
                            styles.statusDot,
                            { backgroundColor: restaurant.status === 'active' ? '#4CAF50' : '#FF9800' }
                          ]} 
                        />
                        <Text style={styles.statusText}>
                          {restaurant.status === 'active' ? 'Actif' : 'Inactif'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    {selectedRestaurantId === restaurant.id ? (
                      <ActivityIndicator size="small" color="#D4AF37" />
                    ) : (
                      <MaterialIcons name="arrow-forward-ios" size={20} color="#666" />
                    )}
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="restaurant-menu" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucun restaurant trouvé</Text>
            <Text style={styles.emptySubtitle}>
              Vous n'avez accès à aucun restaurant pour le moment.
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.createButton} onPress={handleCreateRestaurant}>
            <LinearGradient
              colors={['#D4AF37', '#B8941F']}
              style={styles.createButtonGradient}
            >
              <MaterialIcons name="add" size={24} color="white" />
              <Text style={styles.createButtonText}>Créer un nouveau restaurant</Text>
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
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
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  restaurantsList: {
    gap: 15,
  },
  restaurantCard: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  restaurantCardLoading: {
    opacity: 0.7,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  restaurantIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  cardActions: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    marginTop: 30,
    paddingBottom: 30,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
