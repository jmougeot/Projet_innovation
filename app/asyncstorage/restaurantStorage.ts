import AsyncStorage from '@react-native-async-storage/async-storage';

// ====== TYPE RESTAURANT SÉCURISÉ ======
export interface RestaurantSession {
  restaurantId: string;
  sessionToken: string;
  selectedAt: Date;
  expiresAt: Date;
}

// Interface pour l'authentification (ne jamais stocker le mot de passe)
export interface RestaurantAuth {
  restaurantId: string;
  password: string; // Seulement pour la connexion, jamais stocké
}


// ====== STORAGE KEYS ======
const STORAGE_KEYS = {
  SELECTED_RESTAURANT: 'selected_restaurant_session',
} as const;

// ====== SIMPLE ENCRYPTION (pour AsyncStorage) ======
const ENCRYPTION_KEY = 'restaurant_session_key_2025';

const simpleEncrypt = (text: string): string => {
  // Simple XOR encryption pour AsyncStorage (web compatible)
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return btoa(result); // Base64 encode
};

const simpleDecrypt = (encryptedText: string): string => {
  try {
    const decoded = atob(encryptedText); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return result;
  } catch (error) {
    console.error('Erreur décryptage:', error);
    return '';
  }
};

// ====== GESTION SESSION RESTAURANT SÉCURISÉE ======

export const saveRestaurantSession = async (
  restaurantId: string, 
  sessionToken: string
): Promise<void> => {
  try {
    const sessionData: RestaurantSession = {
      restaurantId,
      sessionToken,
      selectedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    };
    
    const dataToSave = {
      ...sessionData,
      selectedAt: sessionData.selectedAt.toISOString(),
      expiresAt: sessionData.expiresAt.toISOString()
    };
    
    // Crypter les données avant stockage
    const encryptedData = simpleEncrypt(JSON.stringify(dataToSave));
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_RESTAURANT, encryptedData);
    console.log(`✅ [RESTAURANT_STORAGE] Session restaurant sauvegardée: ${restaurantId}`);
    
  } catch (error) {
    console.error(`❌ [RESTAURANT_STORAGE] Erreur sauvegarde session:`, error);
    throw error;
  }
};

export const getRestaurantSession = async (): Promise<RestaurantSession | null> => {
  try {
    const encryptedSessionStr = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_RESTAURANT);
    if (!encryptedSessionStr) return null;
    
    // Décrypter les données
    const sessionStr = simpleDecrypt(encryptedSessionStr);
    if (!sessionStr) return null;
    
    const sessionData = JSON.parse(sessionStr);
    
    // Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    
    if (now > expiresAt) {
      await clearRestaurantSession();
      console.log(`⏰ [RESTAURANT_STORAGE] Session expirée pour: ${sessionData.restaurantId}`);
      return null;
    }
    
    return {
      ...sessionData,
      selectedAt: new Date(sessionData.selectedAt),
      expiresAt: new Date(sessionData.expiresAt)
    };
    
  } catch (error) {
    console.error(`❌ [RESTAURANT_STORAGE] Erreur récupération session:`, error);
    return null;
  }
};

export const clearRestaurantSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_RESTAURANT);
    console.log(`✅ [RESTAURANT_STORAGE] Session restaurant supprimée`);
  } catch (error) {
    console.error(`❌ [RESTAURANT_STORAGE] Erreur suppression session:`, error);
    throw error;
  }
};

export const hasValidRestaurantSession = async (): Promise<boolean> => {
  const session = await getRestaurantSession();
  return session !== null;
};

// ====== FONCTION DE VÉRIFICATION DE SÉCURITÉ ======
export const validateRestaurantAccess = async (requiredRestaurantId: string): Promise<boolean> => {
  const session = await getRestaurantSession();
  return session?.restaurantId === requiredRestaurantId;
};
