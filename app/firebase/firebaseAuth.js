// src/firebase/firebaseAuth.js
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { db } from "./firebaseConfig";
import { setDoc, doc } from "firebase/firestore";

const auth = getAuth(); // Instance d'authentification

// Fonction d'inscription
export async function signUpUser(email, password, name, role) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Ajouter l'utilisateur dans Firestore
    await setDoc(doc(db, "users", userId), {
      name,
      email,
      role,      // "manager" ou "employee"
      points: 0, // Points initiaux
      level:1, // Niveau initial
    });

    return userCredential.user;
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error.message);
    throw error;
  }
}

// Fonction de connexion
export async function signInUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Erreur lors de la connexion :", error.message);
    throw error;
  }
}
export {auth};