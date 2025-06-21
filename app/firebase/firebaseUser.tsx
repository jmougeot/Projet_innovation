import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  getDocs 
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { User } from "firebase/auth";
import { emailToDocId } from "./firebaseAuth";

/**
 * 📝 IMPORTANT: USER ID SYSTEM
 * 
 * Dans cette architecture V2:
 * - L'ID du document utilisateur dans Firestore est basé sur l'email (converti via emailToDocId)
 * - Les paramètres userId dans ce fichier peuvent être soit un email soit un ID de document déjà converti
 * - Pour une nouvelle intégration, utilisez getUserByEmail() qui gère automatiquement la conversion
 * - Les autres fonctions sont maintenues pour compatibilité mais peuvent nécessiter des ajustements
 */

// Interface for User data
export interface UserData {
  id: string;
  email: string;
  points?: number;
  level?: number;
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  Restaurant?: string[];
}

// Interface for point update operations
export interface PointsUpdate {
  employeeId: string;
  pointsToAdd: number;
  reason?: string;
}

// Cache local pour les utilisateurs - Durée moyenne car les données utilisateur changent occasionnellement
let usersCache: { [userId: string]: UserData } = {};
let allUsersCache: UserData[] | null = null;
let lastUsersCacheUpdate = 0;
const USERS_CACHE_DURATION = 180000; // 3 minutes - Les données utilisateur changent occasionnellement

// Fonctions utilitaires de cache pour les utilisateurs
export const clearUsersCache = () => {
  usersCache = {};
  allUsersCache = null;
  lastUsersCacheUpdate = 0;
  console.log('🗑️ Cache des utilisateurs vidé');
};

export const getUsersCacheInfo = () => {
  const now = Date.now();
  const timeLeft = Object.keys(usersCache).length > 0 ? Math.max(0, USERS_CACHE_DURATION - (now - lastUsersCacheUpdate)) : 0;
  return {
    isActive: Object.keys(usersCache).length > 0,
    itemsCount: Object.keys(usersCache).length,
    allUsersCount: allUsersCache?.length || 0,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: USERS_CACHE_DURATION,
    durationFormatted: `${USERS_CACHE_DURATION / 60000}min`
  };
};

/**
 * Update points for an employee
 * @param employeeId - The ID of the employee
 * @param pointsToAdd - Number of points to add (can be negative)
 * @returns Promise<void>
 */
