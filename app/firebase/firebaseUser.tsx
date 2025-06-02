import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  getDocs 
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Interface for User data
export interface UserData {
  id: string;
  email: string;
  role: string;
  points?: number;
  level?: number;
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
  updatedAt?: Date;
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

// Export all functions
export default {
  updatePoints,
  calculateLevel,
  updatePointsAndLevel,
  getUserById,
  getAllUsers,
  clearUsersCache,
  getUsersCacheInfo,
};
