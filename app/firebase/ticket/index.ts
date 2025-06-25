// ====== EXPORTS CENTRALISÉS ======

// Types et interfaces
export * from './types';

// Configuration
export * from './config';

// Cache
export * from './cache';

// Fonctions de hachage
export * from './hash';

// Opérations CRUD
export * from './crud';

// Requêtes et recherches
export * from './queries';

// Utilitaires métier
export * from './utils';

// Vérifications de salle
export * from './roomCheck';

// Synchronisation temps réel
export * from './realtime';

// Gestion des modifications
export * from './modifications';

// Helpers utilitaires
export * from './ticketHelpers';




// Export par défaut pour compatibilité
import { createTicket, terminerTicket } from './crud';
import { getTicketsActifs, listenToTicketsActifs, getTicketsByStatus, getTicketsTermines, getTicketByTableId } from './queries';
import { ticketEncaisse, updateStatusPlat, changeStatusTicket } from './utils';
import { updateTicket } from './crud';
import { calculateTicketHash, getLastTerminatedTicketHash } from './hash';
import { 
  clearTicketsCache, 
  clearTableCache, 
  getTicketsCacheInfo, 
  getTableCacheInfo, 
  logCacheStatus,
  updateTicketInCache,
  addTicketToCache,
  removeTicketFromCache,
  updateTableCacheWithTicket,
  invalidateCacheSelectively
} from './cache';

export default {
  // Fonctions principales tickets
  createTicket,
  terminerTicket,
  getTicketsActifs,
  listenToTicketsActifs,
  getTicketsByStatus,
  getTicketsTermines,
  
  // Fonctions de gestion
  getTicketByTableId,
  ticketEncaisse,
  updateTicket,
  updateStatusPlat,
  changeStatusTicket,
  
  // Fonctions de hachage et intégrité
  calculateTicketHash,
  getLastTerminatedTicketHash,
  
  // Utilitaires cache
  clearTicketsCache,
  clearTableCache,
  getTicketsCacheInfo,
  getTableCacheInfo,
  logCacheStatus,
  
  // Nouvelles fonctions de cache intelligent
  updateTicketInCache,
  addTicketToCache,
  removeTicketFromCache,
  updateTableCacheWithTicket,
  invalidateCacheSelectively,
};
