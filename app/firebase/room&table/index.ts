// ====== EXPORTS CENTRALISÉS ROOM & TABLE ======

// Types et interfaces
export * from './types';

// Gestion des salles
export * from './room';

// Gestion des tables
export * from './table';

// Cache intelligent
export * from './cache';

// Synchronisation temps réel
export * from './realtime';


// Export par défaut pour compatibilité
import { getRooms, getRoom, createRoom, updateRoom, deleteRoom, deleteRoomSafe } from './room';
import { getAllTables, addTable, updateTable, updateTables, deleteTable, getTableById, clearTableCache, getTablesInfo } from './table';
import { startRealtimeSync, stopRealtimeSync, restartRealtimeSync } from './realtime';
import { clearAllCache, getCacheStatus, debugCache } from './cache';

export default {
  // Fonctions salles
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  deleteRoomSafe,
  
  // Fonctions tables
  getAllTables,
  addTable,
  updateTable,
  updateTables,
  deleteTable,
  getTableById,
  
  // Cache
  clearTableCache,
  getTablesInfo,
  clearAllCache,
  getCacheStatus,
  debugCache,
  
  // Synchronisation temps réel
  startRealtimeSync,
  stopRealtimeSync,
  restartRealtimeSync,
};
