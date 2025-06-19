import {
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  runTransaction,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Plat } from "./firebaseMenu";

// ====== INTERFACES OPTIMISÉES ======

export interface PlatQuantite {
  plat: Plat;
  quantite: number;
  status: 'en_attente' | 'en_preparation' | 'pret' | 'servi' | 'envoye';
  tableId: number;
  mission?: string;
}

export interface TicketData {
  id: string;
  employeeId: string;
  plats: PlatQuantite[];
  totalPrice: number;
  active: boolean; // Indique si le ticket est actif ou non
  status: 'en_attente' | 'en_preparation' | 'prete' | 'servie' | 'encaissee';
  timestamp: Timestamp | Date;
  tableId: number;
  dateCreation?: Timestamp | Date;
  dateTerminee?: Timestamp | Date; // Date de fin si le ticket est terminé
  estimatedTime?: number; // Temps estimé en minutes
  dureeTotal?: number; // Durée en millisecondes (calculée à la fin)
  satisfaction?: number; // Note de 1 à 5
  notes?: string;
}

// Interface for ticket creation
export interface CreateTicketData {
  employeeId: string;
  plats: PlatQuantite[];
  totalPrice: number;
  tableId: number;
}

// Collections - Une seule collection de tickets
const RESTAURANTS_COLLECTION = 'restaurants';

// Helper functions to get collection references
const getTicketRestaurantRef = (restaurantId: string) => {
  if (!restaurantId || restaurantId.trim() === '') {
    throw new Error('Restaurant ID is required and cannot be empty');
  }
  return doc(db, RESTAURANTS_COLLECTION, restaurantId);
};

const getTicketsCollectionRef = (restaurantId: string) => {
  return collection(getTicketRestaurantRef(restaurantId), 'tickets');
};

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
  // Vider aussi le cache par table
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

// ====== FONCTIONS PRINCIPALES OPTIMISÉES ======

/**
 * 🎯 CRÉATION DE TICKET - Une seule collection tickets avec active=true
 */
export const createTicket = async (ticketData: Omit<TicketData, 'id'>, restaurantId: string): Promise<string> => {
  try {
    if (!ticketData.plats || !ticketData.tableId) {
      throw new Error("Données de ticket incomplètes");
    }

    // Filter out undefined values
    const filteredTicketData = Object.fromEntries(
      Object.entries({
        ...ticketData,
        active: true, // Nouveau ticket = actif
        status: 'en_attente' as const,
        dateCreation: serverTimestamp(),
        timestamp: serverTimestamp()
      }).filter(([_, value]) => value !== undefined)
    );

    // ✅ CRÉER dans la collection restaurant/tickets
    const docRef = await addDoc(getTicketsCollectionRef(restaurantId), filteredTicketData);
    
    // Invalider le cache après ajout
    clearTicketsCache();
    console.log("✅ Ticket créé dans collection restaurant/tickets, ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Erreur lors de la création du ticket:", error);
    throw error;
  }
};

/**
 * 🏁 TERMINER TICKET - Marquer comme inactif avec active=false
 */
export const terminerTicket = async (ticketId: string, restaurantId: string, satisfaction?: number, notes?: string): Promise<void> => {
  try {
    console.log(`🏁 [TERMINER] Finalisation ticket: ${ticketId}`);
    
    // Chercher le ticket dans la collection tickets
    const ticketRef = doc(getTicketsCollectionRef(restaurantId), ticketId);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      throw new Error('Ticket introuvable');
    }
    
    const ticketData = ticketDoc.data() as TicketData;
    const dateCreation = ticketData.dateCreation instanceof Date 
      ? ticketData.dateCreation.getTime() 
      : ticketData.dateCreation?.toMillis ? ticketData.dateCreation.toMillis() 
      : Date.now();
    
    // Mettre à jour le ticket: active=false + métadonnées de fin
    const updateData: Partial<TicketData> = {
      active: false,
      status: 'encaissee',
      dateTerminee: serverTimestamp() as any, // Firebase Timestamp
      dureeTotal: Date.now() - dateCreation,
      // Only include satisfaction and notes if defined
      ...(satisfaction !== undefined && { satisfaction }),
      ...(notes !== undefined && { notes })
    };
    
    await updateDoc(ticketRef, updateData);
    
    // Invalider le cache après modification
    clearTicketsCache();
    console.log('✅ Ticket terminé et marqué comme inactif:', ticketId);
  } catch (error) {
    console.error('❌ Erreur lors de la finalisation:', error);
    throw error;
  }
};

