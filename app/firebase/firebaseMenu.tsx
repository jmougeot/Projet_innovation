import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export interface Plat {
    id?: string;
    name: string;
    category: string;
    price: number;
    description?: string;
}


export async function ajout_plat(plat: Plat) {
  try {
    const docRef = await addDoc(collection(db, "menu"), {
      name: plat.name,
      category: plat.category,
      price: plat.price
    });
    console.log("Plat ajouté avec succès :", docRef.id);
  } catch (error) {
    console.error("Erreur lors de l'ajout du plat :", error);
  }
}

export async function get_plats() {
  try {
    const menuSnapshot = await getDocs(collection(db, "menu"));
    const menuItems:Plat[]= [];
    menuSnapshot.forEach((doc) => {
      menuItems.push({ id: doc.id, ...(doc.data() as Omit<Plat, 'id'>) });
    });
    if (menuItems.length === 0) {
      return [];
    }
    return menuItems;
  } catch (error) {
    console.error("Erreur lors de la récupération du menu :", error);
    throw error; 
  }
}