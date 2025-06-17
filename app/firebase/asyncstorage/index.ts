import AsyncStorage from '@react-native-async-storage/async-storage';

// ====== CONSTANTES ======
export const STORAGE_KEYS = {
  // Authentification
  USER_SESSION: '@user_session',
  USER_PREFERENCES: '@user_preferences',
  
  // Restaurant
  CURRENT_RESTAURANT: '@current_restaurant',
  RESTAURANT_LIST: '@restaurant_list',
  RESTAURANT_SETTINGS: '@restaurant_settings',
  
  // Room/Salle
  SELECTED_ROOM: '@selected_room',
  ROOM_HISTORY: '@room_history',
  ROOM_PREFERENCES: '@room_preferences',
  
  // Cache données
  TICKETS_CACHE: '@tickets_cache',
  MENU_CACHE: '@menu_cache',
  MISSIONS_CACHE: '@missions_cache',
  STOCK_CACHE: '@stock_cache',
  
  // Application
  APP_CONFIG: '@app_config',
  LAST_SYNC: '@last_sync',
  OFFLINE_DATA: '@offline_data',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// ====== UTILITAIRES DE BASE ======

/**
 * Stocker une valeur dans AsyncStorage
 */
export const setItem = async (key: StorageKey, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`📱 [STORAGE] Sauvegardé: ${key}`);
  } catch (error) {
    console.error(`❌ [STORAGE] Erreur sauvegarde ${key}:`, error);
    throw error;
  }
};

/**
 * Récupérer une valeur depuis AsyncStorage
 */
export const getItem = async <T = any>(key: StorageKey): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue === null) {
      console.log(`📱 [STORAGE] Aucune donnée pour: ${key}`);
      return null;
    }
    const result = JSON.parse(jsonValue);
    console.log(`📱 [STORAGE] Récupéré: ${key}`);
    return result;
  } catch (error) {
    console.error(`❌ [STORAGE] Erreur lecture ${key}:`, error);
    return null;
  }
};

/**
 * Supprimer une valeur d'AsyncStorage
 */
export const removeItem = async (key: StorageKey): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`📱 [STORAGE] Supprimé: ${key}`);
  } catch (error) {
    console.error(`❌ [STORAGE] Erreur suppression ${key}:`, error);
    throw error;
  }
};

/**
 * Stocker plusieurs valeurs en une fois
 */
export const setMultipleItems = async (items: Array<[StorageKey, any]>): Promise<void> => {
  try {
    const formattedItems: Array<[string, string]> = items.map(([key, value]) => [
      key,
      JSON.stringify(value)
    ]);
    await AsyncStorage.multiSet(formattedItems);
    console.log(`📱 [STORAGE] Sauvegarde multiple: ${items.length} éléments`);
  } catch (error) {
    console.error(`❌ [STORAGE] Erreur sauvegarde multiple:`, error);
    throw error;
  }
};

/**
 * Récupérer plusieurs valeurs en une fois
 */
export const getMultipleItems = async <T = any>(keys: StorageKey[]): Promise<Record<string, T | null>> => {
  try {
    const values = await AsyncStorage.multiGet(keys);
    const result: Record<string, T | null> = {};
    
    values.forEach(([key, value]) => {
      try {
        result[key] = value ? JSON.parse(value) : null;
      } catch (parseError) {
        console.error(`❌ [STORAGE] Erreur parsing ${key}:`, parseError);
        result[key] = null;
      }
    });
    
    console.log(`📱 [STORAGE] Récupération multiple: ${keys.length} éléments`);
    return result;
  } catch (error) {
    console.error(`❌ [STORAGE] Erreur lecture multiple:`, error);
    throw error;
  }
};

/**
 * Supprimer plusieurs valeurs en une fois
 */
export const removeMultipleItems = async (keys: StorageKey[]): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(keys);
    console.log(`📱 [STORAGE] Suppression multiple: ${keys.length} éléments`);
  } catch (error) {
    console.error(`❌ [STORAGE] Erreur suppression multiple:`, error);
    throw error;
  }
};

/**
 * Vider complètement AsyncStorage
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log(`📱 [STORAGE] Storage vidé complètement`);
  } catch (error) {
    console.error(`❌ [STORAGE] Erreur vidage complet:`, error);
    throw error;
  }
};

/**
 * Obtenir toutes les clés stockées
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log(`📱 [STORAGE] ${keys.length} clés trouvées`);
    return keys;
  } catch (error) {
    console.error(`❌ [STORAGE] Erreur récupération clés:`, error);
    throw error;
  }
};

/**
 * Obtenir des informations sur le storage
 */
export const getStorageInfo = async () => {
  try {
    const keys = await getAllKeys();
    const appKeys = keys.filter(key => key.startsWith('@'));
    
    return {
      totalKeys: keys.length,
      appKeys: appKeys.length,
      otherKeys: keys.length - appKeys.length,
      keys: keys,
      appSpecificKeys: appKeys
    };
  } catch (error) {
    console.error(`❌ [STORAGE] Erreur info storage:`, error);
    throw error;
  }
};

// ====== EXPORT PAR DÉFAUT ======
export default {
  // Opérations de base
  setItem,
  getItem,
  removeItem,
  
  // Opérations multiples
  setMultipleItems,
  getMultipleItems,
  removeMultipleItems,
  
  // Utilitaires
  clearAll,
  getAllKeys,
  getStorageInfo,
  
  // Constantes
  KEYS: STORAGE_KEYS
};
