import { db } from './firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  getDoc,
} from 'firebase/firestore';
import { getRealtimeTablesCache } from './firebaseRealtimeCache';

export interface Table {
  id: number;
  numero: string;
  places: number;
  status: 'libre' | 'occupee' | 'reservee';
  position: { 
    x: number; 
    y: number; 
    shape?: 'round' | 'square' | 'rectangle' | 'oval';
  };
}

export interface Room {
  id?: string;
  name: string;
  description?: string;
}

// Collections - using restaurant/room/table sub-collections structure
const RESTAURANTS_COLLECTION = 'restaurants';

// Cache local pour optimiser les performances
let tablesCache: Map<string, Table[]> = new Map(); // Cache par roomId
let tablesCacheTimestamps: Map<string, number> = new Map(); // Timestamps par roomId
let roomCache: Room[] | null = null;
let roomCacheTimestamp = 0;
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

// Room management functions

export const getRoom = async (useCache = true, restaurantId: string): Promise<Room[]> => {
  try {
    const now = Date.now();
    if (useCache && roomCache && (now - roomCacheTimestamp) < CACHE_DURATION) {
      console.log('🏠 Salles chargées depuis le cache local');
      return roomCache;
    }

    console.log('🔄 Chargement des salles depuis Firebase - structure restaurant/room');
    const roomQuery = query(getRoomsCollectionRef(restaurantId), orderBy('name'));
    const snapshot = await getDocs(roomQuery);
    
    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Room));

    roomCache = rooms;
    roomCacheTimestamp = now;
    console.log(`✅ ${rooms.length} salles chargées et mises en cache`);

    return rooms;
  } catch (error) {
    console.error("❌ Erreur lors du chargement des salles:", error);
    
    // Return cache as fallback if available
    if (roomCache) {
      console.log('🔄 Utilisation du cache de secours pour les salles');
      return roomCache;
    }
    
    throw error;
  }
};

export const addRoom = async (room: Room, restaurantId: string): Promise<void> => {
  try {
    const roomRef = doc(getRoomsCollectionRef(restaurantId), room.name.toLowerCase().replace(/\s+/g, ''));
    await setDoc(roomRef, room);
    console.log(`✅ Salle "${room.name}" ajoutée avec succès`);
    
    // Clear cache to force reload
    clearRoomCache();
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de la salle:", error);
    throw error;
  }
};

export const updateRoom = async (roomId: string, room: Partial<Room>, restaurantId: string): Promise<void> => {
  try {
    const roomRef = doc(getRoomsCollectionRef(restaurantId), roomId);
    
    // Filter out undefined values
    const filteredRoom = Object.fromEntries(
      Object.entries(room).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(roomRef, filteredRoom);
    console.log(`✅ Salle "${roomId}" mise à jour avec succès`);
    
    // Clear cache to force reload
    clearRoomCache();
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la salle:", error);
    throw error;
  }
};

export const deleteRoom = async (roomId: string, restaurantId: string): Promise<void> => {
  try {
    const roomRef = doc(getRoomsCollectionRef(restaurantId), roomId);
    await deleteDoc(roomRef);
    console.log(`✅ Salle "${roomId}" supprimée avec succès`);
    
    // Clear cache to force reload
    clearRoomCache();
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la salle:", error);
    throw error;
  }
};

// Table management functions

export const getAllTables = async (roomId: string, useCache = true, restaurantId: string): Promise<Table[]> => {
  try {
    const now = Date.now();
    const cachedTables = tablesCache.get(roomId);
    const cacheTimestamp = tablesCacheTimestamps.get(roomId) || 0;
    if (useCache && cachedTables && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log(`🪑 Tables chargées depuis le cache local pour la salle ${roomId}`);
      return cachedTables;
    }

    console.log(`🔄 Chargement des tables depuis Firebase - structure restaurant/room pour la salle ${roomId}`);
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
    await updateDoc(roomDocRef, { tables: filteredTables });
    console.log(`✅ Table ${tableId} supprimée avec succès de la salle ${roomId}`);
    
    // Clear cache to force reload
    clearTableCache(roomId);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la table:", error);
    throw error;
  }
};

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

// Cache management functions

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

export const clearRoomCache = () => {
  roomCache = null;
  roomCacheTimestamp = 0;
  console.log('🗑️ Cache des salles vidé');
};

export const clearTablesAndRoomsCache = () => {
  clearTableCache();
  clearRoomCache();
  console.log('🗑️ Cache des tables et salles vidé');
};

export const getTablesCacheInfo = (roomId: string) => {
  const now = Date.now();
  const cachedTables = tablesCache.get(roomId);
  const cacheTimestamp = tablesCacheTimestamps.get(roomId) || 0;
  const timeLeft = cachedTables ? Math.max(0, CACHE_DURATION - (now - cacheTimestamp)) : 0;
  return {
    isActive: !!cachedTables,
    itemsCount: cachedTables?.length || 0,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: CACHE_DURATION,
    durationFormatted: `${CACHE_DURATION / 60000}min`
  };
};

export const getRoomsCacheInfo = () => {
  const now = Date.now();
  const timeLeft = roomCache ? Math.max(0, CACHE_DURATION - (now - roomCacheTimestamp)) : 0;
  return {
    isActive: !!roomCache,
    itemsCount: roomCache?.length || 0,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: CACHE_DURATION,
    durationFormatted: `${CACHE_DURATION / 60000}min`
  };
};

// Legacy compatibility functions for existing code
export const getTablesWithRealtimeUpdates = (callback: (tables: Table[]) => void, restaurantId: string) => {
  return getRealtimeTablesCache().subscribe(callback);
};

// Legacy compatibility aliases and missing functions

export const getTables = (roomId: string, useCache = true, restaurantId: string) => 
  getAllTables(roomId, useCache, restaurantId);

export const saveTable = async (table: Table, roomId: string, restaurantId: string): Promise<void> => {
  return addTable(table, roomId, restaurantId);
};

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

export const updateTableStatus = async (tableId: number, status: Table['status'], roomId: string, restaurantId: string): Promise<void> => {
  return updateTable(tableId, { status }, roomId, restaurantId);
};

export const updateTablePosition = async (tableId: number, position: Table['position'], roomId: string, restaurantId: string): Promise<void> => {
  return updateTable(tableId, { position }, roomId, restaurantId);
};

export const clearTablesCache = clearTableCache;


// Default export for backward compatibility
export default {
  getAllTables,
  getTables,
  addTable,
  saveTable,
  updateTable,
  updateTables,
  updateTableStatus,
  updateTablePosition,
  deleteTable,
  getTableById,
  getRoom,
  addRoom,
  updateRoom,
  deleteRoom,
  clearTableCache,
  clearTablesCache,
  clearRoomCache,
  clearTablesAndRoomsCache,
  getTablesCacheInfo,
  getRoomsCacheInfo,
  getTablesWithRealtimeUpdates
};
