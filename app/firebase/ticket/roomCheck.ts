import { getTicketByTableId } from './queries';
import { 
  startTicketsRealtimeSync, 
  getTicketListenersStatus 
} from './realtime';
import {
  getTicketsByTableCache,
  getTicketsByTableCacheTimestamp,
  getTableCacheDuration
} from './cache';

// Variable pour s'assurer qu'on démarre la sync une seule fois par restaurant
let syncStartedForRestaurants = new Set<string>();

/**
 * 🚀 Auto-démarrage de la synchronisation temps réel des tickets pour roomCheck
 */
const ensureTicketsRealtimeSyncStarted = async (restaurantId: string) => {
  const status = getTicketListenersStatus();
  
  // Si déjà démarré pour ce restaurant, ne rien faire
  if (syncStartedForRestaurants.has(restaurantId) && status.isActive) {
    return;
  }
  
  try {
    console.log(`🚀 Auto-démarrage de la synchronisation tickets pour roomCheck ${restaurantId}`);
    await startTicketsRealtimeSync(restaurantId);
    syncStartedForRestaurants.add(restaurantId);
    console.log(`✅ Synchronisation tickets auto-démarrée pour roomCheck ${restaurantId}`);
  } catch (error) {
    console.warn(`⚠️ Impossible de démarrer la sync tickets pour roomCheck ${restaurantId}:`, error);
    // Continue sans sync (fallback sur requêtes manuelles)
  }
};

/**
 * 🚀 Vérification rapide d'un ticket pour une table via le cache temps réel
 */
const getActiveTicketFromCache = (tableId: number): { ticketId: string; isActive: boolean } | null => {
  const ticketsByTableCache = getTicketsByTableCache();
  const ticketsByTableCacheTimestamp = getTicketsByTableCacheTimestamp();
  const TABLE_CACHE_DURATION = getTableCacheDuration();
  
  const cachedTicket = ticketsByTableCache.get(tableId);
  const cacheTime = ticketsByTableCacheTimestamp.get(tableId) || 0;
  const now = Date.now();
  
  // Vérifier si le cache est valide
  if (cachedTicket && (now - cacheTime) < TABLE_CACHE_DURATION) {
    return {
      ticketId: cachedTicket.id,
      isActive: cachedTicket.status !== 'encaissee'
    };
  }
  
  return null;
};

export interface ActiveTicketCheckResult {
  hasActiveTickets: boolean;
  activeTicketsCount: number;
  activeTablesWithTickets: { tableId: number; tableNumero: string; ticketId: string }[];
  message: string;
}

/**
 * Vérifie s'il y a des tickets actifs dans une salle donnée - Version optimisée avec cache temps réel
 * @param roomId ID de la salle
 * @param restaurantId ID du restaurant
 * @returns Object avec le statut et les détails des tickets actifs
 */
