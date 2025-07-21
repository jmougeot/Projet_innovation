import { TicketData } from './types';

// Cache pour tickets ACTIFS uniquement - Performance optimisée
let ticketsActifsCache: TicketData[] | null = null;
let lastTicketsActifsCacheUpdate = 0;
const TICKETS_CACHE_DURATION = 30000; // 30 secondes

// Cache spécifique par table pour éviter les requêtes répétitives
let ticketsByTableCache: Map<number, TicketData | null> = new Map();
let ticketsByTableCacheTimestamp: Map<number, number> = new Map();
const TABLE_CACHE_DURATION = 60000; // 1 minute - plus long car moins volatil

// ====== GESTION CACHE OPTIMISÉE ======

export const clearTicketsCache = () => {
  ticketsActifsCache = null;
  lastTicketsActifsCacheUpdate = 0;
  ticketsByTableCache.clear();
  ticketsByTableCacheTimestamp.clear();
  console.log('🗑️ Cache des tickets actifs et par table vidé');
};

export const clearTableCache = (tableId: number) => {
  ticketsByTableCache.delete(tableId);
  ticketsByTableCacheTimestamp.delete(tableId);
  console.log(`🗑️ Cache de la table ${tableId} vidé`);
};

export const getTicketsCacheInfo = () => {
  const now = Date.now();
  const timeLeft = ticketsActifsCache ? Math.max(0, TICKETS_CACHE_DURATION - (now - lastTicketsActifsCacheUpdate)) : 0;
  return {
    isActive: !!ticketsActifsCache,
    itemsCount: ticketsActifsCache?.length || 0,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: TICKETS_CACHE_DURATION,
    durationFormatted: `${TICKETS_CACHE_DURATION / 1000}s`
  };
};

