import {
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  doc
} from "firebase/firestore";
import { TicketData } from './types';
import { getTicketsCollectionRef } from './config';
import {
  getTicketsActifsCache,
  getLastTicketsActifsCacheUpdate,
  getTicketsByTableCache,
  getTicketsByTableCacheTimestamp,
  getTicketsCacheDuration,
  getTableCacheDuration,
  setTicketsActifsCache,
  setLastTicketsActifsCacheUpdate,
  logCacheStatus
} from './cache';
import { startTicketsRealtimeSync, getTicketListenersStatus } from './realtime';
import { getAllTicketHeads, getTicketHead } from './globalChain';

// Variable pour s'assurer qu'on démarre la sync une seule fois par restaurant
let syncStartedForRestaurants = new Set<string>();

/**
 * 🚀 Auto-démarrage de la synchronisation temps réel des tickets
 */
const ensureTicketsRealtimeSyncStarted = async (restaurantId: string) => {
  const status = getTicketListenersStatus();
  
  // Si déjà démarré pour ce restaurant, ne rien faire
  if (syncStartedForRestaurants.has(restaurantId) && status.isActive) {
    return;
  }
  
  try {
    console.log(`🚀 Auto-démarrage de la synchronisation tickets pour ${restaurantId}`);
    await startTicketsRealtimeSync(restaurantId);
    syncStartedForRestaurants.add(restaurantId);
    console.log(`✅ Synchronisation tickets auto-démarrée pour ${restaurantId}`);
  } catch (error) {
    console.warn(`⚠️ Impossible de démarrer la sync tickets pour ${restaurantId}:`, error);
    // Continue sans sync (fallback sur cache statique)
  }
};

/**
 * ✅ NOUVELLE ARCHITECTURE - Récupère tous les tickets actifs via la chaîne globale
 * Remplace l'ancien système where('active', '==', true)
 */
