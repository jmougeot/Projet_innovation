// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
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
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

// Configuration Firebase - À remplacer par vos propres valeurs
const firebaseConfig = {
  apiKey: "AIzaSyDDllPuUabosWXG7XmNrkm8UFQquGv4-A4",
  authDomain: "app-restaurant-a6370.firebaseapp.com",
  projectId: "app-restaurant-a6370",
  storageBucket: "app-restaurant-a6370.firebasestorage.app",
  messagingSenderId: "440903464604",
  appId: "1:440903464604:web:1bd7a444de550870391f59",
  measurementId: "G-HPWLGNB53F"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);
const storage = getStorage(app);

// Fonction pour créer un nouvel utilisateur
const createUser = async (email, password, userData) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  await setDoc(doc(db, 'users', user.uid), {
    ...userData,
    email,
    dateCreation: new Date().toISOString()
  });
  
  return user;
};

// Fonction pour se connecter
const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Fonction pour se déconnecter
const logoutUser = () => {
  return signOut(auth);
};

// Fonction pour obtenir les données d'un utilisateur
const getUserData = async (userId) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return { id: userId, ...userDoc.data() };
  }
  return null;
};

// Fonction pour mettre à jour les données d'un utilisateur
const updateUserData = (userId, data) => {
  return updateDoc(doc(db, 'users', userId), data);
};

// Fonction pour uploader une image
const uploadImage = async (userId, uri) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  
  const storageRef = ref(storage, `profile_images/${userId}`);
  await uploadBytes(storageRef, blob);
  
  const downloadURL = await getDownloadURL(storageRef);
  await updateDoc(doc(db, 'users', userId), { imageUrl: downloadURL });
  
  return downloadURL;
};

// Exporter les fonctions et services
export {
  initializeApp,
  getAuth,
  getFirestore,
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  doc,
  getDoc,
  setDoc,  // Assurez-vous que setDoc est exporté
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  signOut,
  createUser,
  loginUser,
  logoutUser,
  getUserData,
  updateUserData,
  uploadImage
};

export default app;