export async function updatePoints(employeeId: string, pointsToAdd: number): Promise<void> {
  try {
    const userRef = doc(db, "users", employeeId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error(`Utilisateur avec l'ID ${employeeId} non trouvé`);
    }

    const userData = userDoc.data() as UserData;
    const currentPoints = userData.points || 0;
    const newPoints = Math.max(0, currentPoints + pointsToAdd); // Ensure points don't go negative

    await updateDoc(userRef, {
      points: newPoints,
      updatedAt: new Date(),
    });

    // Invalider le cache après la mise à jour
    if (usersCache[employeeId]) {
      delete usersCache[employeeId];
    }
    allUsersCache = null;
    console.log(`🔄 Cache utilisateur invalidé pour ${employeeId}`);

    console.log(`✅ Points mis à jour avec succès pour l'utilisateur ${employeeId}. Nouveaux points: ${newPoints}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des points:", error);
    throw error;
  }
}

/**
 * Calculate user level based on points
 * @param points - Number of points
 * @returns The calculated level
 */
export function calculateLevel(points: number): number {
  if (points < 0) return 1;
  return Math.floor(points / 100) + 1; // 100 points = level 2, 200 points = level 3, etc.
}

/**
 * Update points and recalculate level for an employee
 * @param employeeId - The ID of the employee
 * @param pointsToAdd - Number of points to add
 * @returns Promise<void>
 */
export async function updatePointsAndLevel(employeeId: string, pointsToAdd: number): Promise<void> {
  try {
    const userRef = doc(db, "users", employeeId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error(`Utilisateur avec l'ID ${employeeId} non trouvé`);
    }

    const userData = userDoc.data() as UserData;
    const currentPoints = userData.points || 0;
    const newPoints = Math.max(0, currentPoints + pointsToAdd);
    const newLevel = calculateLevel(newPoints);

    await updateDoc(userRef, {
      points: newPoints,
      level: newLevel,
      updatedAt: new Date(),
    });

    // Invalider le cache après la mise à jour
    if (usersCache[employeeId]) {
      delete usersCache[employeeId];
    }
    allUsersCache = null;
    console.log(`🔄 Cache utilisateur invalidé pour ${employeeId}`);

    console.log(`✅ Points et niveau mis à jour avec succès pour l'utilisateur ${employeeId}. Points: ${newPoints}, Niveau: ${newLevel}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des points et du niveau:", error);
    throw error;
  }
}

/**
 * Get user data by ID
 * @param userId - The ID of the user
 * @returns Promise<UserData | null>
 */
export async function getUserById(userId: string): Promise<UserData | null> {
  try {
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (usersCache[userId] && (now - lastUsersCacheUpdate) < USERS_CACHE_DURATION) {
      console.log(`📦 Utilisateur ${userId} récupéré depuis le cache`);
      return usersCache[userId];
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = {
      id: userDoc.id,
      ...userDoc.data()
    } as UserData;

    // Mettre en cache
    usersCache[userId] = userData;
    if (Object.keys(usersCache).length === 1) {
      lastUsersCacheUpdate = now;
    }
    console.log(`💾 Utilisateur ${userId} mis en cache`);

    return userData;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'utilisateur:", error);
    
    // Essayer de retourner depuis le cache en cas d'erreur
    if (usersCache[userId]) {
      console.log(`🔄 Retour des données cachées pour l'utilisateur ${userId} en raison d'une erreur`);
      return usersCache[userId];
    }
    
    throw error;
  }
}

/**
 * Get all users
 * @returns Promise<UserData[]>
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (allUsersCache && (now - lastUsersCacheUpdate) < USERS_CACHE_DURATION) {
      console.log(`📦 Liste des utilisateurs récupérée depuis le cache (${allUsersCache.length} utilisateurs)`);
      return allUsersCache;
    }

    const usersSnapshot = await getDocs(collection(db, "users"));
    const users: UserData[] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = {
        id: doc.id,
        ...doc.data()
      } as UserData;
      
      users.push(userData);
      // Mettre à jour le cache individuel aussi
      usersCache[doc.id] = userData;
    });

    // Mettre en cache la liste complète
    allUsersCache = users;
    lastUsersCacheUpdate = now;
    console.log(`💾 Liste des utilisateurs mise en cache (${users.length} utilisateurs)`);

    return users;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
    
    // Essayer de retourner depuis le cache en cas d'erreur
    if (allUsersCache) {
      console.log(`🔄 Retour des données cachées des utilisateurs en raison d'une erreur (${allUsersCache.length} utilisateurs)`);
      return allUsersCache;
    }
    
    throw error;
  }
}

/**
 * Find a user by email address
 * @param email - The email address to search for
 * @returns Promise<UserData | null> - The user data if found, null otherwise
 */
export async function getUserByEmail(email: string): Promise<UserData | null> {
  try {
    console.log(`🔍 Recherche de l'utilisateur avec l'email: ${email}`);
    
    // Utiliser l'email comme ID de document directement
    const emailDocId = emailToDocId(email);
    const userRef = doc(db, "users", emailDocId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email} (ID doc: ${emailDocId})`);
      return null;
    }
    
    const userData = userDoc.data() as UserData;
    console.log(`✅ Utilisateur trouvé avec l'email ${email}: ${emailDocId}`);
    return { ...userData, id: emailDocId };
  } catch (error) {
    console.error("❌ Erreur lors de la recherche de l'utilisateur par email:", error);
    throw error;
  }
}

/**
 * Add restaurant ID to a user's Restaurant array
 * @param userId - The ID of the user
 * @param restaurantId - The ID of the restaurant to add
 * @returns Promise<void>
 */