export const getTicketsActifs = async (restaurantId: string): Promise<TicketData[]> => {
  try {
    console.log(`🔄 [getTicketsActifs] Récupération via chaîne globale pour ${restaurantId}`);
    
    // 🚀 Auto-démarrer la synchronisation si nécessaire
    await ensureTicketsRealtimeSyncStarted(restaurantId);

    // Vérifier le cache d'abord
    const now = Date.now();
    const lastUpdate = getLastTicketsActifsCacheUpdate();
    const cacheIsValid = lastUpdate && (now - lastUpdate) < getTicketsCacheDuration();
    
    if (cacheIsValid) {
      const ticketsActifsCache = getTicketsActifsCache();
      if (ticketsActifsCache && ticketsActifsCache.length > 0) {
        console.log(`✅ Utilisation du cache (${ticketsActifsCache.length} tickets)`);
        return ticketsActifsCache;
      }
    }

    console.log(`🔄 Chargement des tickets actifs via chaîne globale...`);
    
    // ✅ NOUVELLE ARCHITECTURE : Utiliser getAllTicketHeads
    const headBlocks = await getAllTicketHeads(restaurantId);
    const tickets: TicketData[] = [];
    const ticketsRef = getTicketsCollectionRef(restaurantId);

    // Récupérer les données complètes pour chaque head
    for (const headBlock of headBlocks) {
      try {
        const ticketRef = doc(ticketsRef, headBlock.ticketId);
        const ticketSnap = await getDoc(ticketRef);
        
        if (ticketSnap.exists()) {
          const ticketData = { id: headBlock.ticketId, ...ticketSnap.data() } as TicketData;
          // Filtrer seulement les tickets non terminés
          if (ticketData.status !== 'encaissee') {
            tickets.push(ticketData);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erreur récupération ticket head:', headBlock.ticketId, error);
      }
    }
    
    // Trier par date de création décroissante
    tickets.sort((a, b) => {
      const dateA = a.dateCreation instanceof Date ? a.dateCreation : new Date((a.dateCreation as any)?.seconds * 1000 || 0);
      const dateB = b.dateCreation instanceof Date ? b.dateCreation : new Date((b.dateCreation as any)?.seconds * 1000 || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Mettre en cache
    setTicketsActifsCache(tickets);
    setLastTicketsActifsCacheUpdate(now);
    
    console.log(`✅ ${tickets.length} tickets actifs chargés via chaîne globale`);
    return tickets;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des tickets actifs:`, error);
    
    // En cas d'erreur, retourner le cache si disponible
    const ticketsActifsCache = getTicketsActifsCache();
    if (ticketsActifsCache) {
      console.log(`🔄 Utilisation du cache de secours`);
      return ticketsActifsCache;
    }
    
    throw error;
  }
};

/**
 *  NOUVELLE ARCHITECTURE - Récupère un ticket actif par Table ID via chaîne globale
 */
export const getTicketByTableId = async (tableId: number, restaurantId: string, useCache = true): Promise<TicketData | null> => {
  try {
    // Validation des paramètres
    if (!restaurantId || restaurantId.trim() === '') {
      console.error('getTicketByTableId: Restaurant ID manquant ou vide');
      return null;
    }
    
    if (!tableId || isNaN(tableId)) {
      console.error('getTicketByTableId: Table ID invalide:', tableId);
      return null;
    }
    
    const now = Date.now();
    const ticketsByTableCache = getTicketsByTableCache();
    const ticketsByTableCacheTimestamp = getTicketsByTableCacheTimestamp();
    const TABLE_CACHE_DURATION = getTableCacheDuration();
    
    // Vérifier le cache par table d'abord
    if (useCache && ticketsByTableCache.has(tableId)) {
      const cacheTime = ticketsByTableCacheTimestamp.get(tableId) || 0;
      if ((now - cacheTime) < TABLE_CACHE_DURATION) {
        const cachedResult = ticketsByTableCache.get(tableId);
        console.log(`📱 [CACHE] Ticket table ${tableId} depuis le cache:`, cachedResult ? `ID ${cachedResult.id}` : 'null');
        
        // Debug: Afficher l'état du cache
        logCacheStatus(`Table ${tableId} - Cache HIT`);
        
        return cachedResult || null;
      }
    }
    
    // Si on arrive ici, c'est un cache MISS
    console.log(`🔍 [NOUVELLE ARCHI] Cache MISS - Recherche ticket table ${tableId} via chaîne globale`);
    logCacheStatus(`Table ${tableId} - Cache MISS`);
    
    // ✅ NOUVELLE ARCHITECTURE : Chercher via la chaîne globale
    const headBlocks = await getAllTicketHeads(restaurantId);
    const ticketsRef = getTicketsCollectionRef(restaurantId);
    
    // Parcourir tous les heads pour trouver le bon tableId
    for (const headBlock of headBlocks) {
      try {
        const ticketRef = doc(ticketsRef, headBlock.ticketId);
        const ticketSnap = await getDoc(ticketRef);
        
        if (ticketSnap.exists()) {
          const ticketData = { id: headBlock.ticketId, ...ticketSnap.data() } as TicketData;
          
          // 🔧 CORRECTION : Vérifier le tableId et que le ticket n'est pas terminé
          if (ticketData.tableId === tableId && ticketData.status !== 'encaissee') {
            console.log(`✅ [NOUVELLE ARCHI] Ticket trouvé pour table ${tableId}:`, ticketData.id);
            
            // Mettre en cache
            if (useCache) {
              ticketsByTableCache.set(tableId, ticketData);
              ticketsByTableCacheTimestamp.set(tableId, now);
            }
            
            return ticketData;
          }
        }
      } catch (error) {
        console.warn('⚠️ Erreur traitement head pour tableId:', error);
      }
    }
    
    console.log(`🔍 [NOUVELLE ARCHI] Aucun ticket actif trouvé pour table ${tableId}`);
    
    // Mettre en cache le résultat null
    if (useCache) {
      ticketsByTableCache.set(tableId, null);
      ticketsByTableCacheTimestamp.set(tableId, now);
    }
    
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du ticket:", error);
    return null;
  }
};

/**
 * 📊 NOUVELLE ARCHITECTURE - Récupère tickets par statut via chaîne globale
 */
export const getTicketsByStatus = async (restaurantId: string, status: TicketData['status']): Promise<TicketData[]> => {
  try {
    console.log(`🔄 [getTicketsByStatus] Récupération tickets statut: ${status} via chaîne globale`);
    
    // Récupérer tous les heads depuis la chaîne globale
    const headBlocks = await getAllTicketHeads(restaurantId);
    const tickets: TicketData[] = [];
    const ticketsRef = getTicketsCollectionRef(restaurantId);

    // Filtrer par statut
    for (const headBlock of headBlocks) {
      try {
        const ticketRef = doc(ticketsRef, headBlock.ticketId);
        const ticketSnap = await getDoc(ticketRef);
        
        if (ticketSnap.exists()) {
          const ticketData = { id: headBlock.ticketId, ...ticketSnap.data() } as TicketData;
          
          if (ticketData.status === status) {
            tickets.push(ticketData);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erreur traitement head pour statut:', error);
      }
    }
    
    // Trier par date de création décroissante
    tickets.sort((a, b) => {
      const dateA = a.dateCreation instanceof Date ? a.dateCreation : new Date((a.dateCreation as any)?.seconds * 1000 || 0);
      const dateB = b.dateCreation instanceof Date ? b.dateCreation : new Date((b.dateCreation as any)?.seconds * 1000 || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`✅ ${tickets.length} tickets trouvés avec statut: ${status}`);
    return tickets;
  } catch (error) {
    console.error(`❌ Erreur récupération tickets par statut:`, error);
    return [];
  }
};

/**
 * 🗑️ NOUVELLE ARCHITECTURE - Récupère tickets supprimés via chaîne globale
 */
export const getDeletedTickets = async (restaurantId: string): Promise<TicketData[]> => {
  try {
    console.log(`🗑️ [getDeletedTickets] Recherche tickets supprimés via chaîne globale`);
    
    // Dans la nouvelle architecture, on cherche les opérations de type 'cancel'
    // Pour l'instant, on fait une requête simple sur les tickets marqués deleted
    const q = query(
      getTicketsCollectionRef(restaurantId),
      where('deleted', '==', true),
      orderBy('dateModification', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tickets: TicketData[] = [];
    
    querySnapshot.forEach((doc) => {
      tickets.push({ 
        id: doc.id, 
        ...doc.data() 
      } as TicketData);
    });
    
    console.log(`✅ ${tickets.length} tickets supprimés trouvés`);
    return tickets;
  } catch (error) {
    console.error(`❌ Erreur récupération tickets supprimés:`, error);
    return [];
  }
};
