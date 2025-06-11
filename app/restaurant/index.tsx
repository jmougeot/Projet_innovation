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
import Header from '@/app/components/Header';
import { 
  getRestaurant, 
  initializeRestaurant,
  DEFAULT_RESTAURANT_ID 
} from '../firebase/firebaseRestaurant';
import type { Restaurant } from '../firebase/firebaseRestaurant';

export default function RestaurantIndex() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    checkRestaurantExists();
  }, []);

  const checkRestaurantExists = async () => {
    try {
      setLoading(true);
      const existingRestaurant = await getRestaurant(DEFAULT_RESTAURANT_ID, false);
      setRestaurant(existingRestaurant);
    } catch (error) {
      console.error('Erreur lors de la vérification du restaurant:', error);
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = () => {
    router.push('/restaurant/create');
  };

  const handleManageRestaurant = () => {
    router.push('/restaurant/settings');
  };

  const handleQuickSetup = async () => {
    try {
      setLoading(true);
      Alert.alert(
        'Configuration rapide',
        'Voulez-vous initialiser votre restaurant avec les paramètres par défaut ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => setLoading(false)
          },
          {
            text: 'Confirmer',
            onPress: async () => {
              try {
                await initializeRestaurant();
                const newRestaurant = await getRestaurant(DEFAULT_RESTAURANT_ID, false);
                setRestaurant(newRestaurant);
                Alert.alert('Succès', 'Restaurant initialisé avec succès !');
              } catch (error) {
                console.error('Erreur lors de l\'initialisation:', error);
                Alert.alert('Erreur', 'Impossible d\'initialiser le restaurant');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const reglageMenuItems = [
    {
      label: 'Accueil',
      onPress: () => router.push('/service')
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
          title="Mon Restaurant" 
          showBackButton={true}
          backgroundColor="#194A8D"
          textColor="#FFFFFF"
          useHeadComponent={true}
          customBackRoute="/service"
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
    <SafeAreaView style={styles.container}>
      <Header 
        title="Mon Restaurant" 
        showBackButton={true}
        backgroundColor="#194A8D"
        textColor="#FFFFFF"
        useHeadComponent={true}
        customBackRoute="/service"
        showReglage={true}
        reglageMenuItems={reglageMenuItems}
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

            <View style={styles.restaurantInfo}>
              <View style={styles.infoRow}>
                <MaterialIcons name="access-time" size={20} color="#666" />
                <Text style={styles.infoText}>
                  Ouvert: {restaurant.settings.business_hours.open_time} - {restaurant.settings.business_hours.close_time}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialIcons name="table-restaurant" size={20} color="#666" />
                <Text style={styles.infoText}>
                  Capacité cuisine: {restaurant.settings.kitchen_capacity} commandes
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialIcons name="euro" size={20} color="#666" />
                <Text style={styles.infoText}>
                  Devise: {restaurant.settings.currency} | TVA: {(restaurant.settings.tax_rate * 100).toFixed(0)}%
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <Pressable style={styles.primaryButton} onPress={handleManageRestaurant}>
                <MaterialIcons name="settings" size={24} color="#fff" />
                <Text style={styles.primaryButtonText}>Gérer le restaurant</Text>
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
                <Text style={styles.setupButtonTitle}>Configuration personnalisée</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#333',
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
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  },
  setupOptions: {
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
