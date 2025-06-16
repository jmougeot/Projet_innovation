import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utilitaires pour tester et déboguer la persistance de restaurant
 */

const STORAGE_KEYS = {
  SELECTED_RESTAURANT_ID: '@selected_restaurant_id',
  SELECTED_RESTAURANT_DATA: '@selected_restaurant_data',
  SELECTED_RESTAURANT_ROLE: '@selected_restaurant_role',
};

export const debugRestaurantPersistence = {
  // Afficher l'état actuel du stockage
  async checkStorage() {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.SELECTED_RESTAURANT_ID,
        STORAGE_KEYS.SELECTED_RESTAURANT_DATA,
        STORAGE_KEYS.SELECTED_RESTAURANT_ROLE,
      ]);
      
      console.log('=== DEBUG RESTAURANT PERSISTENCE ===');
      console.log('Restaurant ID:', values[0][1]);
      console.log('Restaurant Data:', values[1][1] ? JSON.parse(values[1][1]) : null);
      console.log('Restaurant Role:', values[2][1]);
      console.log('===================================');
      
      return {
        restaurantId: values[0][1],
        restaurantData: values[1][1] ? JSON.parse(values[1][1]) : null,
        role: values[2][1],
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du stockage:', error);
      return null;
    }
  },

  // Vider le stockage
  async clearStorage() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SELECTED_RESTAURANT_ID,
        STORAGE_KEYS.SELECTED_RESTAURANT_DATA,
        STORAGE_KEYS.SELECTED_RESTAURANT_ROLE,
      ]);
      console.log('✅ Stockage restaurant vidé');
    } catch (error) {
      console.error('❌ Erreur lors du vidage:', error);
    }
  },

  // Afficher toutes les clés AsyncStorage
  async listAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('=== TOUTES LES CLÉS ASYNCSTORAGE ===');
      keys.forEach(key => console.log(key));
      console.log('===================================');
      return keys;
    } catch (error) {
      console.error('Erreur lors de la récupération des clés:', error);
      return [];
    }
  },

  // Simuler un restaurant pour les tests
  async setTestRestaurant() {
    const testRestaurant = {
      id: 'test-restaurant',
      name: 'Restaurant Test',
      address: '123 Test Street',
      phone: '0123456789',
      email: 'test@restaurant.com',
      status: 'active' as const,
      createdAt: new Date(),
    };

    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.SELECTED_RESTAURANT_ID, 'test-restaurant'],
        [STORAGE_KEYS.SELECTED_RESTAURANT_DATA, JSON.stringify(testRestaurant)],
        [STORAGE_KEYS.SELECTED_RESTAURANT_ROLE, 'owner'],
      ]);
      console.log('✅ Restaurant de test ajouté au stockage');
      return testRestaurant;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du restaurant de test:', error);
      return null;
    }
  },
};

// Ajouter les fonctions au global pour le débogage en développement
if (__DEV__) {
  (global as any).debugRestaurant = debugRestaurantPersistence;
  console.log('🛠️  Debug restaurant disponible via: debugRestaurant.checkStorage()');
}
