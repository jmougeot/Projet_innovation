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

    console.log(`Points mis à jour avec succès pour l'utilisateur ${employeeId}. Nouveaux points: ${newPoints}`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des points:", error);
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

    console.log(`Points et niveau mis à jour avec succès pour l'utilisateur ${employeeId}. Points: ${newPoints}, Niveau: ${newLevel}`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des points et du niveau:", error);
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
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data()
    } as UserData;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    throw error;
  }
}

/**
 * Get all users
 * @returns Promise<UserData[]>
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users: UserData[] = [];
    
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      } as UserData);
    });

    return users;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
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
};
