// ====== EXPORTS CENTRALISÉS ROOM & TABLE ======

// Types et interfaces
export * from './types';

// Gestion des salles
export * from './room';

// Gestion des tables
export * from './table';

// Export par défaut pour compatibilité
import { getRooms, getRoom, createRoom, updateRoom, deleteRoom, deleteRoomSafe } from './room';
import { getAllTables, addTable, updateTable, updateTables, deleteTable, getTableById, clearTableCache, getTablesCacheInfo } from './table';

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
  getTablesCacheInfo,
};
