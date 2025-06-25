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

// ====== FONCTIONS DE REQUÊTE ET RECHERCHE ======

/**
 * 📋 RÉCUPÉRER TICKETS ACTIFS - Performance optimisée avec cache
 */
export const getTicketsActifs = async (restaurantId: string, useCache = true): Promise<TicketData[]> => {
  try {
    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    await ensureTicketsRealtimeSyncStarted(restaurantId);

    const now = Date.now();
    const ticketsActifsCache = getTicketsActifsCache();
    const lastTicketsActifsCacheUpdate = getLastTicketsActifsCacheUpdate();
    const TICKETS_CACHE_DURATION = getTicketsCacheDuration();
    
    // Vérifier le cache
    if (useCache && ticketsActifsCache && (now - lastTicketsActifsCacheUpdate) < TICKETS_CACHE_DURATION) {
      console.log(`📱 ${ticketsActifsCache.length} tickets actifs depuis le cache`);
      return ticketsActifsCache;
    }

    console.log(`🔄 Chargement des tickets actifs depuis Firebase...`);
    
    // ✅ LIRE SEULEMENT les tickets actifs
    const q = query(
      getTicketsCollectionRef(restaurantId),
      where('active', '==', true),
      orderBy('dateCreation', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tickets: TicketData[] = [];
    
    querySnapshot.forEach((doc) => {
      tickets.push({ 
        id: doc.id, 
        ...doc.data() 
      } as TicketData);
    });
    
    // Mettre en cache
    setTicketsActifsCache(tickets);
    setLastTicketsActifsCacheUpdate(now);
    
    console.log(`✅ ${tickets.length} tickets actifs chargés et mis en cache`);
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
 * 📊 ÉCOUTE TEMPS RÉEL - Tickets actifs seulement
 */
export const listenToTicketsActifs = (restaurantId: string, callback: (tickets: TicketData[]) => void): Unsubscribe => {
  const q = query(
    getTicketsCollectionRef(restaurantId),
    where('active', '==', true),
    orderBy('dateCreation', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const tickets: TicketData[] = [];
    snapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data()
      } as TicketData);
    });
    
    // Mettre à jour le cache lors des changements temps réel
    setTicketsActifsCache(tickets);
    setLastTicketsActifsCacheUpdate(Date.now());
    
    console.log(`🔄 ${tickets.length} tickets actifs mis à jour (temps réel)`);
    callback(tickets);
  });
};

/**
 * 🔍 RÉCUPÉRER UN TICKET ACTIF PAR TABLE ID - AVEC CACHE OPTIMISÉ
 * Cherche dans la collection tickets avec active=true
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
    console.log(`🔍 [FIREBASE] Cache MISS - Recherche ticket pour table ${tableId} (type: ${typeof tableId})`);
    logCacheStatus(`Table ${tableId} - Cache MISS`);
    
    // Chercher dans la collection tickets avec active=true
    const q = query(
      getTicketsCollectionRef(restaurantId),
      where("tableId", "==", tableId),
      where("active", "==", true)
    );
    
    console.log(`🔍 [FIREBASE] Exécution requête collection 'tickets' avec tableId: ${tableId} et active: true`);
    const querySnapshot = await getDocs(q);
    console.log(`🔍 [FIREBASE] Résultats 'tickets' (actifs): ${querySnapshot.size} documents`);
    
    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      const ticketData = docSnapshot.data() as Omit<TicketData, 'id'>;
      const ticket = { id: docSnapshot.id, ...ticketData };
      
      // Mettre en cache le résultat
      ticketsByTableCache.set(tableId, ticket);
      ticketsByTableCacheTimestamp.set(tableId, now);
      
      console.log(`✅ [FIREBASE] Ticket trouvé dans collection tickets et mis en cache:`, ticket);
      return ticket;
    }
    
    // Aucun ticket trouvé - mettre null en cache
    ticketsByTableCache.set(tableId, null);
    ticketsByTableCacheTimestamp.set(tableId, now);
    
    console.log(`❌ [FIREBASE] Aucun ticket trouvé pour la table ${tableId} - mis en cache (null)`);
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du ticket:", error);
    return null;
  }
};

/**
 * 📊 RÉCUPÉRER TICKETS PAR STATUT
 */
export const getTicketsByStatus = async (restaurantId: string, status: TicketData['status'], activeOnly = true): Promise<TicketData[]> => {
  try {
    console.log(`🔄 Récupération des tickets avec statut: ${status}`);
    
    const q = query(
      getTicketsCollectionRef(restaurantId),
      where("status", "==", status),
      where("active", "==", activeOnly),
      orderBy('dateCreation', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tickets: TicketData[] = [];
    
    querySnapshot.forEach((doc) => {
      tickets.push({ 
        id: doc.id, 
        ...(doc.data() as Omit<TicketData, 'id'>) 
      });
    });
    
    console.log(`✅ ${tickets.length} tickets trouvés avec statut ${status}`);
    return tickets;
  } catch (error) {
    console.error(`❌ Erreur récupération tickets (${status}):`, error);
    throw error;
  }
};

/**
 * 📈 RÉCUPÉRER LES TICKETS TERMINÉS (pour statistiques)
 */
export const getTicketsTermines = async (restaurantId: string, limitCount?: number): Promise<TicketData[]> => {
  try {
    console.log(`🔄 Récupération des tickets terminés (limite: ${limitCount || 'aucune'})`);
    
    let q = query(
      getTicketsCollectionRef(restaurantId),
      where('active', '==', false),
      orderBy('dateTerminee', 'desc')
    );
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const tickets: TicketData[] = [];
    
    querySnapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data()
      } as TicketData);
    });
    
    console.log(`✅ ${tickets.length} tickets terminés récupérés`);
    return tickets;
  } catch (error) {
    console.error('❌ Erreur récupération tickets terminés:', error);
    throw error;
  }
};
