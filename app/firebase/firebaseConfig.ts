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
  getFirestore, 
  Firestore,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage,
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

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
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// Export Firebase instances
export { auth, db, storage };

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
        role: userData?.role || '',
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

export default app;
