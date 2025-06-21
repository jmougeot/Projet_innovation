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
  email: string;
  points: number;
  level: number;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Convert email to a valid Firestore document ID
 * @param email - The email to convert
 * @returns string - Valid Firestore document ID
 */
export function emailToDocId(email: string): string {
  // Remplacer seulement les caractères vraiment problématiques pour Firestore
  // Le point (.) est remplacé par un tiret (-) pour plus de lisibilité
  return email.replace(/[.#$\/\[\]]/g, (match) => {
    if (match === '.') return '-';
    return '_';
  });
}

/**
 * Register a new user
 * @param userData - User registration data
 * @returns Promise<User> - The created user
 */
export async function signUpUser(userData: UserRegistrationData): Promise<User> {
  try {
    const { email, password, firstName, lastName } = userData;
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const emailDocId = emailToDocId(email); // Utiliser l'email comme ID

    // Create user profile in Firestore
    const userProfile: Omit<UserProfile, 'id'> = {
      email,
      points: 0,
      level: 1,
      firstName,
      lastName,
      createdAt: new Date(),
    };

    // Utiliser l'email comme ID de document au lieu de l'UID
    await setDoc(doc(db, "users", emailDocId), userProfile);

    // Invalider le cache après création d'utilisateur
    if (userProfilesCache[emailDocId]) {
      delete userProfilesCache[emailDocId];
    }
    console.log(`🔄 Cache de profil utilisateur ${emailDocId} invalidé après création`);

    console.log(`Utilisateur créé avec succès: ${email} (ID document: ${emailDocId})`);
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
  } catch (error: any) {
    console.error("Erreur lors de la connexion:", error);
    
    // Gestion spécifique des erreurs réseau
    if (error?.code === 'auth/network-request-failed') {
      console.error("🔴 Erreur réseau: Vérifiez votre connexion internet et les paramètres du simulateur");
      throw new Error("Erreur de connexion réseau. Vérifiez votre connexion internet et redémarrez le simulateur.");
    }
    
    // Gestion des erreurs liées à la protection d'énumération d'emails
    if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password') {
      // Avec la protection d'énumération activée, ces erreurs peuvent être masquées
      console.warn("⚠️ Erreur d'authentification (protection d'énumération activée)");
      throw new Error("Email ou mot de passe incorrect.");
    }
    
    // Gestion des erreurs de quota/limite de taux
    if (error?.code === 'auth/too-many-requests') {
      console.error("🔴 Trop de tentatives de connexion");
      throw new Error("Trop de tentatives de connexion. Veuillez réessayer plus tard.");
    }
    
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
 * Get user profile from Firestore using email
 * @param userEmail - The user email (or already converted doc ID)
 * @returns Promise<UserProfile | null>
 */
export async function getUserProfile(userEmail: string): Promise<UserProfile | null> {
  try {
    const now = Date.now();
    const emailDocId = emailToDocId(userEmail); // Convertir l'email en ID de document valide
    
    // Vérifier le cache d'abord
    if (userProfilesCache[emailDocId] && (now - lastAuthCacheUpdate) < AUTH_CACHE_DURATION) {
      console.log(`📦 Profil utilisateur ${emailDocId} récupéré depuis le cache`);
      return userProfilesCache[emailDocId];
    }
    
    const userRef = doc(db, "users", emailDocId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log(`❌ Aucun profil trouvé pour l'email: ${userEmail} (ID doc: ${emailDocId})`);
      return null;
    }

    const profile = {
      ...userDoc.data()
    } as UserProfile;
    
    // Mettre en cache
    userProfilesCache[emailDocId] = profile;
    lastAuthCacheUpdate = now;
    console.log(`💾 Profil utilisateur ${emailDocId} mis en cache`);

    return profile;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du profil utilisateur:", error);
    
    const emailDocId = emailToDocId(userEmail);
    // En cas d'erreur, retourner le cache si disponible
    if (userProfilesCache[emailDocId]) {
      console.log(`🔄 Utilisation du cache de secours pour le profil utilisateur ${emailDocId}`);
      return userProfilesCache[emailDocId];
    }
    
    throw error;
  }
}

/**
 * Get current user profile using their email from auth
 * @returns Promise<UserProfile | null>
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      console.log('❌ Aucun utilisateur connecté ou email manquant');
      return null;
    }

    return await getUserProfile(currentUser.email);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du profil utilisateur actuel:", error);
    return null;
  }
}

/**
 * Update user profile in Firestore
 * @param userEmail - The user email
 * @param updates - Partial user profile updates
 * @returns Promise<void>
 */
export async function updateUserProfile(userEmail: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const emailDocId = emailToDocId(userEmail);
    const userRef = doc(db, "users", emailDocId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    
    await setDoc(userRef, updateData, { merge: true });
    
    // Invalider le cache
    if (userProfilesCache[emailDocId]) {
      delete userProfilesCache[emailDocId];
    }
    
    console.log(`✅ Profil utilisateur ${emailDocId} mis à jour`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du profil utilisateur:", error);
    throw error;
  }
}

// Export all functions
export default { 
  signUpUser, 
  signInUser, 
  signOutUser, 
  getUserProfile,
  getCurrentUserProfile,
  updateUserProfile,
  emailToDocId,
  // Cache utilities
  clearAuthCache,
  getAuthCacheInfo
};