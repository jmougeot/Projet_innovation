// Firebase configuration and initialization
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User 
} from 'firebase/auth';
import { 
  initializeFirestore,
  Firestore,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  enableNetwork,
  disableNetwork,
  terminate
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage,
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  getFunctions,
  Functions,
  connectFunctionsEmulator
} from 'firebase/functions';

// User data interface
export interface UserData {
  name?: string;
  email: string;
  role?: string;
  points?: number;
  level?: number;
  dateCreation?: string;
  imageUrl?: string;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDllPuUabosWXG7XmNrkm8UFQquGv4-A4",
  authDomain: "app-restaurant-a6370.firebaseapp.com",
  projectId: "app-restaurant-a6370",
  storageBucket: "app-restaurant-a6370.firebasestorage.app",
  messagingSenderId: "440903464604",
  appId: "1:440903464604:web:1bd7a444de550870391f59",
  measurementId: "G-HPWLGNB53F"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);

// ✅ CACHE FIREBASE OPTIMISÉ - Configuration moderne avec cache
const firestoreSettings = {
  localCache: {
    kind: 'persistent' as const,
  }
};

const db: Firestore = initializeFirestore(app, firestoreSettings);
const storage: FirebaseStorage = getStorage(app);
const functions: Functions = getFunctions(app);

// ✅ Connect to Functions emulator in development
if (process.env.NODE_ENV === 'development') {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔧 Connected to Functions emulator');
  } catch (error) {
    console.log('ℹ️ Functions emulator not available');
  }
}

// ✅ Confirmation du cache activé
console.log('✅ Cache Firebase activé - Mode offline disponible')
console.log('� Vos données sont maintenant disponibles hors ligne !')

// Utilitaires pour gérer la connexion et le cache
export const goOffline = () => {
  console.log('📴 Mode offline activé')
  return disableNetwork(db)
}

export const goOnline = () => {
  console.log('📶 Mode online activé') 
  return enableNetwork(db)
}

// Fonction pour vider le cache (utile pour le debug)
export const clearCache = async () => {
  try {
    // Avec Firebase v9+, nous devons terminer la connexion et redémarrer
    await terminate(db)
    console.log('🗑️ Cache Firebase vidé avec succès (connexion terminée)')
    return true
  } catch (error) {
    console.error('❌ Erreur lors du vidage du cache:', error)
    return false
  }
}

// Fonction pour vérifier l'état de la connexion
export const checkConnectionStatus = () => {
  return navigator.onLine || false
}

// Export Firebase instances
export { auth, db, storage, functions };

// Utility functions for user management
export const createUser = async (email: string, password: string, userData: Partial<UserData>): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      email,
      dateCreation: new Date().toISOString()
    });
    
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { 
        id: userId, 
        email: userData?.email || '',
        ...userData 
      } as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};

export const updateUserData = async (userId: string, data: Partial<UserData>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), data);
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};

export const uploadImage = async (userId: string, uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const storageRef = ref(storage, `profile_images/${userId}`);
    await uploadBytes(storageRef, blob);
    
    const downloadURL = await getDownloadURL(storageRef);
    await updateDoc(doc(db, 'users', userId), { imageUrl: downloadURL });
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Enhanced error handling for connection issues
export const handleFirebaseError = (error: any, operation: string, fallbackData?: any) => {
  console.log(`🔍 Firebase error in ${operation}:`, error);
  
  // Network connection errors
  if (error.code === 'unavailable' || error.message?.includes('Failed to get document')) {
    console.log('📡 Network issue detected - Firebase will retry automatically');
    console.log('💾 Using cached data if available');
    return fallbackData;
  }
  
  // Real-time listener errors
  if (error.message?.includes('Listen') || error.message?.includes('RPC')) {
    console.log('🔄 Real-time connection interrupted - will reconnect automatically');
    console.log('📦 Cached data remains available');
    return fallbackData;
  }
  
  // Permission errors
  if (error.code === 'permission-denied') {
    console.error('🚫 Permission denied - check Firestore rules');
    throw error;
  }
  
  // Unknown errors
  console.warn('⚠️ Unknown Firebase error - app continues with cache:', error);
  return fallbackData || null;
};

// Connection status monitoring
let connectionStatus = 'unknown';

export const getConnectionStatus = () => connectionStatus;

export const monitorFirebaseConnection = () => {
  const checkConnection = async () => {
    try {
      await enableNetwork(db);
      if (connectionStatus !== 'online') {
        connectionStatus = 'online';
        console.log('🟢 Firebase connection restored');
      }
    } catch (error) {
      if (connectionStatus !== 'offline') {
        connectionStatus = 'offline';
        console.log('🔴 Firebase offline - using cached data', error);
      }
    }
  };

  // Check immediately
  checkConnection();
  
  // Check every 30 seconds
  const interval = setInterval(checkConnection, 30000);
  
  return () => clearInterval(interval);
};

export default app;
