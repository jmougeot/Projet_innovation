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
import { DEFAULT_RESTAURANT_ID } from './firebaseRestaurant';

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
export const DEFAULT_ROOM_ID = 'main-room';

// Cache local pour optimiser les performances
let tablesCache: Map<string, Table[]> = new Map(); // Cache par roomId
let roomCache: Room[] | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 300000; // 5 minutes

// Helper functions to get collection references
const getRestaurantRef = (restaurantId: string = DEFAULT_RESTAURANT_ID) => {
  return doc(db, RESTAURANTS_COLLECTION, restaurantId);
};

const getRoomsCollectionRef = (restaurantId: string = DEFAULT_RESTAURANT_ID) => {
  return collection(getRestaurantRef(restaurantId), 'rooms');
};

const getTablesCollectionRef = (restaurantId: string = DEFAULT_RESTAURANT_ID, roomId: string = DEFAULT_ROOM_ID) => {
  return collection(doc(getRoomsCollectionRef(restaurantId), roomId), 'tables');
};

// Room management functions

export const getRoom = async (useCache = true, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<Room[]> => {
  try {
    const now = Date.now();
    if (useCache && roomCache && (now - lastCacheUpdate) < CACHE_DURATION) {
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
    lastCacheUpdate = now;
    console.log(`✅ ${rooms.length} salles chargées et mises en cache`);

    // Create default room if none exists
    if (rooms.length === 0) {
      const defaultRoom: Room = {
        name: 'Salle Principale',
        description: 'Salle principale du restaurant'
      };
      
      const roomRef = doc(getRoomsCollectionRef(restaurantId), DEFAULT_ROOM_ID);
      await setDoc(roomRef, defaultRoom);
      console.log('✅ Salle par défaut créée dans la structure restaurant/room');
      
      roomCache = [{ ...defaultRoom, id: DEFAULT_ROOM_ID }];
      return roomCache;
    }

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

export const addRoom = async (room: Room, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
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

export const updateRoom = async (roomId: string, room: Partial<Room>, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
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

export const deleteRoom = async (roomId: string, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
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

export const getAllTables = async (roomId: string = DEFAULT_ROOM_ID, useCache = true, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<Table[]> => {
  try {
    const now = Date.now();
    const cachedTables = tablesCache.get(roomId);
    if (useCache && cachedTables && (now - lastCacheUpdate) < CACHE_DURATION) {
      console.log(`🪑 Tables chargées depuis le cache local pour la salle ${roomId}`);
      return cachedTables;
    }

    console.log(`🔄 Chargement des tables depuis Firebase - structure restaurant/room/table pour la salle ${roomId}`);
    const tablesQuery = query(getTablesCollectionRef(restaurantId, roomId), orderBy('numero'));
    const snapshot = await getDocs(tablesQuery);
    
    const tables = snapshot.docs.map(doc => ({
      id: parseInt(doc.id),
      ...doc.data()
    } as Table));

    tablesCache.set(roomId, tables);
    lastCacheUpdate = now;
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

export const addTable = async (table: Table, roomId: string = DEFAULT_ROOM_ID, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
  try {
    const tableRef = doc(getTablesCollectionRef(restaurantId, roomId), table.id.toString());
    await setDoc(tableRef, table);
    console.log(`✅ Table "${table.numero}" ajoutée avec succès dans la salle ${roomId}`);
    
    // Clear cache to force reload
    clearTableCache(roomId);
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de la table:", error);
    throw error;
  }
};

export const updateTable = async (tableId: number, tableData: Partial<Table>, roomId: string = DEFAULT_ROOM_ID, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
  try {
    const tableRef = doc(getTablesCollectionRef(restaurantId, roomId), tableId.toString());
    
    // Check if document exists
    const docSnap = await getDoc(tableRef);
    if (!docSnap.exists()) {
      console.warn(`⚠️ Table ${tableId} doesn't exist in room ${roomId}. Skipping update.`);
      return; // Skip silently instead of throwing error
    }
    
    // Filter out undefined values
    const filteredTableData = Object.fromEntries(
      Object.entries(tableData).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(tableRef, filteredTableData);
    console.log(`✅ Table ${tableId} mise à jour avec succès dans la salle ${roomId}`);
    
    // Clear cache to force reload
    clearTableCache(roomId);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la table:", error);
    throw error;
  }
};

export const deleteTable = async (tableId: number, roomId: string = DEFAULT_ROOM_ID, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
  try {
    const tableRef = doc(getTablesCollectionRef(restaurantId, roomId), tableId.toString());
    await deleteDoc(tableRef);
    console.log(`✅ Table ${tableId} supprimée avec succès de la salle ${roomId}`);
    
    // Clear cache to force reload
    clearTableCache(roomId);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la table:", error);
    throw error;
  }
};

export const getTableById = async (tableId: number, roomId: string = DEFAULT_ROOM_ID, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<Table | null> => {
  try {
    const tableRef = doc(getTablesCollectionRef(restaurantId, roomId), tableId.toString());
    const snapshot = await getDoc(tableRef);
    
    if (snapshot.exists()) {
      return {
        id: tableId,
        ...snapshot.data()
      } as Table;
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
    console.log(`🗑️ Cache des tables vidé pour la salle ${roomId}`);
  } else {
    tablesCache.clear();
    console.log('🗑️ Cache des tables vidé pour toutes les salles');
  }
  lastCacheUpdate = 0;
};

export const clearRoomCache = () => {
  roomCache = null;
  lastCacheUpdate = 0;
  console.log('🗑️ Cache des salles vidé');
};

export const clearTablesAndRoomsCache = () => {
  clearTableCache();
  clearRoomCache();
  console.log('🗑️ Cache des tables et salles vidé');
};

export const getTablesCacheInfo = (roomId: string = DEFAULT_ROOM_ID) => {
  const now = Date.now();
  const cachedTables = tablesCache.get(roomId);
  const timeLeft = cachedTables ? Math.max(0, CACHE_DURATION - (now - lastCacheUpdate)) : 0;
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
  const timeLeft = roomCache ? Math.max(0, CACHE_DURATION - (now - lastCacheUpdate)) : 0;
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
export const getTablesWithRealtimeUpdates = (callback: (tables: Table[]) => void, restaurantId: string = DEFAULT_RESTAURANT_ID) => {
  return getRealtimeTablesCache().subscribe(callback);
};

// Legacy compatibility aliases and missing functions

export const getTables = (roomId: string = DEFAULT_ROOM_ID, useCache = true, restaurantId: string = DEFAULT_RESTAURANT_ID) => 
  getAllTables(roomId, useCache, restaurantId);

export const saveTable = async (table: Table, roomId: string = DEFAULT_ROOM_ID, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
  return addTable(table, roomId, restaurantId);
};

export const updateTables = async (tables: Table[], roomId: string = DEFAULT_ROOM_ID, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
  try {
    let successCount = 0;
    let skipCount = 0;
    
    // Update multiple tables
    for (const table of tables) {
      try {
        await updateTable(table.id, table, roomId, restaurantId);
        successCount++;
      } catch (error) {
        console.warn(`⚠️ Skipping table ${table.id} update:`, (error as Error).message);
        skipCount++;
      }
    }
    
    console.log(`✅ ${successCount} tables mises à jour avec succès, ${skipCount} ignorées`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des tables:", error);
    throw error;
  }
};

export const updateTableStatus = async (tableId: number, status: Table['status'], roomId: string = DEFAULT_ROOM_ID, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
  return updateTable(tableId, { status }, roomId, restaurantId);
};

export const updateTablePosition = async (tableId: number, position: Table['position'], roomId: string = DEFAULT_ROOM_ID, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
  return updateTable(tableId, { position }, roomId, restaurantId);
};

export const clearTablesCache = clearTableCache;

export const initializeDefaultTables = async (roomId: string = DEFAULT_ROOM_ID, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<void> => {
  try {
    // Check if tables already exist
    const existingTables = await getAllTables(roomId, false, restaurantId);
    if (existingTables.length > 0) {
      console.log('✅ Tables déjà initialisées');
      return;
    }

    // Create default tables
    const defaultTables: Table[] = [
      { id: 1, numero: "T1", places: 4, status: 'libre', position: { x: 10, y: 10, shape: 'round' } },
    ];

    for (const table of defaultTables) {
      await addTable(table, roomId, restaurantId);
    }

    console.log('✅ Tables par défaut initialisées avec succès');
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des tables par défaut:", error);
    throw error;
  }
};

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
  initializeDefaultTables,
  getTablesWithRealtimeUpdates,
  DEFAULT_ROOM_ID
};
