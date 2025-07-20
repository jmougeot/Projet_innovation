import { 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp
} from 'firebase/firestore';
import { TicketData, UpdateTicketData, TicketChainData, BlockchainTicketInfo } from './types';
import { getTicketsCollectionRef } from './config';
import { analyzeTicketChanges } from './modifications';
import { updateTicketInCache, addTicketToCache } from './cache';
import { startTicketsRealtimeSync } from './realtime';
import { 
  addOperationToGlobalChain,
  getTicketHead,
  getAllTicketHeads,
  getTicketHistory,
  verifyGlobalChain,
  verifyTicket
} from './globalChain';

// ====== OPTIMISATIONS POUR ACCÈS RAPIDE AUX BOUTS DE BRANCHES ======

// Cache spécialisé pour les bouts de branches (tickets actifs de chaque chaîne)
let branchTipsCache: Map<string, { ticketId: string, lastUpdate: number, chainDepth: number }> = new Map();
const BRANCH_TIPS_CACHE_DURATION = 30000; // 30 secondes

/**
 * 🚀 NOUVELLE ARCHITECTURE - Récupère tous les heads via la chaîne globale
 * Utilise l'index des ticket_heads pour un accès O(1)
 */
export const getAllActiveBranchTips = async (restaurantId: string): Promise<TicketData[]> => {
  try {
    console.log('🚀 [getAllActiveBranchTips] Récupération via chaîne globale');

    // 1. Récupérer tous les heads depuis l'architecture hybride
    const headBlocks = await getAllTicketHeads(restaurantId);
    
    if (headBlocks.length === 0) {
      return [];
    }

    // 2. Pour chaque head, récupérer le ticket correspondant
    const tickets: TicketData[] = [];
    const ticketsRef = getTicketsCollectionRef(restaurantId);

    for (const headBlock of headBlocks) {
      try {
        // Le head contient les données du ticket dans block.data
        const ticketData = headBlock.data as TicketData;
        
        // Vérifier que le ticket existe toujours dans Firebase
        const ticketRef = doc(ticketsRef, headBlock.ticketId);
        const ticketSnap = await getDoc(ticketRef);
        
        if (ticketSnap.exists()) {
          // Fusionner les données du head avec celles de Firebase
          const currentTicket = { id: headBlock.ticketId, ...ticketSnap.data() } as TicketData;
          tickets.push(currentTicket);
        } else {
          console.warn('⚠️ [getAllActiveBranchTips] Ticket head sans document:', headBlock.ticketId);
        }
      } catch (error) {
        console.error('❌ [getAllActiveBranchTips] Erreur traitement head:', error);
      }
    }

    console.log('🚀 [getAllActiveBranchTips] ✅', {
      headsFound: headBlocks.length,
      ticketsRecovered: tickets.length,
      queryCount: Math.ceil(headBlocks.length / 10) + 1 // Estimation des requêtes
    });

    return tickets;

  } catch (error) {
    console.error('❌ [getAllActiveBranchTips] Erreur:', error);
    throw error;
  }
};

/**
 * ⚡ ARCHITECTURE HYBRIDE - Récupère le head d'une branche via l'index
 */
