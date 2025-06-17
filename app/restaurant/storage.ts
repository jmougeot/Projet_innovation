import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage keys for restaurant persistence
 */
export const STORAGE_KEYS = {
  SELECTED_RESTAURANT_ID: '@selected_restaurant_id',
  SELECTED_RESTAURANT_DATA: '@selected_restaurant_data',  
  SELECTED_RESTAURANT_ROLE: '@selected_restaurant_role',
} as const;

/**
 * Restaurant storage utility functions
 */
export const restaurantStorage = {
  async saveRestaurant(restaurantId: string, restaurantData: any, role: string) {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.SELECTED_RESTAURANT_ID, restaurantId],
        [STORAGE_KEYS.SELECTED_RESTAURANT_DATA, JSON.stringify(restaurantData)],
        [STORAGE_KEYS.SELECTED_RESTAURANT_ROLE, role],
      ]);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du restaurant:', error);
      throw error;
    }
  },

  async loadRestaurant() {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.SELECTED_RESTAURANT_ID,
        STORAGE_KEYS.SELECTED_RESTAURANT_DATA,
        STORAGE_KEYS.SELECTED_RESTAURANT_ROLE,
      ]);

      return {
        restaurantId: values[0][1],
        restaurantData: values[1][1] ? JSON.parse(values[1][1]) : null,
        role: values[2][1],
      };
    } catch (error) {
      console.error('Erreur lors du chargement du restaurant:', error);
      return { restaurantId: null, restaurantData: null, role: null };
    }
  },

  async clearRestaurant() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SELECTED_RESTAURANT_ID,
        STORAGE_KEYS.SELECTED_RESTAURANT_DATA,
        STORAGE_KEYS.SELECTED_RESTAURANT_ROLE,
      ]);
    } catch (error) {
      console.error('Erreur lors de la suppression du restaurant:', error);
      throw error;
    }
  }
};

export default restaurantStorage;
