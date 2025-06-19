import AsyncStorage from '@react-native-async-storage/async-storage';

// ====== TYPE RESTAURANT SÉCURISÉ ======
export interface RestaurantSession {
  restaurantId: string;
  selectedAt: Date;
  expiresAt: Date;
}

const RESTAURANT_STORAGE_KEY = 'selected_restaurant';

const SetSelectedRestaurantiD = async (restaurantId : string) : Promise<void> => {
  try {
    await AsyncStorage.setItem(RESTAURANT_STORAGE_KEY, restaurantId)
    console.log(`✅ [RESTAURANT_STORAGE] Restaurant sélectionné mémorisé: ${restaurantId}`);
    } catch (error) {
    console.error('❌ [RESTAURANT_STORAGE] Erreur mémorisation restaurant:', error);
    throw error;
  }
};

/**
 * 
 * @returns ID du restaurant sélectionné ou null si aucun n'est trouvé
 */

const GetSelectedRestaurantId = async () : Promise<string | null> => {
    try {
        const selectedrestaurantId = await AsyncStorage.getItem(RESTAURANT_STORAGE_KEY);
        if (selectedrestaurantId) {
            console.log(`✅ [RESTAURANT_STORAGE] Restaurant sélectionné récupéré: ${selectedrestaurantId}`);
            return selectedrestaurantId;
        } else {
            console.log('ℹ️ [RESTAURANT_STORAGE] Aucun restaurant sélectionné trouvé');
            return null;
        }
    } catch (error) {
        console.error('❌ [RESTAURANT_STORAGE] Erreur récupération restaurant sélectionné:', error);
        return null;
    }
};

export default { SetSelectedRestaurantiD, GetSelectedRestaurantId };