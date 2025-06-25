import { Room, Table } from './types';

// ====== CACHE POUR LES SALLES ======
let roomsCache: Room[] = [];
let lastRoomsCacheUpdate = 0;
const ROOMS_CACHE_DURATION = 300000; // 5 minutes

// ====== CACHE POUR LES TABLES ======
let tablesCache: { [roomId: string]: Table[] } = {};
let tablesCacheTimestamps: { [roomId: string]: number } = {};
const TABLES_CACHE_DURATION = 300000; // 5 minutes

// ====== FONCTIONS DE CACHE POUR LES SALLES ======

/**
 * 📋 Obtenir les salles depuis le cache
 */
export const getRoomsCache = (): Room[] | null => {
  const now = Date.now();
  if (now - lastRoomsCacheUpdate > ROOMS_CACHE_DURATION) {
    console.log('🔄 Cache des salles expiré');
    return null;
  }
  return roomsCache;
};

/**
 * 💾 Définir le cache des salles
 */
export const setRoomsCache = (rooms: Room[]): void => {
  roomsCache = rooms;
  lastRoomsCacheUpdate = Date.now();
  console.log(`💾 Cache des salles mis à jour: ${rooms.length} salles`);
};

/**
 * ➕ Ajouter une salle au cache
 */
export const addRoomToCache = (room: Room): void => {
  const existingIndex = roomsCache.findIndex(r => r.id === room.id);
  if (existingIndex !== -1) {
    roomsCache[existingIndex] = room;
    console.log(`✏️ Salle mise à jour dans le cache: ${room.name}`);
  } else {
    roomsCache.push(room);
    console.log(`➕ Salle ajoutée au cache: ${room.name}`);
  }
  lastRoomsCacheUpdate = Date.now();
};

/**
 * ✏️ Mettre à jour une salle dans le cache
 */
export const updateRoomInCache = (roomId: string, updates: Partial<Room>): void => {
  const index = roomsCache.findIndex(r => r.id === roomId);
  if (index !== -1) {
    roomsCache[index] = { ...roomsCache[index], ...updates };
    console.log(`✏️ Salle mise à jour dans le cache: ${roomId}`);
    lastRoomsCacheUpdate = Date.now();
  }
};

/**
 * 🗑️ Supprimer une salle du cache
 */
export const removeRoomFromCache = (roomId: string): void => {
  const index = roomsCache.findIndex(r => r.id === roomId);
  if (index !== -1) {
    const removedRoom = roomsCache.splice(index, 1)[0];
    console.log(`🗑️ Salle supprimée du cache: ${removedRoom.name}`);
    lastRoomsCacheUpdate = Date.now();
    
    // Supprimer aussi le cache des tables de cette salle
    delete tablesCache[roomId];
    delete tablesCacheTimestamps[roomId];
  }
};

/**
 * 🧹 Vider le cache des salles
 */
export const clearRoomsCache = (): void => {
  roomsCache = [];
  lastRoomsCacheUpdate = 0;
  console.log('🧹 Cache des salles vidé');
};

// ====== FONCTIONS DE CACHE POUR LES TABLES ======

/**
 * 📋 Obtenir les tables d'une salle depuis le cache
 */
export const getTablesCache = (roomId: string): Table[] | null => {
  const now = Date.now();
  const timestamp = tablesCacheTimestamps[roomId] || 0;
  
  if (now - timestamp > TABLES_CACHE_DURATION) {
    console.log(`🔄 Cache des tables expiré pour la salle ${roomId}`);
    return null;
  }
  
  return tablesCache[roomId] || null;
};

/**
 * 💾 Définir le cache des tables pour une salle
 */
export const setTablesCache = (roomId: string, tables: Table[]): void => {
  tablesCache[roomId] = tables;
  tablesCacheTimestamps[roomId] = Date.now();
  console.log(`💾 Cache des tables mis à jour pour la salle ${roomId}: ${tables.length} tables`);
};

/**
 * ➕ Ajouter une table au cache
 */
export const addTableToCache = (roomId: string, table: Table): void => {
  if (!tablesCache[roomId]) {
    tablesCache[roomId] = [];
  }
  
  const existingIndex = tablesCache[roomId].findIndex(t => t.id === table.id);
  if (existingIndex !== -1) {
    tablesCache[roomId][existingIndex] = table;
    console.log(`✏️ Table mise à jour dans le cache: ${table.numero}`);
  } else {
    tablesCache[roomId].push(table);
    console.log(`➕ Table ajoutée au cache: ${table.numero}`);
  }
  
  tablesCacheTimestamps[roomId] = Date.now();
};