/**
 * 📋 RÉCUPÉRER TICKETS ACTIFS - Performance optimisée avec cache
 */
export const getTicketsActifs = async (restaurantId: string, useCache = true): Promise<TicketData[]> => {
  try {
    const now = Date.now();
    
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
    ticketsActifsCache = tickets;
    lastTicketsActifsCacheUpdate = now;
    
    console.log(`✅ ${tickets.length} tickets actifs chargés et mis en cache`);
    return tickets;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des tickets actifs:`, error);
    
    // En cas d'erreur, retourner le cache si disponible
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
    ticketsActifsCache = tickets;
    lastTicketsActifsCacheUpdate = Date.now();
    
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
 * 💰 ENCAISSER UN TICKET - Marquer comme inactif
 */
export const ticketEncaisse = async (tableId: number, restaurantId: string): Promise<void> => {
  try {
    const ticket = await getTicketByTableId(tableId, restaurantId);
    if (!ticket) {
      throw new Error("Ticket non trouvé");
    }
    
    // Terminer le ticket (le marque comme inactif)
    await terminerTicket(ticket.id, restaurantId);
    
    // Invalider spécifiquement le cache de cette table
    clearTableCache(tableId);
    
    console.log(`✅ Ticket table ${tableId} encaissé et marqué comme inactif`);
  } catch (error) {
    console.error("❌ Erreur lors de l'encaissement:", error);
    throw error;
  }
};

/**
 * ✏️ METTRE À JOUR UN TICKET
 */
export const updateTicket = async (documentId: string, restaurantId: string, newData: Partial<TicketData>): Promise<void> => {
  try {
    console.log("Mise à jour du ticket:", documentId);
    
    // Mettre à jour dans la collection tickets
    const ticketRef = doc(getTicketsCollectionRef(restaurantId), documentId);
    
    // Vérifier si le document existe
    const docSnap = await getDoc(ticketRef);
    
    if (!docSnap.exists()) {
      console.log("Ticket non trouvé dans la collection tickets:", documentId);
      throw new Error("Ticket non trouvé");
    }

    // Récupérer l'ID de la table pour invalider son cache spécifique
    const currentData = docSnap.data() as TicketData;
    const tableId = currentData.tableId;

    // Mise à jour du document
    await updateDoc(ticketRef, {
      ...newData,
      timestamp: serverTimestamp()
    });

    // Invalider le cache global et le cache spécifique de la table
    clearTicketsCache();
    if (typeof tableId === 'number') {
      clearTableCache(tableId);
    }
    
    console.log("✅ Ticket mis à jour avec succès:", documentId);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    throw error;
  }
};



/**
 * 🍽️ METTRE À JOUR LE STATUT D'UN PLAT
 */
export const updateStatusPlat = async (tableId: number, restaurantId: string, platName: string, newStatus: PlatQuantite['status']): Promise<void> => {
  try {
    const ticket = await getTicketByTableId(tableId, restaurantId);
    if (!ticket) {
      throw new Error("Ticket non trouvé");
    }
    
    const platToUpdate = ticket.plats.find((p: PlatQuantite) => p.plat.name === platName);
    if (!platToUpdate) {
      throw new Error("Plat non trouvé");
    }
    
    // Mettre à jour le statut du plat
    platToUpdate.status = newStatus;
    
    // Sauvegarder le ticket mis à jour
    await updateTicket(ticket.id, restaurantId, { plats: ticket.plats });
    
    console.log(`✅ Statut du plat "${platName}" mis à jour: ${newStatus}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du statut du plat:", error);
    throw error;
  }
};

/**
 * 🔄 CHANGER LE STATUT D'UN TICKET
 */
