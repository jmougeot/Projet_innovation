import { db } from './firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  getDoc, 
  addDoc, 
  writeBatch, 
  serverTimestamp,
  Timestamp,
  limit,
  deleteDoc
} from 'firebase/firestore';

import { getUserByEmail, addRestaurantToUserArray, removeRestaurantFromUserArray } from './firebaseUser'

// ====== RESTAURANT INTERFACES ======

export interface RestaurantSettings {
  business_hours: {
    open_time: string;
    close_time: string;
    days_of_week: string[];
  };
  table_service_time: number; // minutes
  kitchen_capacity: number;
  currency: string;
  tax_rate: number;
  service_charge: number;
  default_room_name: string;
}

export interface UserMember {
  id: string;
  name: string;
  role: 'manager' | 'waiter' | 'chef' | 'cleaner';
  email: string;
  phone?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  manager_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  settings: RestaurantSettings;
  is_active: boolean;
  last_sync: Timestamp;
  user?: UserMember[];
}

// ====== COLLECTION CONSTANTS ======
const RESTAURANTS_COLLECTION = 'restaurants';

// ====== CACHE MANAGEMENT ======
let restaurantCache: { [restaurantId: string]: { data: Restaurant; timestamp: number } } = {};
const RESTAURANT_CACHE_DURATION = 300000; // 5 minutes

export const clearRestaurantCache = (restaurantId?: string) => {
  if (restaurantId) {
    delete restaurantCache[restaurantId];
    console.log(`🗑️ Cache du restaurant ${restaurantId} vidé`);
  } else {
    restaurantCache = {};
    console.log('🗑️ Cache de tous les restaurants vidé');
  }
};

// ====== HELPER FUNCTIONS ======

const getDefaultRestaurantSettings = (): RestaurantSettings => ({
  business_hours: {
    open_time: "08:00",
    close_time: "22:00",
    days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  },
  table_service_time: 90, // 1h30 par défaut
  kitchen_capacity: 50,
  currency: "EUR",
  tax_rate: 0.20, // 20% TVA
  service_charge: 0.0, // Pas de service par défaut
  default_room_name: "Salle principale"
});


// ====== STAFF MANAGEMENT ======

export const addUserMember = async (
  restaurantId: string,
  userData: Omit<UserMember, 'id'>
): Promise<string> => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    const userRef = collection(restaurantRef, 'user');
    
    // Generate unique ID for new user member
    const newUserRef = doc(userRef);
    const userId = newUserRef.id;
    
    const newUser: UserMember = {
      id: userId,
      ...userData
    };
    
    await setDoc(newUserRef, newUser);
    
    // Also add the restaurant to the user's account (if the user exists in the users collection)
    try {
      const existingUser = await getUserByEmail(userData.email);
      if (existingUser) {
        console.log(`🔗 Ajout du restaurant ${restaurantId} à l'utilisateur ${existingUser.id}`);
        await addRestaurantToUserArray(existingUser.id, restaurantId);
      } else {
        console.log(`ℹ️ Utilisateur avec l'email ${userData.email} non trouvé dans la collection users`);
      }
    } catch (userError) {
      console.warn('⚠️ Erreur lors de la mise à jour du compte utilisateur (non critique):', userError);
      // Don't throw here - the user member was created successfully in the restaurant
    }
    
    console.log(`✅ Membre du personnel ajouté avec l'ID: ${userId}`);
    return userId;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du membre du personnel:', error);
    throw error;
  }
};

export const addUserMemberWithUserId = async (
  restaurantId: string,
  userData: Omit<UserMember, 'id'>,
  userId?: string
): Promise<string> => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    const userRef = collection(restaurantRef, 'user');
    
    // Generate unique ID for new user member
    const newUserRef = doc(userRef);
    const memberId = newUserRef.id;
    
    const newUser: UserMember = {
      id: memberId,
      ...userData
    };
    
    await setDoc(newUserRef, newUser);
    
    // Also add the restaurant to the user's account (if userId is provided)
    if (userId) {
      try {
        console.log(`🔗 Ajout du restaurant ${restaurantId} à l'utilisateur ${userId}`);
        await addRestaurantToUserArray(userId, restaurantId);
      } catch (userError) {
        console.warn('⚠️ Erreur lors de la mise à jour du compte utilisateur (non critique):', userError);
        // Don't throw here - the user member was created successfully in the restaurant
      }
    } else {
      // Fallback to email search if no userId provided
      try {
        const existingUser = await getUserByEmail(userData.email);
        if (existingUser) {
          console.log(`🔗 Ajout du restaurant ${restaurantId} à l'utilisateur ${existingUser.id}`);
          await addRestaurantToUserArray(existingUser.id, restaurantId);
        } else {
          console.log(`ℹ️ Utilisateur avec l'email ${userData.email} non trouvé dans la collection users`);
        }
      } catch (userError) {
        console.warn('⚠️ Erreur lors de la mise à jour du compte utilisateur (non critique):', userError);
        // Don't throw here - the user member was created successfully in the restaurant
      }
    }
    
    console.log(`✅ Membre du personnel ajouté avec l'ID: ${memberId}`);
    return memberId;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du membre du personnel:', error);
    throw error;
  }
};

