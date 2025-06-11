import { db } from './firebaseConfig';
import { collection,  getDocs, doc, setDoc, updateDoc,  deleteDoc, query, orderBy, getDoc,} from 'firebase/firestore';
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
  name : string
  listTable : Table[]
}


const ROOM_COLLECTION = 'room'
const TABLES_COLLECTION = 'tables';

// Cache local pour optimiser les performances
let tablesCache: Table[] | null = null;
let roomCache: Room[] | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 300000;

// Room management

export const getRoom = async (useCache = true) : Promise<Room[]> => {
  try {
    const now = Date.now();
    if (useCache && roomCache && (now - lastCacheUpdate)< CACHE_DURATION) {
      console.log ('room cherged from the local cache')
      return roomCache; 
    }
    console.log ('room charged from firebase')
    const roomQuery = query(collection(db, ROOM_COLLECTION), orderBy('id'))
    const snapshot = await getDocs(roomQuery);
    const rooms = snapshot.docs.map(doc => doc.data() as Room);
    roomCache = rooms;
    lastCacheUpdate = now;
        console.log(`✅ ${rooms.length} tables chargées et mises en cache`);
    return rooms;
  }
  catch (error) {
    console.error("❌ Erreur lors du chargement des tables:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (roomCache) {
      console.log('🔄 Utilisation du cache de secours');
      return roomCache;
    }
  throw error;
  }
};





// Get all tables avec cache optimisé
export const getTables = async (useCache = true): Promise<Table[]> => {
  try {
    const now = Date.now();
    
    // Utiliser le cache si disponible et récent
    if (useCache && tablesCache && (now - lastCacheUpdate) < CACHE_DURATION) {
      console.log('📱 Tables chargées depuis le cache local');
      return tablesCache;
    }

    console.log('🔄 Chargement des tables depuis Firebase...');
    const tableQuery = query(collection(db, TABLES_COLLECTION), orderBy('id'));
    const snapshot = await getDocs(tableQuery);
    const tables = snapshot.docs.map(doc => doc.data() as Table);
    
    // Mettre à jour le cache
    tablesCache = tables;
    lastCacheUpdate = now;
    
    console.log(`✅ ${tables.length} tables chargées et mises en cache`);
    return tables;
  } catch (error) {
    console.error("❌ Erreur lors du chargement des tables:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (tablesCache) {
      console.log('🔄 Utilisation du cache de secours');
      return tablesCache;
    }
    
    throw error;
  }
};

// Vider le cache manuellement
export const clearTablesCache = () => {
  tablesCache = null;
  lastCacheUpdate = 0;
  console.log('🗑️ Cache des tables vidé');
  
  // Également vider le cache temps réel
  try {
    const realtimeCache = getRealtimeTablesCache();
    realtimeCache.clearCache();
    console.log('🗑️ Cache temps réel des tables vidé');
  } catch (error) {
    console.warn('⚠️ Impossible de vider le cache temps réel:', error);
  }
};

// Obtenir les informations du cache
export const getCacheInfo = () => {
  const now = Date.now();
  const timeLeft = tablesCache ? Math.max(0, CACHE_DURATION - (now - lastCacheUpdate)) : 0;
  return {
    isActive: !!tablesCache,
    itemsCount: tablesCache?.length || 0,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: CACHE_DURATION,
    durationFormatted: `${CACHE_DURATION / 60000}min`
  };
};

// Add or update a table
export const saveTable = async (table: Table): Promise<void> => {
  try {
    const tableRef = doc(db, TABLES_COLLECTION, table.id.toString());
    await setDoc(tableRef, table);
    
    // Invalider le cache après modification
    clearTablesCache();
    console.log(`✅ Table ${table.numero} sauvegardée`);
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde:", error);
    throw error;
  }
};

// Update multiple tables (for batch position updates)
export const updateTables = async (tables: Table[]): Promise<void> => {
  try {
    console.log(`🔄 Mise à jour de ${tables.length} tables...`);
    
    // Using Promise.all to perform multiple updates in parallel
    await Promise.all(tables.map(async table => {
      const tableRef = doc(db, TABLES_COLLECTION, table.id.toString());
      
      try {
        // Check if document exists
        const docSnapshot = await getDoc(tableRef);
        
        if (docSnapshot.exists()) {
          // Document exists, update it
          await updateDoc(tableRef, { ...table });
        } else {
          // Document doesn't exist, create it
          await setDoc(tableRef, table);
        }
      } catch (docError) {
        console.error(`Error processing table ${table.id}:`, docError);
        // Always use setDoc as fallback if there's an issue
        await setDoc(tableRef, table);
      }
    }));
    
    // Invalider le cache après les modifications
    clearTablesCache();
    console.log(`✅ ${tables.length} tables mises à jour avec succès`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des tables:", error);
    throw error;
  }
};

// Update table position
export const updateTablePosition = async (tableId: number, position: { x: number, y: number }): Promise<void> => {
  try {
    const tableRef = doc(db, TABLES_COLLECTION, tableId.toString());
    await updateDoc(tableRef, { position });
    
    // Invalider le cache après modification
    clearTablesCache();
    console.log(`✅ Position de la table ${tableId} mise à jour`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la position:", error);
    throw error;
  }
};

// Update table status
export const updateTableStatus = async (tableId: number, status: Table['status']): Promise<void> => {
  try {
    const tableRef = doc(db, TABLES_COLLECTION, tableId.toString());
    await updateDoc(tableRef, { status });
    
    // Invalider le cache après modification
    clearTablesCache();
    console.log(`✅ Statut de la table ${tableId} mis à jour: ${status}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du statut:", error);
    throw error;
  }
};

// Delete a table
export const deleteTable = async (tableId: number): Promise<void> => {
  try {
    const tableRef = doc(db, TABLES_COLLECTION, tableId.toString());
    await deleteDoc(tableRef);
    
    // Invalider le cache après suppression
    clearTablesCache();
    console.log(`✅ Table ${tableId} supprimée`);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la table:", error);
    throw error;
  }
};

// Initialize default tables if none exist
export const initializeDefaultTables = async (): Promise<void> => {
  try {
    const existingTables = await getTables();
    
    if (existingTables.length === 0) {
      const defaultTables: Table[] = [
        { id: 1, numero: "T1", places: 4, status: 'libre', position: { x: 10, y: 0, shape: 'round' } },
        { id: 2, numero: "T2", places: 2, status: 'occupee', position: { x: 1, y: 0, shape: 'square' } },
        { id: 3, numero: "T3", places: 6, status: 'reservee', position: { x: 2, y: 0, shape: 'rectangle' } },
        { id: 4, numero: "T4", places: 4, status: 'libre', position: { x: 0, y: 1, shape: 'round' } },
        { id: 5, numero: "T5", places: 8, status: 'libre', position: { x: 1, y: 1, shape: 'oval' } },
        { id: 6, numero: "T6", places: 2, status: 'occupee', position: { x: 2, y: 1, shape: 'square' } },
      ];
      
      await Promise.all(defaultTables.map(table => saveTable(table)));
      
      // Invalider le cache après initialisation
      clearTablesCache();
      console.log('✅ Tables par défaut initialisées');
    }
  } catch (error) {
    console.error("Error initializing default tables:", error);
    throw error;
  }
};

// Ajouter un export par défaut pour Expo Router
export default {
  getTables,
  saveTable,
  updateTables,
  updateTablePosition,
  updateTableStatus,
  deleteTable,
  initializeDefaultTables
};