export const getBranchTip = async (
  mainChainTicketId: string,
  restaurantId: string,
  useCache = true
): Promise<TicketData> => {
  try {
    console.log('⚡ [getBranchTip] Récupération via architecture hybride:', mainChainTicketId);

    // 1. Récupérer le head depuis la chaîne globale
    const headBlock = await getTicketHead(restaurantId, mainChainTicketId);
    
    if (!headBlock) {
      throw new Error(`Aucun head trouvé pour le ticket ${mainChainTicketId}`);
    }

    // 2. Récupérer le ticket correspondant
    const ticketsRef = getTicketsCollectionRef(restaurantId);
    const ticketRef = doc(ticketsRef, headBlock.ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (!ticketSnap.exists()) {
      throw new Error(`Ticket ${headBlock.ticketId} introuvable`);
    }

    const ticket = { id: headBlock.ticketId, ...ticketSnap.data() } as TicketData;

    console.log('⚡ [getBranchTip] ✅ Head trouvé:', {
      mainChainId: mainChainTicketId,
      headTicketId: ticket.id,
      operation: headBlock.operation,
      sequenceId: headBlock.sequenceId
    });

    return ticket;

  } catch (error) {
    console.error('❌ [getBranchTip] Erreur:', error);
    throw error;
  }
};

/**
 * 🔄 NOUVELLE ARCHITECTURE - Récupère les bouts de plusieurs branches via chaîne globale
 */
export const getBatchBranchTips = async (
  mainChainTicketIds: string[],
  restaurantId: string
): Promise<Map<string, TicketData>> => {
  try {
    console.log('🔄 [getBatchBranchTips] Récupération batch via chaîne globale:', mainChainTicketIds.length);

    const results = new Map<string, TicketData>();
    const ticketsRef = getTicketsCollectionRef(restaurantId);

    // Utiliser la nouvelle architecture pour récupérer chaque head
    for (const mainChainId of mainChainTicketIds) {
      try {
        const headBlock = await getTicketHead(restaurantId, mainChainId);
        
        if (headBlock) {
          const ticketRef = doc(ticketsRef, headBlock.ticketId);
          const ticketSnap = await getDoc(ticketRef);
          
          if (ticketSnap.exists()) {
            const ticket = { id: headBlock.ticketId, ...ticketSnap.data() } as TicketData;
            results.set(mainChainId, ticket);
          }
        }
      } catch (error) {
        console.warn('⚠️ [getBatchBranchTips] Erreur pour ticket:', mainChainId, error);
      }
    }

    console.log('🔄 [getBatchBranchTips] ✅', {
      requested: mainChainTicketIds.length,
      found: results.size
    });

    return results;

  } catch (error) {
    console.error('❌ [getBatchBranchTips] Erreur:', error);
    throw error;
  }
};

/**
 * 🔧 Helper - Récupération batch de tickets par IDs
 */
const getBatchTicketsByIds = async (ticketIds: string[], restaurantId: string): Promise<Map<string, TicketData>> => {
  const results = new Map<string, TicketData>();
  const ticketsRef = getTicketsCollectionRef(restaurantId);
  
  // Firebase permet max 10 IDs dans une requête "in"
  const batches = [];
  for (let i = 0; i < ticketIds.length; i += 10) {
    batches.push(ticketIds.slice(i, i + 10));
  }
  
  for (const batch of batches) {
    const batchQuery = query(ticketsRef, where('__name__', 'in', batch));
    const batchSnap = await getDocs(batchQuery);
    
    batchSnap.forEach(docSnap => {
      results.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as TicketData);
    });
  }
  
  return results;
};

/**
 * 🗑️ Nettoyer le cache des bouts de branches
 */
export const clearBranchTipsCache = (): void => {
  branchTipsCache.clear();
  console.log('🗑️ Cache des bouts de branches vidé');
};

/**
 * 📊 Statistiques du cache des bouts de branches
 */
export const getBranchTipsCacheStats = () => {
  const now = Date.now();
  const entries = Array.from(branchTipsCache.entries());
  
  return {
    totalCached: entries.length,
    validEntries: entries.filter(([_, info]) => now - info.lastUpdate < BRANCH_TIPS_CACHE_DURATION).length,
    expiredEntries: entries.filter(([_, info]) => now - info.lastUpdate >= BRANCH_TIPS_CACHE_DURATION).length,
    cacheDuration: BRANCH_TIPS_CACHE_DURATION,
    averageChainDepth: entries.length > 0 ? entries.reduce((sum, [_, info]) => sum + info.chainDepth, 0) / entries.length : 0
  };
};

// ====== FONCTIONS BLOCKCHAIN POUR FORK ======

/**
 * 🔀 Crée un fork via la chaîne globale hybride
 */