export async function addRestaurantToUserArray(userId: string, restaurantId: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log(`⚠️ Utilisateur avec l'ID ${userId} non trouvé, création d'un enregistrement de base...`);
      
      // Create a basic user record with the restaurant
      const basicUserData: Partial<UserData> = {
        id: userId,
        email: '', // Will be updated later if needed
        Restaurant: [restaurantId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(userRef, basicUserData);
      console.log(`✅ Enregistrement utilisateur de base créé pour ${userId} avec restaurant ${restaurantId}`);
      return;
    }

    const userData = userDoc.data() as UserData;
    const currentRestaurants = userData.Restaurant || [];
    
    // Add restaurant if not already in the array
    if (!currentRestaurants.includes(restaurantId)) {
      const updatedRestaurants = [...currentRestaurants, restaurantId];
      
      await updateDoc(userRef, {
        Restaurant: updatedRestaurants,
        updatedAt: new Date(),
      });

      // Invalider le cache après la mise à jour
      if (usersCache[userId]) {
        delete usersCache[userId];
      }
      allUsersCache = null;
      console.log(`🔄 Cache utilisateur invalidé pour ${userId}`);

      console.log(`✅ Restaurant ${restaurantId} ajouté avec succès à l'utilisateur ${userId}`);
    } else {
      console.log(`ℹ️ Restaurant ${restaurantId} déjà associé à l'utilisateur ${userId}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du restaurant à l'utilisateur:", error);
    throw error;
  }
}

/**
 * Remove restaurant ID from a user's Restaurant array
 * @param userId - The ID of the user
 * @param restaurantId - The ID of the restaurant to remove
 * @returns Promise<void>
 */
export async function removeRestaurantFromUserArray(userId: string, restaurantId: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log(`⚠️ Utilisateur avec l'ID ${userId} non trouvé`);
      return;
    }

    const userData = userDoc.data() as UserData;
    const currentRestaurants = userData.Restaurant || [];
    
    // Remove restaurant from the array
    const updatedRestaurants = currentRestaurants.filter(id => id !== restaurantId);
    
    await updateDoc(userRef, {
      Restaurant: updatedRestaurants,
      updatedAt: new Date(),
    });

    // Invalider le cache après la mise à jour
    if (usersCache[userId]) {
      delete usersCache[userId];
    }
    allUsersCache = null;
    console.log(`🔄 Cache utilisateur invalidé pour ${userId}`);

    console.log(`✅ Restaurant ${restaurantId} retiré avec succès de l'utilisateur ${userId}`);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du restaurant de l'utilisateur:", error);
    throw error;
  }
}

/**
 * Get all restaurant IDs associated with a user
 * @param userId - The ID of the user
 * @returns Promise<string[] | undefined> - Array of restaurant IDs, or undefined if user not found
 */
export async function getAllRestaurantToUser(userId: string): Promise<string[] | undefined> {
  try {
    console.log(`🔍 Récupération des restaurants pour l'utilisateur: ${userId}`);
    
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`⚠️ Utilisateur avec l'ID ${userId} non trouvé`);
      return undefined;
    }
    
    const userData = userDoc.data() as UserData;
    if (!userData.Restaurant) {
      console.log(`ℹ️ Aucun restaurant associé à l'utilisateur ${userId}`);
      return [];
    }
    
    // Dédupliquer les IDs de restaurants
    const restaurantIds = userData.Restaurant as string[];
    const uniqueRestaurantIds = [...new Set(restaurantIds)];
    
    if (restaurantIds.length !== uniqueRestaurantIds.length) {
      console.log(`🔄 Doublons détectés et supprimés: ${restaurantIds.length} → ${uniqueRestaurantIds.length}`);
    }
    
    console.log(`✅ Restaurants uniques trouvés pour l'utilisateur ${userId}:`, uniqueRestaurantIds);
    return uniqueRestaurantIds;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des restaurants de l'utilisateur:", error);
    throw error;
  }
}


// Export all functions
export default {
  updatePoints,
  calculateLevel,
  updatePointsAndLevel,
  getUserById,
  getAllUsers,
  clearUsersCache,
  getUsersCacheInfo,
  getUserByEmail,
  addRestaurantToUserArray,
  removeRestaurantFromUserArray,
  getAllRestaurantToUser,
};
