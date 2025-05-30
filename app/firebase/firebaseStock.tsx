import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  getDocs, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Interface for Stock data
export interface StockData {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  date: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for adding stock
export interface AddStockData {
  name: string;
  quantity: number;
  price: number;
}

/**
 * Add a new stock item
 * @param stockData - Stock data to add
 * @returns Promise<string> - The stock item ID
 */
export async function addStock(stockData: AddStockData): Promise<string> {
  try {
    const stockToAdd = {
      ...stockData,
      date: new Date().toISOString(),
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "stock"), stockToAdd);
    console.log("Article de stock ajouté avec succès :", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'article de stock :", error);
    throw error;
  }
}

/**
 * Get stock item by ID
 * @param id - The ID of the stock item
 * @returns Promise<StockData | null>
 */
export async function getStock(id: string): Promise<StockData | null> {
  try {
    const docRef = doc(db, "stock", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as StockData;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article de stock :", error);
    throw error;
  }
}

/**
 * Get all stock items
 * @returns Promise<StockData[]>
 */
export async function getAllStock(): Promise<StockData[]> {
  try {
    const stockSnapshot = await getDocs(collection(db, "stock"));
    const stockItems: StockData[] = [];
    
    stockSnapshot.forEach((doc) => {
      stockItems.push({
        id: doc.id,
        ...doc.data()
      } as StockData);
    });

    return stockItems;
  } catch (error) {
    console.error("Erreur lors de la récupération du stock :", error);
    throw error;
  }
}

/**
 * Update a stock item
 * @param id - The ID of the stock item to update
 * @param data - Partial stock data to update
 * @returns Promise<void>
 */
export async function updateStock(id: string, data: Partial<StockData>): Promise<void> {
  try {
    const docRef = doc(db, "stock", id);
    
    // Check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`Article de stock avec l'ID ${id} non trouvé`);
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    });

    console.log(`Article de stock ${id} mis à jour avec succès`);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article de stock :", error);
    throw error;
  }
}

/**
 * Delete a stock item
 * @param id - The ID of the stock item to delete
 * @returns Promise<void>
 */
export async function deleteStock(id: string): Promise<void> {
  try {
    const docRef = doc(db, "stock", id);
    
    // Check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`Article de stock avec l'ID ${id} non trouvé`);
    }

    await deleteDoc(docRef);
    console.log(`Article de stock ${id} supprimé avec succès`);
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article de stock :", error);
    throw error;
  }
}

// Export all functions
export default {
  addStock,
  getStock,
  getAllStock,
  updateStock,
  deleteStock,
};