export const createTicketFork = async (
  originalTicketId: string,
  restaurantId: string,
  updateData: UpdateTicketData,
  employeeId?: string,
  forkReason: 'modification' | 'correction' | 'annulation' = 'modification'
): Promise<string> => {
  try {
    console.log('🔀 [createTicketFork] Création fork via chaîne globale:', originalTicketId);

    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    startTicketsRealtimeSync(restaurantId);

    // 1. Récupérer le ticket original
    const originalTicketRef = doc(getTicketsCollectionRef(restaurantId), originalTicketId);
    const originalTicketSnap = await getDoc(originalTicketRef);
    
    if (!originalTicketSnap.exists()) {
      throw new Error('Ticket original introuvable');
    }

    const originalTicket = { id: originalTicketId, ...originalTicketSnap.data() } as TicketData;

    // 2. Analyser les changements
    const changes = analyzeTicketChanges(originalTicket, updateData);

    console.log('🔀 [createTicketFork] Changements analysés:', {
      hasChanges: changes.hasChanges,
      platsSupprimees: changes.platsSupprimees.length,
      platsAjoutes: changes.platsAjoutes.length,
      prixChange: changes.prixChange
    });

    // 3. Créer les données du fork (ticket modifié)
    const forkTicketData: Omit<TicketData, 'id'> = {
      ...originalTicket,           // Copier toutes les données originales
      ...updateData,               // Appliquer les modifications
      
      // ====== MÉTADONNÉES DU FORK ======
      blockType: 'fork',
      parentTicketId: originalTicketId,
      forkReason,
      forkTimestamp: serverTimestamp() as any,
      forkDepth: (originalTicket.forkDepth || 0) + 1,
      
      // ====== TRACKING DES MODIFICATIONS ======
      modified: true,
      dateModification: serverTimestamp() as any,
      employeeId: employeeId || originalTicket.employeeId,
      timestamp: serverTimestamp() as any
    };

    // 4. Créer le document fork dans Firebase
    const forkRef = await addDoc(getTicketsCollectionRef(restaurantId), forkTicketData);

    // 5. ⭐ NOUVEAU : Ajouter l'opération à la chaîne globale
    const sequenceId = await addOperationToGlobalChain(
      restaurantId,
      originalTicketId, // ID du ticket principal (pas du fork)
      'update',
      {
        forkTicketId: forkRef.id,
        originalTicketId,
        changes,
        forkReason,
        updateData,
        employeeId
      }
    );

    console.log('🔀 [createTicketFork] Fork et séquence créés:', {
      forkId: forkRef.id,
      parentId: originalTicketId,
      sequenceId,
      operation: 'update'
    });

    // 6. Mettre à jour les caches
    const newForkTicket: TicketData = {
      id: forkRef.id,
      ...forkTicketData
    } as TicketData;
    
    addTicketToCache(newForkTicket);

    console.log('✅ [createTicketFork] Fork créé via chaîne globale');

    return forkRef.id;

  } catch (error) {
    console.error('❌ [createTicketFork] Erreur lors de la création du fork:', error);
    throw error;
  }
};

/**
 * 🔗 Récupère la chaîne complète d'un ticket (principal + forks)
 */
export const getTicketChain = async (
  ticketId: string, 
  restaurantId: string
): Promise<TicketChainData> => {
  try {
    console.log('🔗 [getTicketChain] Récupération de la chaîne pour ticket:', ticketId);

    const ticketsRef = getTicketsCollectionRef(restaurantId);
    
    // Récupérer le ticket principal
    const mainTicketSnap = await getDoc(doc(ticketsRef, ticketId));
    if (!mainTicketSnap.exists()) {
      throw new Error('Ticket principal introuvable');
    }

    const mainTicket = { id: ticketId, ...mainTicketSnap.data() } as TicketData;

    // Rechercher tous les forks de ce ticket
    const forksQuery = query(
      ticketsRef,
      where('parentTicketId', '==', ticketId),
      where('blockType', '==', 'fork'),
      orderBy('forkTimestamp', 'asc')
    );

    const forksSnap = await getDocs(forksQuery);
    const forks: TicketData[] = [];

    forksSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data) {
        forks.push({ id: docSnap.id, ...data } as TicketData);
      }
    });

    const chainDepth = Math.max(0, ...forks.map(fork => fork.forkDepth || 0));

    // Déterminer le ticket actif (celui avec active: true)
    const activeTicket = forks.find(fork => fork.active) || mainTicket;

    console.log('🔗 [getTicketChain] Chaîne récupérée:', {
      mainTicketId: ticketId,
      forksCount: forks.length,
      chainDepth,
      activeTicketId: activeTicket.id
    });

    return {
      mainTicket,
      forks,
      chainDepth,
      activeTicket
    };

  } catch (error) {
    console.error('❌ [getTicketChain] Erreur lors de la récupération de la chaîne:', error);
    throw error;
  }
};

