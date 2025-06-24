import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Table } from './types';
import { deleteTicket } from '../ticket/crud';

const RESTAURANTS_COLLECTION = 'restaurants';

// Cache local pour optimiser les performances
let tablesCache: Map<string, Table[]> = new Map(); // Cache par roomId
let tablesCacheTimestamps: Map<string, number> = new Map(); // Timestamps par roomId
const CACHE_DURATION = 300000; // 5 minutes

// Helper functions to get collection references
const getRestaurantRef = (restaurantId: string) => {
  return doc(db, RESTAURANTS_COLLECTION, restaurantId);
};

const getRoomsCollectionRef = (restaurantId: string) => {
  return collection(getRestaurantRef(restaurantId), 'rooms');
};

const getRoomDocRef = (restaurantId: string, roomId: string) => {
  return doc(getRoomsCollectionRef(restaurantId), roomId);
};

/**
 * Récupère toutes les tables d'une salle
 */
export const getAllTables = async (roomId: string, useCache = true, restaurantId: string): Promise<Table[]> => {
  try {
    const now = Date.now();
    const cachedTables = tablesCache.get(roomId);
    const cacheTimestamp = tablesCacheTimestamps.get(roomId) || 0;
    
    if (useCache && cachedTables && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log(`🪑 Tables chargées depuis le cache local pour la salle ${roomId}`);
      return cachedTables;
    }

    console.log(`🔄 Chargement des tables depuis Firebase pour la salle ${roomId}`);
    const roomDocRef = getRoomDocRef(restaurantId, roomId);
    const snapshot = await getDoc(roomDocRef);
    
    let tables: Table[] = [];
    if (snapshot.exists()) {
      const roomData = snapshot.data();
      tables = roomData.tables || [];
    }

    tablesCache.set(roomId, tables);
    tablesCacheTimestamps.set(roomId, now);
    console.log(`✅ ${tables.length} tables chargées et mises en cache pour la salle ${roomId}`);

    return tables;
  } catch (error) {
    console.error(`❌ Erreur lors du chargement des tables pour la salle ${roomId}:`, error);
    
    // Return cache as fallback if available
    const cachedTables = tablesCache.get(roomId);
    if (cachedTables) {
      console.log(`🔄 Utilisation du cache de secours pour les tables de la salle ${roomId}`);
      return cachedTables;
    }
    
    throw error;
  }
};

/**
 * Ajoute une nouvelle table à une salle
 */
export const addTable = async (table: Table, roomId: string, restaurantId: string): Promise<void> => {
  try {
    const roomDocRef = getRoomDocRef(restaurantId, roomId);
    
    // Get current room data
    const roomSnapshot = await getDoc(roomDocRef);
    const currentTables: Table[] = roomSnapshot.exists() ? (roomSnapshot.data().tables || []) : [];
    
    // Add the new table
    const updatedTables = [...currentTables, table];
    
    // Update the room document with the new tables array
    await updateDoc(roomDocRef, { tables: updatedTables });
    console.log(`✅ Table "${table.numero}" ajoutée avec succès dans la salle ${roomId}`);
    
    // Clear cache to force reload
    clearTableCache(roomId);
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de la table:", error);
    throw error;
  }
};

/**
 * Met à jour une table existante
 */
export const updateTable = async (tableId: number, tableData: Partial<Table>, roomId: string, restaurantId: string): Promise<void> => {
  try {
    const roomDocRef = getRoomDocRef(restaurantId, roomId);
    
    // Get current room data
    const roomSnapshot = await getDoc(roomDocRef);
    if (!roomSnapshot.exists()) {
      console.warn(`⚠️ Room ${roomId} doesn't exist. Skipping table update.`);
      return;
    }
    
    const currentTables: Table[] = roomSnapshot.data().tables || [];
    const tableIndex = currentTables.findIndex(table => table.id === tableId);
    
    if (tableIndex === -1) {
      console.warn(`⚠️ Table ${tableId} doesn't exist in room ${roomId}. Skipping update.`);
      return;
    }
    
    // Filter out undefined values
    const filteredTableData = Object.fromEntries(
      Object.entries(tableData).filter(([_, value]) => value !== undefined)
    );
    
    // Update the specific table
    const updatedTables = [...currentTables];
    updatedTables[tableIndex] = { ...updatedTables[tableIndex], ...filteredTableData };
    
    // Update the room document with the modified tables array
    await updateDoc(roomDocRef, { tables: updatedTables });
    console.log(`✅ Table ${tableId} mise à jour avec succès dans la salle ${roomId}`);
    
    // Clear cache to force reload
    clearTableCache(roomId);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la table:", error);
    throw error;
  }
};

