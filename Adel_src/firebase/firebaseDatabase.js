// src/firebase/firebaseDatabase.js
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

// Ajouter une commande
export async function addOrder(employeeId, items, totalPrice) {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      employeeId,
      items,
      totalPrice,
      status: "in progress", // État initial de la commande
      timestamp: new Date(),
    });
    console.log("Commande ajoutée avec succès :", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de la commande :", error);
    throw error;
  }
}


// Supprimer une commande avec archivage
export async function deleteOrder(orderId, errorReason) {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (orderDoc.exists()) {
      const orderData = { ...orderDoc.data(), deletedAt: new Date(), errorReason };
      await setDoc(doc(db, "archived_orders", orderId), orderData); // Archiver la commande
      await deleteDoc(doc(db, "orders", orderId)); // Supprimer la commande
      console.log("Commande supprimée et archivée !");
    }
  } catch (error) {
    console.error("Erreur lors de la suppression de la commande :", error);
    throw error;
  }
}

// Calculer le chiffre d'affaires
export async function calculateRevenue() {
  try {
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    let totalRevenue = 0;

    ordersSnapshot.forEach((doc) => {
      totalRevenue += doc.data().totalPrice; // Ajouter le prix total de chaque commande
    });

    return totalRevenue;
  } catch (error) {
    console.error("Erreur lors du calcul du chiffre d'affaires :", error);
    throw error;
  }
}


// Mettre à jour les points d’un salarié
export async function updatePoints(employeeId, pointsToAdd) {
  try {
    const userRef = doc(db, "users", employeeId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const currentPoints = userDoc.data().points || 0;
      await updateDoc(userRef, {
        points: currentPoints + pointsToAdd,
      });
      console.log("Points mis à jour avec succès !");
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des points :", error);
    throw error;
  }
}

// Déterminer le niveau d'un utilisateur en fonction des points
export function calculateLevel(points) {
  return Math.floor(points / 100) + 1; // Par exemple, 100 points = niveau 2
}


// Mettre à jour les points et recalculer le niveau d’un salarié
export async function updatePointsAndLevel(employeeId, pointsToAdd) {
  try {
    const userRef = doc(db, "users", employeeId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const currentPoints = userDoc.data().points || 0;
      const newPoints = currentPoints + pointsToAdd;
      const newLevel = calculateLevel(newPoints);

      await updateDoc(userRef, {
        points: newPoints,
        level: newLevel,
      });

      console.log("Points et niveau mis à jour avec succès !");
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des points et du niveau :", error);
    throw error;
  }
}


// Ajouter un plat ou un dessert au menu
export async function addMenuItem(name, category, price) {
  try {
    await addDoc(collection(db, "menu"), {
      name,
      category, // "plat" ou "dessert"
      price,
    });
    console.log("Article ajouté au menu !");
  } catch (error) {
    console.error("Erreur lors de l'ajout au menu :", error);
    throw error;
  }
}


// Récupérer tous les articles du menu
export async function getMenuItems() {
  try {
    const menuSnapshot = await getDocs(collection(db, "menu"));
    const menuItems = [];
    menuSnapshot.forEach((doc) => {
      menuItems.push({ id: doc.id, ...doc.data() });
    });
    return menuItems;
  } catch (error) {
    console.error("Erreur lors de la récupération du menu :", error);
    throw error;
  }
}

