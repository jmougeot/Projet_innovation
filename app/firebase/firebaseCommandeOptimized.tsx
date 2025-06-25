// ====== FICHIER DE COMPATIBILITÉ ======
// Ce fichier assure la compatibilité avec l'ancienne structure
// Toutes les fonctions sont maintenant dans le dossier ./ticket/

// ====== IMPORTS DE LA NOUVELLE STRUCTURE MODULAIRE ======

// Import de toutes les fonctions depuis le dossier ticket
import ticketModule, {
  // Types
  TicketData,
  PlatQuantite,
  CreateTicketData,
  
  // Fonctions principales
  createTicket,
  terminerTicket,
  getTicketsActifs,
  listenToTicketsActifs,
  getTicketsByStatus,
  getTicketsTermines,
  getTicketByTableId,
  ticketEncaisse,
  updateTicket,
  updateStatusPlat,
  changeStatusTicket,
  
  // Fonctions de hachage
  calculateTicketHash,
  getLastTerminatedTicketHash,
  
  // Utilitaires cache
  clearTicketsCache,
  clearTableCache,
  getTicketsCacheInfo,
  getTableCacheInfo,
  logCacheStatus
} from './ticket';

// ====== RE-EXPORTS POUR COMPATIBILITÉ ======

// Re-export des types pour compatibilité
export type {
  TicketData,
  PlatQuantite,
  CreateTicketData
};

// Re-export des fonctions pour compatibilité
export {
  // Fonctions principales
  createTicket,
  terminerTicket,
  getTicketsActifs,
  listenToTicketsActifs,
  getTicketsByStatus,
  getTicketsTermines,
  getTicketByTableId,
  ticketEncaisse,
  updateTicket,
  updateStatusPlat,
  changeStatusTicket,
  
  // Fonctions de hachage
  calculateTicketHash,
  getLastTerminatedTicketHash,
  
  // Utilitaires cache
  clearTicketsCache,
  clearTableCache,
  getTicketsCacheInfo,
  getTableCacheInfo,
  logCacheStatus
};

