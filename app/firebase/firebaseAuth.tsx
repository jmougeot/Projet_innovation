import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User 
} from "firebase/auth";
import { db, auth } from "./firebaseConfig";
import { setDoc, doc, getDoc } from "firebase/firestore";

// ---- CACHE CONFIGURATION ----
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

// Variables de cache
let userProfilesCache: { [userId: string]: UserProfile } = {};
let lastAuthCacheUpdate = 0;

// ---- CACHE UTILITIES ----
export const clearAuthCache = () => {
  userProfilesCache = {};
  lastAuthCacheUpdate = 0;
  console.log('🧹 Cache d\'authentification nettoyé');
};

export const getAuthCacheInfo = () => {
  const now = Date.now();
  const cacheAge = now - lastAuthCacheUpdate;
  const isValid = cacheAge < AUTH_CACHE_DURATION;
  
  return {
    cacheSize: Object.keys(userProfilesCache).length,
    cacheAge: Math.round(cacheAge / 1000), // en secondes
    isValid,
    duration: AUTH_CACHE_DURATION / 1000 // en secondes
  };
};

// Interface for user registration data
export interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

// Interface for user login data
export interface UserLoginData {
  email: string;
  password: string;
}

// Interface for user profile in Firestore
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  level: number;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Register a new user
 * @param userData - User registration data
 * @returns Promise<User> - The created user
 */
export async function signUpUser(userData: UserRegistrationData): Promise<User> {
  try {
    const { email, password, name, role, firstName, lastName } = userData;
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Create user profile in Firestore
    const userProfile: Omit<UserProfile, 'id'> = {
      name,
      email,
      role,
      points: 0,
      level: 1,
      firstName,
      lastName,
      createdAt: new Date(),
    };

    await setDoc(doc(db, "users", userId), userProfile);

    // Invalider le cache après création d'utilisateur
    if (userProfilesCache[userId]) {
      delete userProfilesCache[userId];
    }
    console.log(`🔄 Cache de profil utilisateur ${userId} invalidé après création`);

    console.log(`Utilisateur créé avec succès: ${email}`);
    return userCredential.user;
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    throw error;
  }
}

/**
 * Sign in a user
 * @param loginData - User login data
 * @returns Promise<User> - The signed in user
 */
export async function signInUser(loginData: UserLoginData): Promise<User> {
  try {
    const { email, password } = loginData;
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Utilisateur connecté avec succès: ${email}`);
    return userCredential.user;
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    throw error;
  }
}

/**
 * Sign out the current user
 * @returns Promise<void>
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    console.log("Utilisateur déconnecté avec succès");
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    throw error;
  }
}

/**
 * Get user profile from Firestore
 * @param userId - The user ID
 * @returns Promise<UserProfile | null>
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (userProfilesCache[userId] && (now - lastAuthCacheUpdate) < AUTH_CACHE_DURATION) {
      console.log(`📦 Profil utilisateur ${userId} récupéré depuis le cache`);
      return userProfilesCache[userId];
    }
    
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const profile = {
      id: userDoc.id,
      ...userDoc.data()
    } as UserProfile;
    
    // Mettre en cache
    userProfilesCache[userId] = profile;
    lastAuthCacheUpdate = now;
    console.log(`💾 Profil utilisateur ${userId} mis en cache`);

    return profile;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du profil utilisateur:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (userProfilesCache[userId]) {
      console.log(`🔄 Utilisation du cache de secours pour le profil utilisateur ${userId}`);
      return userProfilesCache[userId];
    }
    
    throw error;
  }
}

// Export all functions
export default { 
  signUpUser, 
  signInUser, 
  signOutUser, 
  getUserProfile,
  // Cache utilities
  clearAuthCache,
  getAuthCacheInfo
};