export const updateUserMember = async (
  restaurantId: string,
  userId: string,
  updateData: Partial<UserMember>
): Promise<void> => {
  try {
    const userRef = doc(db, RESTAURANTS_COLLECTION, restaurantId, 'user', userId);
    
    // Filter out undefined values to avoid Firebase errors
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(userRef, filteredUpdateData);
    
    console.log(`✅ Membre du personnel mis à jour avec l'ID: ${userId}`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du membre du personnel:', error);
    throw error;
  }
};

export const getUserMembers = async (restaurantId: string): Promise<UserMember[]> => {
  try {
    const userRef = collection(doc(db, RESTAURANTS_COLLECTION, restaurantId), 'user');
    const userSnapshot = await getDocs(userRef);
    
    const userList: UserMember[] = [];
    userSnapshot.forEach(doc => {
      userList.push({ id: doc.id, ...doc.data() } as UserMember);
    });
    
    console.log(`✅ ${userList.length} membres du personnel récupérés`);
    return userList;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des membres du personnel:', error);
    throw error;
  }
};

export const getUserMemberById = async (
  restaurantId: string,
  userId: string
): Promise<UserMember | null> => {
  try {
    const userRef = doc(db, RESTAURANTS_COLLECTION, restaurantId, 'user', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`❌ Membre du personnel non trouvé avec l'ID: ${userId}`);
      return null;
    }
    
    const userData = { id: userDoc.id, ...userDoc.data() } as UserMember;
    console.log(`✅ Membre du personnel récupéré avec l'ID: ${userId}`);
    return userData;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du membre du personnel:', error);
    throw error;
  }
}

export const getUserMembersRole = async (
  restaurantId: string,
  userId: string
): Promise<string | null> => {
  try {
    const userRef = doc(db, RESTAURANTS_COLLECTION, restaurantId, 'user', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`❌ Membre du personnel non trouvé avec l'ID: ${userId}`);
      return null;
    }
    
    const userData = userDoc.data() as UserMember;
    console.log(`✅ Rôle du membre du personnel récupéré: ${userData.role}`);
    return userData.role;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du rôle du membre du personnel:', error);
    throw error;
  }
}

export const deleteUserMember = async (
  restaurantId: string,
  userId: string
): Promise<void> => {
  try {
    const userRef = doc(db, RESTAURANTS_COLLECTION, restaurantId, 'user', userId);
    
    // Get the user data before deleting to access the email
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() as UserMember : null;
    
    // Delete the user member from the restaurant
    await deleteDoc(userRef);
    
    // Also remove the restaurant from the user's account (if the user exists in the users collection)
    if (userData?.email) {
      try {
        const existingUser = await getUserByEmail(userData.email);
        if (existingUser) {
          console.log(`🔗 Suppression du restaurant ${restaurantId} de l'utilisateur ${existingUser.id}`);
          await removeRestaurantFromUserArray(existingUser.id, restaurantId);
        } else {
          console.log(`ℹ️ Utilisateur avec l'email ${userData.email} non trouvé dans la collection users`);
        }
      } catch (userError) {
        console.warn('⚠️ Erreur lors de la mise à jour du compte utilisateur (non critique):', userError);
        // Don't throw here - the user member was deleted successfully from the restaurant
      }
    }
    
    console.log(`✅ Membre du personnel supprimé avec l'ID: ${userId}`);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du membre du personnel:', error);
    throw error;
  }
};


// ====== MAIN RESTAURANT FUNCTIONS ======

/**
 * 🏪 CREATE OR INITIALIZE RESTAURANT
 */
export const initializeRestaurant = async (
  restaurantData: Partial<Restaurant> = {}
): Promise<string> => {
  try {
    // Generate unique restaurant ID if not provided
    let restaurantId: string;
    let restaurantRef: any;
    
    if (restaurantData.id) {
      // Use provided ID
      restaurantId = restaurantData.id;
      restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    } else {
      // Generate new unique ID
      const tempRef = doc(collection(db, RESTAURANTS_COLLECTION));
      restaurantId = tempRef.id;
      restaurantRef = tempRef;
    }
    
    // Check if restaurant already exists
    const existingDoc = await getDoc(restaurantRef);
    if (existingDoc.exists()) {
      console.log(`✅ Restaurant déjà initialisé avec l'ID: ${restaurantId}`);
      return restaurantId;
    }

    console.log(`🏗️ Création du restaurant avec l'ID: ${restaurantId}`);

    const defaultRestaurant: Omit<Restaurant, 'id'> = {
      name: restaurantData.name || "Mon Restaurant",
      ...(restaurantData.manager_id && { manager_id: restaurantData.manager_id }),
      address: restaurantData.address || "",
      phone: restaurantData.phone || "",
      email: restaurantData.email || "",
      created_at: serverTimestamp() as Timestamp,
      updated_at: serverTimestamp() as Timestamp,
      settings: { ...getDefaultRestaurantSettings(), ...restaurantData.settings },
      is_active: true,
      last_sync: serverTimestamp() as Timestamp
    };

    await setDoc(restaurantRef, defaultRestaurant);
    
    // Initialize sub-collections
    await initializeRestaurantSubCollections(restaurantId);
    
    clearRestaurantCache();
    console.log(`✅ Restaurant initialisé avec l'ID: ${restaurantId}`);
    return restaurantId;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du restaurant:', error);
    throw error;
  }
};

