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

// Cache local pour le stock - Durée moyenne car le stock change régulièrement
let stockCache: StockData[] | null = null;
let lastStockCacheUpdate = 0;
const STOCK_CACHE_DURATION = 120000; // 2 minutes - Le stock change régulièrement

// Fonctions utilitaires de cache pour le stock
export const clearStockCache = () => {
  stockCache = null;
  lastStockCacheUpdate = 0;
  console.log('🗑️ Cache du stock vidé');
};

export const getStockCacheInfo = () => {
  const now = Date.now();
  const timeLeft = stockCache ? Math.max(0, STOCK_CACHE_DURATION - (now - lastStockCacheUpdate)) : 0;
  return {
    isActive: !!stockCache,
    itemsCount: stockCache?.length || 0,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: STOCK_CACHE_DURATION,
    durationFormatted: `${STOCK_CACHE_DURATION / 60000}min`
  };
};

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
    
    // Invalider le cache après ajout
    clearStockCache();
    console.log("✅ Article de stock ajouté avec succès :", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de l'article de stock :", error);
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
export async function getAllStock(useCache = true): Promise<StockData[]> {
  try {
    const now = Date.now();
    
    // Utiliser le cache si disponible et récent
    if (useCache && stockCache && (now - lastStockCacheUpdate) < STOCK_CACHE_DURATION) {
      console.log('📱 Stock chargé depuis le cache local');
      return stockCache;
    }

    console.log('🔄 Chargement du stock depuis Firebase...');
    const stockSnapshot = await getDocs(collection(db, "stock"));
    const stockItems: StockData[] = [];
    
    stockSnapshot.forEach((doc) => {
      stockItems.push({
        id: doc.id,
        ...doc.data()
      } as StockData);
    });

    // Mettre à jour le cache
    stockCache = stockItems;
    lastStockCacheUpdate = now;
    
    console.log(`✅ ${stockItems.length} articles de stock chargés et mis en cache`);
    return stockItems;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du stock :", error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (stockCache) {
      console.log('🔄 Utilisation du cache de secours pour le stock');
      return stockCache;
    }
    
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

    // Invalider le cache après modification
    clearStockCache();
    console.log(`✅ Article de stock ${id} mis à jour avec succès`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de l'article de stock :", error);
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