export const getTableCacheInfo = () => {
  const now = Date.now();
  const tablesCached = Array.from(ticketsByTableCache.keys());
  const tablesInfo = tablesCached.map(tableId => {
    const cacheTime = ticketsByTableCacheTimestamp.get(tableId) || 0;
    const timeLeft = Math.max(0, TABLE_CACHE_DURATION - (now - cacheTime));
    const cachedData = ticketsByTableCache.get(tableId);
    return {
      tableId,
      hasTicket: !!cachedData,
      ticketId: cachedData?.id || null,
      timeLeftMs: timeLeft,
      timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`
    };
  });
  
  return {
    totalTablesCached: tablesCached.length,
    tablesInfo,
    cacheDurationMs: TABLE_CACHE_DURATION,
    cacheDurationFormatted: `${TABLE_CACHE_DURATION / 1000}s`
  };
};

export const logCacheStatus = (context?: string) => {
  const globalCache = getTicketsCacheInfo();
  const tableCache = getTableCacheInfo();
  
  console.log(`📊 [CACHE${context ? ` - ${context}` : ''}] ==================`);
  console.log(`📊 Cache global: ${globalCache.isActive ? 'ACTIF' : 'INACTIF'} - ${globalCache.itemsCount} tickets - ${globalCache.timeLeftFormatted} restantes`);
  console.log(`📊 Cache tables: ${tableCache.totalTablesCached} tables en cache`);
  tableCache.tablesInfo.forEach((info: any) => {
    console.log(`   └─ Table ${info.tableId}: ${info.hasTicket ? `Ticket ${info.ticketId}` : 'Pas de ticket'} (${info.timeLeftFormatted})`);
  });
  console.log(`📊 ================================================`);
};

// ====== FONCTIONS DE MISE À JOUR INTELLIGENTE DU CACHE ======

/**
 * Met à jour un ticket spécifique dans le cache au lieu de vider tout le cache
 * ✅ NOUVELLE ARCHITECTURE - Plus de gestion du booléen active
 */
export const updateTicketInCache = (updatedTicket: TicketData) => {
  // Mettre à jour le cache global des tickets actifs
  if (ticketsActifsCache) {
    const index = ticketsActifsCache.findIndex(ticket => ticket.id === updatedTicket.id);
    if (index !== -1) {
      // Si le ticket est terminé, le retirer du cache des actifs
      if (updatedTicket.status === 'encaissee') {
        ticketsActifsCache.splice(index, 1);
        console.log(`🔄 Ticket ${updatedTicket.id} retiré du cache (terminé)`);
      } else {
        // Sinon, mettre à jour le ticket existant
        ticketsActifsCache[index] = updatedTicket;
        console.log(`🔄 Ticket ${updatedTicket.id} mis à jour dans le cache`);
      }
    } else if (updatedTicket.status !== 'encaissee') {
      // Si c'est un nouveau ticket non terminé, l'ajouter au cache
      ticketsActifsCache.unshift(updatedTicket); // Ajouter au début (plus récent)
      console.log(`🔄 Nouveau ticket ${updatedTicket.id} ajouté au cache`);
    }
  }
  
  // Mettre à jour le cache par table si le ticket correspond
  if (ticketsByTableCache.has(updatedTicket.tableId)) {
    if (updatedTicket.status !== 'encaissee') {
      ticketsByTableCache.set(updatedTicket.tableId, updatedTicket);
      ticketsByTableCacheTimestamp.set(updatedTicket.tableId, Date.now());
      console.log(`🔄 Cache table ${updatedTicket.tableId} mis à jour`);
    } else {
      // Si le ticket est terminé, retirer de ce cache
      ticketsByTableCache.set(updatedTicket.tableId, null);
      ticketsByTableCacheTimestamp.set(updatedTicket.tableId, Date.now());
      console.log(`🔄 Cache table ${updatedTicket.tableId} vidé (ticket terminé)`);
    }
  }
};

/**
 * Ajoute un nouveau ticket au cache
 * ✅ NOUVELLE ARCHITECTURE - Plus de gestion du booléen active
 */
export const addTicketToCache = (newTicket: TicketData) => {
  // Ajouter au cache global des tickets actifs
  if (ticketsActifsCache && newTicket.status !== 'encaissee') {
    ticketsActifsCache.unshift(newTicket); // Ajouter au début (plus récent)
    console.log(`➕ Nouveau ticket ${newTicket.id} ajouté au cache global`);
  }
  
  // Ajouter au cache par table SEULEMENT si le ticket n'est pas terminé
  if (newTicket.status !== 'encaissee') {
    ticketsByTableCache.set(newTicket.tableId, newTicket);
    ticketsByTableCacheTimestamp.set(newTicket.tableId, Date.now());
    console.log(`➕ Nouveau ticket ${newTicket.id} ajouté au cache table ${newTicket.tableId}`);
  } else {
    // Si le ticket est terminé, le retirer du cache de la table
    ticketsByTableCache.set(newTicket.tableId, null);
    ticketsByTableCacheTimestamp.delete(newTicket.tableId);
    console.log(`➖ Ticket terminé ${newTicket.id} retiré du cache table ${newTicket.tableId}`);
  }
};

/**
 * Retire un ticket du cache après suppression ou inactivation
 */
export const removeTicketFromCache = (ticketId: string, tableId: number) => {
  // Retirer du cache global des tickets actifs
  if (ticketsActifsCache) {
    const index = ticketsActifsCache.findIndex(ticket => ticket.id === ticketId);
    if (index !== -1) {
      ticketsActifsCache.splice(index, 1);
      console.log(`➖ Ticket ${ticketId} retiré du cache global`);
    }
  }
  
  // Retirer du cache par table
  ticketsByTableCache.set(tableId, null);
  ticketsByTableCacheTimestamp.set(tableId, Date.now());
  console.log(`➖ Cache table ${tableId} vidé après suppression ticket ${ticketId}`);
};

/**
 * Met à jour seulement le cache d'une table spécifique
 */
export const updateTableCacheWithTicket = (tableId: number, ticket: TicketData | null) => {
  ticketsByTableCache.set(tableId, ticket);
  ticketsByTableCacheTimestamp.set(tableId, Date.now());
  console.log(`🔄 Cache table ${tableId} mis à jour:`, ticket ? `ticket ${ticket.id}` : 'null');
};

/**
 * Invalide sélectivement le cache si nécessaire (pour les cas complexes)
 */
export const invalidateCacheSelectively = (options: {
  globalCache?: boolean;
  tableIds?: number[];
  allTables?: boolean;
}) => {
  if (options.globalCache) {
    ticketsActifsCache = null;
    lastTicketsActifsCacheUpdate = 0;
    console.log('🗑️ Cache global des tickets actifs invalidé');
  }
  
  if (options.allTables) {
    ticketsByTableCache.clear();
    ticketsByTableCacheTimestamp.clear();
    console.log('🗑️ Tous les caches de tables invalidés');
  } else if (options.tableIds) {
    options.tableIds.forEach(tableId => {
      ticketsByTableCache.delete(tableId);
      ticketsByTableCacheTimestamp.delete(tableId);
      console.log(`🗑️ Cache table ${tableId} invalidé`);
    });
  }
};

// Getters pour le cache (pour usage interne)
export const getTicketsActifsCache = () => ticketsActifsCache;
export const getLastTicketsActifsCacheUpdate = () => lastTicketsActifsCacheUpdate;
export const getTicketsByTableCache = () => ticketsByTableCache;
export const getTicketsByTableCacheTimestamp = () => ticketsByTableCacheTimestamp;
export const getTicketsCacheDuration = () => TICKETS_CACHE_DURATION;
export const getTableCacheDuration = () => TABLE_CACHE_DURATION;

// Setters pour le cache (pour usage interne)
export const setTicketsActifsCache = (cache: TicketData[] | null) => {
  ticketsActifsCache = cache;
};

export const setLastTicketsActifsCacheUpdate = (timestamp: number) => {
  lastTicketsActifsCacheUpdate = timestamp;
};
