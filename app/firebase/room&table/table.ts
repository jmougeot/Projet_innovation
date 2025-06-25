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
import { 
  getTablesCache, 
  setTablesCache, 
  addTableToCache, 
  updateTableInCache, 
  removeTableFromCache,
  clearTablesCache as clearTablesCacheUtil
} from './cache';
import { startRealtimeSync, getListenersStatus } from './realtime';

const RESTAURANTS_COLLECTION = 'restaurants';

// Variable pour s'assurer qu'on démarre la sync une seule fois par restaurant
let syncStartedForRestaurants = new Set<string>();

/**
 * 🚀 Auto-démarrage de la synchronisation temps réel
 */
const ensureRealtimeSyncStarted = async (restaurantId: string) => {
  const status = getListenersStatus();
  
  // Si déjà démarré pour ce restaurant, ne rien faire
  if (syncStartedForRestaurants.has(restaurantId) && status.isActive) {
    return;
  }
  
  try {
    console.log(`🚀 Auto-démarrage de la synchronisation pour ${restaurantId}`);
    await startRealtimeSync(restaurantId);
    syncStartedForRestaurants.add(restaurantId);
    console.log(`✅ Synchronisation auto-démarrée pour ${restaurantId}`);
  } catch (error) {
    console.warn(`⚠️ Impossible de démarrer la sync pour ${restaurantId}:`, error);
    // Continue sans sync (fallback sur cache statique)
  }
};

// Helper functions to get collection references
const getRestaurantRef = (restaurantId: string) => {
  return doc(db, RESTAURANTS_COLLECTION, restaurantId);
};

const getRoomsCollectionRef = (restaurantId: string) => {
  return collection(db, RESTAURANTS_COLLECTION, restaurantId, 'rooms');
};

const getRoomDocRef = (restaurantId: string, roomId: string) => {
  return doc(db, RESTAURANTS_COLLECTION, restaurantId, 'rooms', roomId);
};

/**
 * Récupère toutes les tables d'une salle avec cache intelligent
 */
export const getAllTables = async (roomId: string, useCache = true, restaurantId: string): Promise<Table[]> => {
  try {
    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    await ensureRealtimeSyncStarted(restaurantId);

    // Vérifier le cache d'abord
    if (useCache) {
      const cachedTables = getTablesCache(roomId);
      if (cachedTables) {
        console.log(`🪑 ${cachedTables.length} tables chargées depuis le cache pour la salle ${roomId}`);
        return cachedTables;
      }
    }

    console.log(`🔄 Chargement des tables depuis Firebase pour la salle ${roomId}`);
    const roomDocRef = getRoomDocRef(restaurantId, roomId);
    const snapshot = await getDoc(roomDocRef);
    
    let tables: Table[] = [];
    if (snapshot.exists()) {
      const roomData = snapshot.data() as any;
      tables = roomData.tables || [];
    }

    // Mettre à jour le cache
    setTablesCache(roomId, tables);
    console.log(`✅ ${tables.length} tables chargées et mises en cache pour la salle ${roomId}`);

    return tables;
  } catch (error) {
    console.error(`❌ Erreur lors du chargement des tables pour la salle ${roomId}:`, error);
    
    // Return cache as fallback if available
    const cachedTables = getTablesCache(roomId);
    if (cachedTables) {
      console.log(`🔄 Utilisation du cache de secours pour les tables de la salle ${roomId}`);
      return cachedTables;
    }
    
    throw error;
  }
};

/**
 * Ajoute une nouvelle table à une salle avec mise à jour du cache
 */
export const addTable = async (table: Table, roomId: string, restaurantId: string): Promise<void> => {
  try {
    const roomDocRef = getRoomDocRef(restaurantId, roomId);
    
    // Get current room data
    const roomSnapshot = await getDoc(roomDocRef);
    const currentTables: Table[] = roomSnapshot.exists() ? (roomSnapshot.data()?.tables || []) : [];
    
    // Add the new table
    const updatedTables = [...currentTables, table];
    
    // Update the room document with the new tables array
    await updateDoc(roomDocRef, { tables: updatedTables });
    
    // Ajouter au cache
    addTableToCache(roomId, table);
    
    console.log(`✅ Table "${table.numero}" ajoutée avec succès dans la salle ${roomId}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de la table:", error);
    throw error;
  }
};

/**
 * Met à jour une table existante avec mise à jour du cache
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
    
    const currentTables: Table[] = roomSnapshot.data()?.tables || [];
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
    
    // Mettre à jour le cache
    updateTableInCache(roomId, tableId, filteredTableData);
    
    console.log(`✅ Table ${tableId} mise à jour avec succès dans la salle ${roomId}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la table:", error);
    throw error;
  }
};

/**
 * Supprime une table d'une salle avec mise à jour du cache
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
    
    const currentTables: Table[] = roomSnapshot.data()?.tables || [];
    const filteredTables = currentTables.filter(table => table.id !== tableId);
    
    // Update the room document with the filtered tables array
    await deleteTicket(tableId.toString(), restaurantId); // Delete associated tickets if any
    await updateDoc(roomDocRef, { tables: filteredTables });
    
    // Supprimer du cache
    removeTableFromCache(roomId, tableId);
    
    console.log(`✅ Table ${tableId} supprimée avec succès de la salle ${roomId}`);
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
 * Vide le cache des tables (utilise la fonction du module cache)
 */
export const clearTableCache = (roomId?: string) => {
  clearTablesCacheUtil(roomId);
};

/**
 * Obtient les informations sur le cache des tables (utilise la fonction du module cache)
 */
export const getTablesInfo = () => {
  // Importer la fonction depuis le module cache
  const { getTablesCacheInfo } = require('./cache');
  return getTablesCacheInfo();
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