/**
 * Supprime une table d'une salle
 */
export const deleteTable = async (tableId: number, roomId: string, restaurantId: string): Promise<void> => {
  try {
    const roomDocRef = getRoomDocRef(restaurantId, roomId);
    
    // Get current room data
    const roomSnapshot = await getDoc(roomDocRef);
    if (!roomSnapshot.exists()) {
      console.warn(`⚠️ Room ${roomId} doesn't exist. Cannot delete table.`);
      return;
    }
    
    const currentTables: Table[] = roomSnapshot.data().tables || [];
    const filteredTables = currentTables.filter(table => table.id !== tableId);
    
    // Update the room document with the filtered tables array
    await deleteTicket(tableId.toString(), restaurantId); // Delete associated tickets if any
    await updateDoc(roomDocRef, { tables: filteredTables });
    
    console.log(`✅ Table ${tableId} supprimée avec succès de la salle ${roomId}`);
    
    // Clear cache to force reload
    clearTableCache(roomId);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la table:", error);
    throw error;
  }
};

/**
 * Récupère une table spécifique par son ID
 */
export const getTableById = async (tableId: number, roomId: string, restaurantId: string): Promise<Table | null> => {
  try {
    const roomDocRef = getRoomDocRef(restaurantId, roomId);
    const roomSnapshot = await getDoc(roomDocRef);
    
    if (roomSnapshot.exists()) {
      const currentTables: Table[] = roomSnapshot.data().tables || [];
      const table = currentTables.find(table => table.id === tableId);
      return table || null;
    }
    
    return null;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la table:", error);
    throw error;
  }
};

/**
 * Vide le cache des tables
 */
export const clearTableCache = (roomId?: string) => {
  if (roomId) {
    tablesCache.delete(roomId);
    tablesCacheTimestamps.delete(roomId);
    console.log(`🗑️ Cache des tables vidé pour la salle ${roomId}`);
  } else {
    tablesCache.clear();
    tablesCacheTimestamps.clear();
    console.log('🗑️ Cache des tables vidé pour toutes les salles');
  }
};

/**
 * Obtient les informations sur le cache des tables
 */
export const getTablesCacheInfo = () => {
  const roomIds = Array.from(tablesCache.keys());
  const cacheInfo = roomIds.map(roomId => ({
    roomId,
    tablesCount: tablesCache.get(roomId)?.length || 0,
    cacheAge: Date.now() - (tablesCacheTimestamps.get(roomId) || 0),
    isExpired: (Date.now() - (tablesCacheTimestamps.get(roomId) || 0)) > CACHE_DURATION
  }));
  
  return {
    totalCachedRooms: roomIds.length,
    cacheInfo,
    cacheDuration: CACHE_DURATION
  };
};

/**
 * Met à jour plusieurs tables en une seule fois
 */
export const updateTables = async (tables: Table[], roomId: string, restaurantId: string): Promise<void> => {
  try {
    const roomDocRef = getRoomDocRef(restaurantId, roomId);
    
    // Get current room data
    const roomSnapshot = await getDoc(roomDocRef);
    if (!roomSnapshot.exists()) {
      console.warn(`⚠️ Room ${roomId} doesn't exist. Cannot update tables.`);
      return;
    }
    
    const currentTables: Table[] = roomSnapshot.data().tables || [];
    let updatedTables = [...currentTables];
    let successCount = 0;
    let skipCount = 0;
    
    // Update multiple tables in the array
    for (const table of tables) {
      try {
        const tableIndex = updatedTables.findIndex(t => t.id === table.id);
        if (tableIndex !== -1) {
          updatedTables[tableIndex] = { ...updatedTables[tableIndex], ...table };
          successCount++;
        } else {
          console.warn(`⚠️ Table ${table.id} not found in room ${roomId}. Skipping.`);
          skipCount++;
        }
      } catch (error) {
        console.warn(`⚠️ Skipping table ${table.id} update:`, (error as Error).message);
        skipCount++;
      }
    }
    
    // Update the room document once with all changes
    if (successCount > 0) {
      await updateDoc(roomDocRef, { tables: updatedTables });
    }
    
    console.log(`✅ ${successCount} tables mises à jour avec succès, ${skipCount} ignorées`);
    
    // Clear cache once at the end
    clearTableCache(roomId);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des tables:", error);
    throw error;
  }
};