/**
 * 📊 Statistiques de la blockchain des tickets
 */
export const getBlockchainStats = async (restaurantId: string): Promise<BlockchainTicketInfo> => {
  try {
    console.log('📊 [getBlockchainStats] Calcul des statistiques blockchain...');
    
    const ticketsRef = getTicketsCollectionRef(restaurantId);

    // Compter les tickets principaux (chaîne principale)
    const mainChainQuery = query(
      ticketsRef,
      where('blockType', 'in', ['main', undefined]) // undefined pour compatibilité
    );

    const mainChainSnap = await getDocs(mainChainQuery);
    const mainChainLength = mainChainSnap.size;

    // Compter les forks
    const forksQuery = query(
      ticketsRef,
      where('blockType', '==', 'fork')
    );

    const forksSnap = await getDocs(forksQuery);
    const forksCount = forksSnap.size;

    // ✅ NOUVELLE ARCHITECTURE : Compter via la chaîne globale
    const headBlocks = await getAllTicketHeads(restaurantId);
    const totalActiveTickets = headBlocks.length;

    // Récupérer les tickets orphelins
    const orphanedTickets: string[] = [];
    forksSnap.forEach(doc => {
      const fork = doc.data() as TicketData;
      if (fork.isOrphan) {
        orphanedTickets.push(doc.id);
      }
    });

    // Récupérer le dernier hash de la chaîne principale
    const lastMainBlockQuery = query(
      ticketsRef,
      where('blockType', 'in', ['main', undefined]),
      where('hashe', '!=', null),
      orderBy('chainIndex', 'desc'),
      limit(1)
    );

    const lastMainBlockSnap = await getDocs(lastMainBlockQuery);
    let lastMainBlockHash = '';
    
    if (!lastMainBlockSnap.empty) {
      const lastBlock = lastMainBlockSnap.docs[0].data() as TicketData;
      lastMainBlockHash = lastBlock.hashe || '';
    }

    const stats = {
      mainChainLength,
      forksCount,
      orphanedTickets,
      lastMainBlockHash,
      totalActiveTickets
    };

    console.log('📊 [getBlockchainStats] Statistiques calculées:', stats);

    return stats;

  } catch (error) {
    console.error('❌ [getBlockchainStats] Erreur:', error);
    throw error;
  }
};

/**
 * 🎯 Récupère le ticket actuellement actif (peut être un fork)
 */