/**
 * ✏️ Mettre à jour une table dans le cache
 */
export const updateTableInCache = (roomId: string, tableId: number, updates: Partial<Table>): void => {
  if (!tablesCache[roomId]) return;
  
  const index = tablesCache[roomId].findIndex(t => t.id === tableId);
  if (index !== -1) {
    tablesCache[roomId][index] = { ...tablesCache[roomId][index], ...updates };
    console.log(`✏️ Table mise à jour dans le cache: ${tableId}`);
    tablesCacheTimestamps[roomId] = Date.now();
  }
};

/**
 * 🗑️ Supprimer une table du cache
 */
export const removeTableFromCache = (roomId: string, tableId: number): void => {
  if (!tablesCache[roomId]) return;
  
  const index = tablesCache[roomId].findIndex(t => t.id === tableId);
  if (index !== -1) {
    const removedTable = tablesCache[roomId].splice(index, 1)[0];
    console.log(`🗑️ Table supprimée du cache: ${removedTable.numero}`);
    tablesCacheTimestamps[roomId] = Date.now();
  }
};

/**
 * 🧹 Vider le cache des tables
 */
export const clearTablesCache = (roomId?: string): void => {
  if (roomId) {
    delete tablesCache[roomId];
    delete tablesCacheTimestamps[roomId];
    console.log(`🧹 Cache des tables vidé pour la salle ${roomId}`);
  } else {
    tablesCache = {};
    tablesCacheTimestamps = {};
    console.log('🧹 Cache de toutes les tables vidé');
  }
};

// ====== FONCTIONS UTILITAIRES ======

/**
 * 📊 Obtenir les informations du cache des salles
 */
export const getRoomsCacheInfo = () => {
  const now = Date.now();
  const timeLeft = Math.max(0, ROOMS_CACHE_DURATION - (now - lastRoomsCacheUpdate));
  
  return {
    isActive: roomsCache.length > 0,
    roomsCount: roomsCache.length,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: ROOMS_CACHE_DURATION,
    durationFormatted: `${ROOMS_CACHE_DURATION / 60000}min`
  };
};

/**
 * 📊 Obtenir les informations du cache des tables
 */
export const getTablesCacheInfo = (roomId?: string) => {
  const now = Date.now();
  
  if (roomId) {
    const timestamp = tablesCacheTimestamps[roomId] || 0;
    const timeLeft = Math.max(0, TABLES_CACHE_DURATION - (now - timestamp));
    const tables = tablesCache[roomId] || [];
    
    return {
      roomId,
      isActive: tables.length > 0,
      tablesCount: tables.length,
      timeLeftMs: timeLeft,
      timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
      durationMs: TABLES_CACHE_DURATION,
      durationFormatted: `${TABLES_CACHE_DURATION / 60000}min`
    };
  }
  
  // Informations pour toutes les salles
  const allRoomsInfo = Object.keys(tablesCache).map(roomId => {
    const timestamp = tablesCacheTimestamps[roomId] || 0;
    const timeLeft = Math.max(0, TABLES_CACHE_DURATION - (now - timestamp));
    const tables = tablesCache[roomId] || [];
    
    return {
      roomId,
      isActive: tables.length > 0,
      tablesCount: tables.length,
      timeLeftMs: timeLeft,
      timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`
    };
  });
  
  return {
    totalCachedRooms: allRoomsInfo.length,
    totalTables: allRoomsInfo.reduce((sum, info) => sum + info.tablesCount, 0),
    roomsInfo: allRoomsInfo,
    cacheDuration: TABLES_CACHE_DURATION,
    cacheDurationFormatted: `${TABLES_CACHE_DURATION / 60000}min`
  };
};

/**
 * 🧹 Vider tout le cache
 */
export const clearAllCache = (): void => {
  clearRoomsCache();
  clearTablesCache();
  console.log('🧹 Tout le cache room&table vidé');
};

/**
 * 📊 Obtenir le statut complet du cache
 */
export const getCacheStatus = () => {
  return {
    rooms: getRoomsCacheInfo(),
    tables: getTablesCacheInfo()
  };
};

/**
 * 🐛 Debug du cache
 */
export const debugCache = (): void => {
  console.log('🐛 DEBUG CACHE ROOM&TABLE:');
  console.log('Salles en cache:', roomsCache);
  console.log('Tables en cache:', tablesCache);
  console.log('Timestamps tables:', tablesCacheTimestamps);
  console.log('Status:', getCacheStatus());
};