export const checkActiveTicketsInRoom = async (
  roomId: string, 
  restaurantId: string
): Promise<ActiveTicketCheckResult> => {
  try {
    console.log(`🔍 Vérification des tickets actifs dans la salle ${roomId} (avec cache temps réel)`);
    
    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    await ensureTicketsRealtimeSyncStarted(restaurantId);
    
    // Import dynamique pour éviter les dépendances circulaires
    const { getAllTables } = await import('@/app/firebase/room&table/table');
    
    // 1. Récupérer toutes les tables de la salle
    const tables = await getAllTables(roomId, true, restaurantId);
    console.log(`📊 ${tables.length} tables trouvées dans la salle ${roomId}`);
    
    if (tables.length === 0) {
      return {
        hasActiveTickets: false,
        activeTicketsCount: 0,
        activeTablesWithTickets: [],
        message: `Aucune table dans la salle ${roomId}, suppression possible.`
      };
    }
    
    // 2. Vérifier chaque table pour des tickets actifs - VERSION OPTIMISÉE
    const activeTablesWithTickets: { tableId: number; tableNumero: string; ticketId: string }[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;
    
    for (const table of tables) {
      try {
        // 🚀 Essayer d'abord le cache temps réel
        const cachedTicket = getActiveTicketFromCache(table.id);
        
        if (cachedTicket) {
          cacheHits++;
          if (cachedTicket.isActive) {
            activeTablesWithTickets.push({
              tableId: table.id,
              tableNumero: table.numero,
              ticketId: cachedTicket.ticketId
            });
            console.log(`🎫 Ticket actif trouvé (CACHE): Table ${table.numero} (ID: ${table.id}) -> Ticket ${cachedTicket.ticketId}`);
          }
        } else {
          // 📡 Fallback sur requête Firebase si pas dans le cache
          cacheMisses++;
          console.log(`💾 Cache miss pour table ${table.id}, requête Firebase...`);
          
          const activeTicket = await getTicketByTableId(table.id, restaurantId, true);
          if (activeTicket && activeTicket.status !== 'encaissee') {
            activeTablesWithTickets.push({
              tableId: table.id,
              tableNumero: table.numero,
              ticketId: activeTicket.id
            });
            console.log(`🎫 Ticket actif trouvé (FIREBASE): Table ${table.numero} (ID: ${table.id}) -> Ticket ${activeTicket.id}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erreur lors de la vérification de la table ${table.id}:`, error);
        // Continue avec les autres tables
      }
    }
    
    const hasActiveTickets = activeTablesWithTickets.length > 0;
    const activeTicketsCount = activeTablesWithTickets.length;
    
    // 📊 Statistiques de performance du cache
    console.log(`📈 Performance roomCheck: ${cacheHits} cache hits, ${cacheMisses} cache misses (${Math.round((cacheHits / (cacheHits + cacheMisses)) * 100)}% hit rate)`);
    
    let message: string;
    if (hasActiveTickets) {
      const tablesList = activeTablesWithTickets
        .map(item => `Table ${item.tableNumero} (Ticket: ${item.ticketId})`)
        .join(', ');
      message = `❌ Impossible de supprimer la salle "${roomId}". ${activeTicketsCount} table(s) avec tickets actifs: ${tablesList}`;
    } else {
      message = `✅ Aucun ticket actif dans la salle "${roomId}". Suppression possible.`;
    }
    
    console.log(message);
    
    return {
      hasActiveTickets,
      activeTicketsCount,
      activeTablesWithTickets,
      message
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification des tickets actifs dans la salle ${roomId}:`, error);
    throw error;
  }
};

/**
 * 🚀 Vérifie plusieurs salles en parallèle pour des tickets actifs - Version ultra-optimisée
 * @param roomIds Liste des IDs de salles à vérifier
 * @param restaurantId ID du restaurant
 * @returns Map des résultats par salle
 */
export const checkActiveTicketsInMultipleRooms = async (
  roomIds: string[],
  restaurantId: string
): Promise<Map<string, ActiveTicketCheckResult>> => {
  try {
    console.log(`🔍 Vérification en parallèle de ${roomIds.length} salles pour tickets actifs`);
    
    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    await ensureTicketsRealtimeSyncStarted(restaurantId);
    
    // Vérifier toutes les salles en parallèle
    const promises = roomIds.map(roomId => 
      checkActiveTicketsInRoom(roomId, restaurantId)
        .then(result => ({ roomId, result }))
        .catch(error => ({ 
          roomId, 
          result: {
            hasActiveTickets: false,
            activeTicketsCount: 0,
            activeTablesWithTickets: [],
            message: `Erreur lors de la vérification: ${error.message}`
          } as ActiveTicketCheckResult
        }))
    );
    
    const results = await Promise.all(promises);
    
    // Convertir en Map pour faciliter l'accès
    const resultMap = new Map<string, ActiveTicketCheckResult>();
    results.forEach(({ roomId, result }) => {
      resultMap.set(roomId, result);
    });
    
    const totalActiveTickets = Array.from(resultMap.values())
      .reduce((sum, result) => sum + result.activeTicketsCount, 0);
    
    console.log(`✅ Vérification parallèle terminée: ${totalActiveTickets} tickets actifs au total`);
    
    return resultMap;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification parallèle des salles:', error);
    throw error;
  }
};