export const getActiveTicket = async (
  originalTicketId: string,
  restaurantId: string
): Promise<TicketData> => {
  try {
    console.log('🎯 [getActiveTicket] Recherche du ticket actif via chaîne globale:', originalTicketId);

    // ⭐ NOUVEAU : Utiliser la chaîne globale pour récupérer le head
    const currentHead = await getTicketHead(restaurantId, originalTicketId);
    if (!currentHead) {
      throw new Error('Ticket introuvable dans la chaîne globale');
    }

    // Récupérer les données du ticket head
    const ticketRef = doc(getTicketsCollectionRef(restaurantId), currentHead.ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (!ticketSnap.exists()) {
      throw new Error('Données du ticket head introuvables');
    }

    const ticketData = { id: currentHead.ticketId, ...ticketSnap.data() } as TicketData;

    console.log('🎯 [getActiveTicket] Ticket actif trouvé via chaîne globale:', {
      activeId: ticketData.id,
      sequenceId: currentHead.sequenceId,
      operation: currentHead.operation
    });

    return ticketData;

  } catch (error) {
    console.error('❌ [getActiveTicket] Erreur:', error);
    throw error;
  }
};

/**
 * 🔄 FONCTION PRINCIPALE - Remplace updateTicket, crée TOUJOURS un fork
 */
export const updateTicketWithFork = async (
  originalTicketId: string,
  restaurantId: string,
  updateData: UpdateTicketData,
  employeeId?: string,
  forkReason: 'modification' | 'correction' | 'annulation' = 'modification'
): Promise<string> => {
  try {
    console.log('🔄 [updateTicketWithFork] Mise à jour via fork:', {
      originalTicketId,
      forkReason,
      updateFields: Object.keys(updateData),
      employeeId
    });

    // Créer le fork - plus jamais d'updateDoc !
    const forkId = await createTicketFork(
      originalTicketId,
      restaurantId,
      updateData,
      employeeId,
      forkReason
    );

    console.log('✅ [updateTicketWithFork] Fork créé avec succès:', forkId);
    return forkId;

  } catch (error) {
    console.error('❌ [updateTicketWithFork] Erreur lors de la mise à jour:', error);
    throw error;
  }
};

/**
 * 🔨 Génère un hash simple pour un ticket (version basique)
 */
const generateTicketHash = (ticketData: Omit<TicketData, 'id'>, parentId: string): string => {
  const hashData = {
    plats: ticketData.plats?.map(p => ({ id: p.plat.id, qty: p.quantite })) || [],
    totalPrice: ticketData.totalPrice,
    status: ticketData.status,
    parentId,
    timestamp: Date.now()
  };
  
  // Hash simple basé sur JSON.stringify + Math.random pour l'exemple
  // En production, utilisez une vraie fonction de hash comme SHA-256
  const hashString = JSON.stringify(hashData) + Math.random().toString(36);
  return btoa(hashString).substring(0, 32);
};

/**
 * 🎯 Crée un nouveau ticket via la chaîne globale hybride
 */
export const createMainChainTicket = async (
  ticketData: Omit<TicketData, 'id'>, 
  restaurantId: string
): Promise<string> => {
  try {
    console.log('🎯 [createMainChainTicket] Création nouveau ticket via chaîne globale');
    
    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    startTicketsRealtimeSync(restaurantId);

    if (!ticketData.plats || !ticketData.tableId) {
      throw new Error("Données de ticket incomplètes");
    }

    // ====== DONNÉES DU NOUVEAU TICKET ======
    const mainChainTicketData = {
      ...ticketData,
      status: 'en_attente' as const,
      dateCreation: serverTimestamp(),
      timestamp: serverTimestamp(),
      
      // ====== MÉTADONNÉES BLOCKCHAIN ======
      blockType: 'main' as const, // 🔗 Bloc principal dans la chaîne
      forkDepth: 0,
      modified: false
    };

    // Filtrer les valeurs undefined
    const filteredTicketData = Object.fromEntries(
      Object.entries(mainChainTicketData).filter(([_, value]) => value !== undefined)
    );

    // ✅ CRÉER dans la collection restaurant/tickets
    const docRef = await addDoc(getTicketsCollectionRef(restaurantId), filteredTicketData);
    
    // ⭐ NOUVEAU : Ajouter l'opération à la chaîne globale
    const sequenceId = await addOperationToGlobalChain(
      restaurantId,
      docRef.id, // ID du ticket principal
      'create',
      {
        ticketId: docRef.id,
        tableId: ticketData.tableId,
        plats: ticketData.plats,
        totalPrice: ticketData.totalPrice,
        employeeId: ticketData.employeeId
      }
    );

    // Créer l'objet ticket complet pour le cache
    const newTicket: TicketData = {
      id: docRef.id,
      ...filteredTicketData
    } as TicketData;
    
    // Ajouter au cache
    addTicketToCache(newTicket);
    
    console.log('✅ [createMainChainTicket] Ticket et séquence créés:', {
      ticketId: docRef.id,
      sequenceId,
      operation: 'create',
      tableId: ticketData.tableId
    });
    
    return docRef.id;
  } catch (error) {
    console.error("❌ [createMainChainTicket] Erreur lors de la création:", error);
    throw error;
  }
};

/**
 * ✅ Valide un ticket via la chaîne globale hybride
 */
export const validateTicket = async (
  ticketId: string,
  restaurantId: string,
  employeeId: string,
  paymentMethod: 'especes' | 'carte' | 'cheque' | 'virement' = 'especes'
): Promise<void> => {
  try {
    console.log('✅ [validateTicket] Validation ticket via chaîne globale:', ticketId);

    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    startTicketsRealtimeSync(restaurantId);

    // 1. Récupérer le ticket à valider via la chaîne globale
    const currentHead = await getTicketHead(restaurantId, ticketId);
    if (!currentHead) {
      throw new Error('Ticket introuvable dans la chaîne');
    }

    // 2. Récupérer les données complètes du ticket
    const ticketRef = doc(getTicketsCollectionRef(restaurantId), currentHead.ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (!ticketSnap.exists()) {
      throw new Error('Données du ticket introuvables');
    }

    const ticketData = { id: currentHead.ticketId, ...ticketSnap.data() } as TicketData;

    // 3. Vérifier que le ticket peut être validé
    if (ticketData.status === 'encaissee') {
      console.log('⚠️ [validateTicket] Ticket déjà validé');
      return;
    }

    // 4. Créer les données de validation
    const validationData: Partial<TicketData> = {
      status: 'encaissee',
      dateTerminee: serverTimestamp() as any,
      notes: `Validé par ${employeeId} - Paiement: ${paymentMethod}`,
      timestamp: serverTimestamp() as any
    };

    // 5. Créer un nouveau bloc pour la validation
    const validatedTicketData: Omit<TicketData, 'id'> = {
      ...ticketData,
      ...validationData,
      blockType: 'fork',
      parentTicketId: ticketData.parentTicketId || ticketId,
      modified: true,
      dateModification: serverTimestamp() as any,
      employeeId
    };

    // 6. Créer le nouveau document de validation
    const validationRef = await addDoc(getTicketsCollectionRef(restaurantId), validatedTicketData);

    // 7. ⭐ NOUVEAU : Ajouter l'opération à la chaîne globale
    const sequenceId = await addOperationToGlobalChain(
      restaurantId,
      ticketId, // ID du ticket principal
      'terminate',
      {
        validationTicketId: validationRef.id,
        originalTicketId: ticketId,
        paymentMethod,
        validatedBy: employeeId,
        validationData
      }
    );

    console.log('✅ [validateTicket] Validation et séquence créées:', {
      validationId: validationRef.id,
      ticketId,
      sequenceId,
      operation: 'terminate'
    });

    // 8. Mettre à jour le cache
    const validatedTicket: TicketData = {
      id: validationRef.id,
      ...validatedTicketData
    } as TicketData;
    
    addTicketToCache(validatedTicket);

    console.log('✅ [validateTicket] Ticket validé via chaîne globale');

  } catch (error) {
    console.error('❌ [validateTicket] Erreur lors de la validation:', error);
    throw error;
  }
};

// ====== EXPORTS ======
export default {
  // 🔗 Fonctions blockchain principales
  createTicketFork,
  getTicketChain,
  getBlockchainStats,
  getActiveTicket,
  updateTicketWithFork,
  createMainChainTicket,
  validateTicket,
  
  // 🚀 Optimisations pour accès rapide aux bouts de branches
  getAllActiveBranchTips,
  getBranchTip,
  getBatchBranchTips,
  clearBranchTipsCache,
  getBranchTipsCacheStats
};