export const changeStatusTicket = async (id: string, restaurantId: string, status: TicketData['status']): Promise<void> => {
  try {
    await updateTicket(id, restaurantId, { status });
    console.log(`✅ Statut du ticket ${id} changé vers: ${status}`);
  } catch (error) {
    console.error("❌ Erreur lors du changement de statut:", error);
    throw error;
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

/**
 * 🗑️ PURGE DES ANCIENS TICKETS TERMINÉS
 */
export const purgeOldTickets = async (restaurantId: string, monthsOld = 6): Promise<number> => {
  try {
    const dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() - monthsOld);
    
    const q = query(
      getTicketsCollectionRef(restaurantId),
      where('active', '==', false),
      where('dateTerminee', '<', dateLimit)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('Aucun ticket ancien à purger');
      return 0;
    }
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log(`✅ ${snapshot.size} tickets anciens purgés`);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Erreur lors de la purge:', error);
    throw error;
  }
};

/**
 * 🔍 DIAGNOSTIC - Vérifier l'état des tickets
 */
export const diagnosticTickets = async (restaurantId: string) => {
  try {
    console.log('🔍 === DIAGNOSTIC DES TICKETS ===');
    
    // Vérifier tickets actifs
    const qActifs = query(
      getTicketsCollectionRef(restaurantId),
      where('active', '==', true)
    );
    const snapshotActifs = await getDocs(qActifs);
    
    console.log(`📊 Tickets actifs: ${snapshotActifs.size}`);
    snapshotActifs.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: Table ${data.tableId}, Status: ${data.status}`);
    });
    
    // Vérifier tickets terminés (derniers 5)
    const qTermines = query(
      getTicketsCollectionRef(restaurantId),
      where('active', '==', false),
      orderBy('dateTerminee', 'desc'), 
      limit(5)
    );
    const snapshotTermines = await getDocs(qTermines);
    
    console.log(`📋 Derniers tickets terminés: ${snapshotTermines.size}`);
    snapshotTermines.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: Table ${data.tableId}, Terminé: ${data.dateTerminee}`);
    });
    
    return {
      ticketsActifs: snapshotActifs.size,
      ticketsTermines: snapshotTermines.size,
      diagnostic: 'success'
    };
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    throw error;
  }
};

/**
 * 🔍 DIAGNOSTIC - Lister tous les tickets par table ID
 */
export const diagnosticTicketsByTable = async (tableId: number, restaurantId: string): Promise<void> => {
  try {
    console.log(`🔍 === DIAGNOSTIC TICKETS POUR TABLE ${tableId} ===`);
    
    // Vérifier tickets actifs pour cette table
    const qActifs = query(
      getTicketsCollectionRef(restaurantId),
      where('tableId', '==', tableId),
      where('active', '==', true)
    );
    const snapshotActifs = await getDocs(qActifs);
    
    console.log(`📊 Tickets actifs pour table ${tableId}: ${snapshotActifs.size} documents`);
    snapshotActifs.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: Status: ${data.status}, Active: ${data.active}`);
    });
    
    // Vérifier tickets terminés pour cette table
    const qTermines = query(
      getTicketsCollectionRef(restaurantId),
      where('tableId', '==', tableId),
      where('active', '==', false)
    );
    const snapshotTermines = await getDocs(qTermines);
    
    console.log(`📋 Tickets terminés pour table ${tableId}: ${snapshotTermines.size} documents`);
    snapshotTermines.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: Status: ${data.status}, Active: ${data.active}, Terminé: ${data.dateTerminee}`);
    });
    
    console.log(`🔍 === FIN DIAGNOSTIC TABLE ${tableId} ===`);
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
};

// ====== EXPORTS ======

export default {
  // Fonctions principales tickets
  createTicket,
  terminerTicket,
  getTicketsActifs,
  listenToTicketsActifs,
  getTicketsByStatus,
  getTicketsTermines,
  purgeOldTickets,
  
  // Fonctions de gestion
  getTicketByTableId,
  ticketEncaisse,
  updateTicket,
  updateStatusPlat,
  changeStatusTicket,
  
  // Utilitaires cache
  clearTicketsCache,
  clearTableCache,
  getTicketsCacheInfo,
  getTableCacheInfo,
  logCacheStatus,
  
  // Diagnostics
  diagnosticTickets,
  diagnosticTicketsByTable,
  
  // Alias pour compatibilité (deprecated)
  createCommande: createTicket,
  terminerCommande: terminerTicket,
  getCommandesEnCours: getTicketsActifs,
  listenToCommandesEnCours: listenToTicketsActifs,
  getCommandesByStatus: getTicketsByStatus,
  getCommandesTerminees: getTicketsTermines,
  getCommandeByTableId: getTicketByTableId,
  CommandeEncaisse: ticketEncaisse,
  updateCommande: updateTicket,
  changeStatusCommande: changeStatusTicket,
  clearCommandesCache: clearTicketsCache,
  getCommandesCacheInfo: getTicketsCacheInfo,
  diagnosticCommandes: diagnosticTickets,
  diagnosticCommandesByTable: diagnosticTicketsByTable,
  purgeOldCommandes: purgeOldTickets
};