/**
 * 🏗️ INITIALIZE SUB-COLLECTIONS
 */
const initializeRestaurantSubCollections = async (restaurantId: string) => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    
    // Initialize rooms sub-collection
    const roomsRef = collection(restaurantRef, 'rooms');
    const defaultRoom = {
      name: "Salle principale",
      capacity: 50,
      is_active: true,
      created_at: serverTimestamp()
    };
    await addDoc(roomsRef, defaultRoom);
    
    // Initialize tables sub-collection
    // Tables will be added separately using existing table functions
    
    // Initialize menu sub-collection
    // Menu items will be migrated from existing menu collection
    
    // Initialize stock sub-collection  
    // Stock items will be migrated from existing stock collection
    
    // Initialize analytics sub-collection
    const analyticsRef = collection(restaurantRef, 'analytics');
    const defaultAnalyticsDoc = {
      type: 'daily',
      date: new Date().toISOString().split('T')[0],
      revenue: 0,
      orders_count: 0,
      created_at: serverTimestamp()
    };
    await addDoc(analyticsRef, defaultAnalyticsDoc);
    
    console.log('✅ Sous-collections du restaurant initialisées');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des sous-collections:', error);
    throw error;
  }
};

/**
 * 🔍 GET RESTAURANT
 */
export const getRestaurant = async ( restaurantId: string, useCache: boolean = true
): Promise<Restaurant | null> => {
  try {
    const now = Date.now();
    
    // Check cache for this specific restaurant
    if (useCache && restaurantCache[restaurantId]) {
      const cachedEntry = restaurantCache[restaurantId];
      if ((now - cachedEntry.timestamp) < RESTAURANT_CACHE_DURATION) {
        console.log(`📱 Restaurant ${restaurantId} chargé depuis le cache local`);
        return cachedEntry.data;
      } else {
        // Cache expired, remove it
        delete restaurantCache[restaurantId];
      }
    }

    console.log(`🔄 Chargement du restaurant ${restaurantId} depuis Firebase...`);
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (!restaurantDoc.exists()) {
      console.log('❌ Restaurant non trouvé avec l\'ID:', restaurantId);
      throw new Error(`Restaurant avec l'ID ${restaurantId} non trouvé`);
    }

    const restaurantData = { 
      id: restaurantDoc.id, 
      ...restaurantDoc.data() 
    } as Restaurant;

    // Update cache for this specific restaurant
    restaurantCache[restaurantId] = {
      data: restaurantData,
      timestamp: now
    };
    
    console.log(`✅ Restaurant ${restaurantId} chargé et mis en cache`);
    return restaurantData;
  } catch (error) {
    console.error('❌ Erreur lors du chargement du restaurant:', error);
    
    // Fallback to cache if available, even if expired
    if (restaurantCache[restaurantId]) {
      console.log('🔄 Utilisation du cache expiré comme fallback');
      return restaurantCache[restaurantId].data;
    }
    
    throw error;
  }
};

/**
 * ✏️ UPDATE RESTAURANT
 */
export const updateRestaurant = async (
  restaurantId: string,
  updateData: Partial<Restaurant>
): Promise<void> => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    
    // Filter out undefined values to avoid Firebase errors
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    const updatedData = {
      ...filteredUpdateData,
      updated_at: serverTimestamp(),
      last_sync: serverTimestamp()
    };
    
    await updateDoc(restaurantRef, updatedData);
    
    clearRestaurantCache();
    console.log('✅ Restaurant mis à jour');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du restaurant:', error);
    throw error;
  }
};

/**
 * ⚙️ UPDATE RESTAURANT SETTINGS
 */
export const updateRestaurantSettings = async (
  restaurantId: string,
  settingsData: Partial<RestaurantSettings>
): Promise<void> => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    
    const updatedSettings = {
      settings: settingsData,
      updated_at: serverTimestamp()
    };
    
    await updateDoc(restaurantRef, updatedSettings);
    
    clearRestaurantCache();
    console.log('✅ Paramètres du restaurant mis à jour');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des paramètres:', error);
    throw error;
  }
};



// ====== EXPORTS ======

export default {
  // Core functions
  initializeRestaurant,
  getRestaurant,
  updateRestaurant,
  updateRestaurantSettings,

  // Cache management
  clearRestaurantCache
};