import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Pressable,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import RestaurantProtectedRoute from './components/RestaurantProtectedRoute';
import { useRestaurant } from './SelectionContext';
import { getRestaurant, Restaurant} from '../firebase/firebaseRestaurant';

export default function RestaurantIndex() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const { currentRestaurant, setCurrentRestaurant } = useRestaurant();

  useEffect(() => {
    // Only check restaurant exists if we have a current restaurant
    if (currentRestaurant) {
      setRestaurant(currentRestaurant as any);
      setLoading(false);
    } else {
      // Let RestaurantProtectedRoute handle the redirection
      setLoading(false);
    }
  }, [currentRestaurant]);

  const checkRestaurantExists = async () => {
    if (!currentRestaurant) {
      setRestaurant(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const existingRestaurant = await getRestaurant(currentRestaurant.id, false);
      setRestaurant(existingRestaurant);
    } catch (error) {
      console.error('Erreur lors de la vérification du restaurant:', error);
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = () => {
    router.push('/restaurant/create' as any);
  };

  const handleManageRestaurant = () => {
    router.push('/restaurant/settings' as any);
  };

  const handleChangeRestaurant = async () => {
    Alert.alert(
      'Changer de restaurant',
      'Voulez-vous sélectionner un autre restaurant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Changer',
          onPress: async () => {
            await setCurrentRestaurant(null);
            router.replace('/restaurant/select' as any);
          }
        }
      ]
    );
  };

  const handleQuickSetup = async () => {
    try {
      setLoading(true);
      Alert.alert(
        'Configuration rapide',
        'Voulez-vous créer un restaurant avec les paramètres par défaut ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Créer',
            onPress: async () => {
              // Redirect to restaurant creation page for proper flow
              router.push('/restaurant/create' as any);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la configuration rapide:', error);
    } finally {
      setLoading(false);
    }
  };

  const reglageMenuItems = [
    {
      label: 'Accueil',
      onPress: () => router.push('/')
    },
    {
      label: 'Profil',
      onPress: () => router.push('/Profil/avatar' as any)
    },
    {
      label: 'Paramètres',
      onPress: () => {}
    },
    {
      label: 'Déconnexion',
      onPress: () => {},
      isLogout: true
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title={currentRestaurant ? currentRestaurant.name : "Mon Restaurant"} 
          showBackButton={true}
          backgroundColor="#194A8D"
          textColor="#FFFFFF"
          useHeadComponent={true}
          customBackRoute="/"
          showReglage={true}
          reglageMenuItems={reglageMenuItems}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#194A8D" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <RestaurantProtectedRoute>
      <SafeAreaView style={styles.container}>
        <Header 
          title={currentRestaurant ? currentRestaurant.name : "Mon Restaurant"} 
          showBackButton={true}
          backgroundColor="#194A8D"
          textColor="#FFFFFF"
          useHeadComponent={true}
          customBackRoute="/"
          showReglage={true}
          reglageMenuItems={[
            ...reglageMenuItems,
            {
              label: 'Changer de restaurant',
              onPress: handleChangeRestaurant
            }
          ]}
        />
        
        <View style={styles.content}>
          {restaurant ? (
            // Restaurant exists - show management options
            <View style={styles.restaurantCard}>
              <View style={styles.restaurantHeader}>
                <MaterialIcons name="restaurant" size={48} color="#194A8D" />
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.restaurantSubtitle}>Restaurant configuré</Text>
              </View>

              <View style={styles.actionButtons}>
                <Pressable style={styles.primaryButton} onPress={handleManageRestaurant}>
                  <MaterialIcons name="settings" size={24} color="#fff" />
                  <Text style={styles.primaryButtonText}>Gérer le restaurant</Text>
                </Pressable>
            
                <Pressable style={styles.adminButton} onPress={() => router.push('/restaurant/admin' as any)}>
                  <MaterialIcons name="admin-panel-settings" size={24} color="#E53E3E" />
                  <Text style={styles.adminButtonText}>Administration</Text>
                </Pressable>
                
              </View>
            </View>
          ) : (
            // No restaurant - show creation options
            <View style={styles.setupCard}>
              <View style={styles.setupHeader}>
                <MaterialIcons name="restaurant-menu" size={64} color="#194A8D" />
                <Text style={styles.setupTitle}>Bienvenue !</Text>
                <Text style={styles.setupSubtitle}>
                  Configurez votre restaurant pour commencer
                </Text>
              </View>

              <View style={styles.setupOptions}>
                <Pressable style={styles.setupButton} onPress={handleCreateRestaurant}>
                  <MaterialIcons name="create" size={32} color="#194A8D" />
                  <Text style={styles.setupButtonTitle}>Créer un restaurant</Text>
                  <Text style={styles.setupButtonSubtitle}>
                    Créez votre restaurant avec vos paramètres spécifiques
                  </Text>
                </Pressable>

                <Pressable style={styles.setupButton} onPress={handleQuickSetup}>
                  <MaterialIcons name="flash-on" size={32} color="#194A8D" />
                  <Text style={styles.setupButtonTitle}>Configuration rapide</Text>
                  <Text style={styles.setupButtonSubtitle}>
                    Démarrez rapidement avec les paramètres par défaut
                  </Text>
                </Pressable>
              </View>

              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={20} color="#194A8D" />
                <Text style={styles.infoBoxText}>
                  La configuration de votre restaurant inclut la gestion des tables,
                  du menu, du stock, et des commandes dans une structure organisée.
                </Text>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </RestaurantProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    margin: 10,
    borderRadius: 20,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EFEF',
    margin: 10,
    borderRadius: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#194A8D',
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  restaurantHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#194A8D',
    marginTop: 12,
  },
  restaurantSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
    marginTop: 8,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  restaurantInfo: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#194A8D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E53E3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  adminButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',

  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#194A8D',
    marginTop: 16,
  },
  setupSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    marginBottom: 24,
  },
  setupOptions: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  setupButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  setupButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#194A8D',
    marginTop: 12,
  },
  setupButtonSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#194A8D',
    lineHeight: 20,
    flex: 1,
  },
});
