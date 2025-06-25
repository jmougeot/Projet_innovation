import { 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { TicketData, UpdateTicketData, TicketChainData, BlockchainTicketInfo } from './types';
import { getTicketsCollectionRef } from './config';
import { analyzeTicketChanges } from './modifications';
import { updateTicketInCache, addTicketToCache } from './cache';
import { startTicketsRealtimeSync } from './realtime';

// ====== OPTIMISATIONS POUR ACCÈS RAPIDE AUX BOUTS DE BRANCHES ======

// Cache spécialisé pour les bouts de branches (tickets actifs de chaque chaîne)
let branchTipsCache: Map<string, { ticketId: string, lastUpdate: number, chainDepth: number }> = new Map();
const BRANCH_TIPS_CACHE_DURATION = 30000; // 30 secondes

/**
 * 🚀 OPTIMISATION - Récupère tous les bouts de branches actifs (1 seule requête)
 * Cette fonction remplace plusieurs requêtes individuelles par une seule requête optimisée
 */
export const getAllActiveBranchTips = async (restaurantId: string): Promise<TicketData[]> => {
  try {
    console.log('🚀 [getAllActiveBranchTips] Récupération optimisée des bouts de branches actifs');

    const ticketsRef = getTicketsCollectionRef(restaurantId);
    
    // 🔥 UNE SEULE REQUÊTE pour tous les tickets actifs (bouts de branches)
    const activeTipsQuery = query(
      ticketsRef,
      where('active', '==', true),
      orderBy('forkDepth', 'desc'), // Les forks en premier (bout de branche)
      orderBy('timestamp', 'desc')   // Plus récents en premier
    );

    const activeTipsSnap = await getDocs(activeTipsQuery);
    const branchTips: TicketData[] = [];

    activeTipsSnap.forEach(docSnap => {
      const ticketData = { id: docSnap.id, ...docSnap.data() } as TicketData;
      branchTips.push(ticketData);
    });

    // 💾 Mettre à jour le cache des bouts de branches
    const now = Date.now();
    branchTips.forEach(ticket => {
      const mainChainId = ticket.parentTicketId || ticket.id;
      branchTipsCache.set(mainChainId, {
        ticketId: ticket.id,
        lastUpdate: now,
        chainDepth: ticket.forkDepth || 0
      });
    });

    console.log('🚀 [getAllActiveBranchTips] ✅', {
      branchTipsFound: branchTips.length,
      cacheUpdated: branchTipsCache.size,
      queryCount: 1 // Une seule requête !
    });

    return branchTips;

  } catch (error) {
    console.error('❌ [getAllActiveBranchTips] Erreur:', error);
    throw error;
  }
};

/**
 * ⚡ ULTRA-RAPIDE - Récupère le bout d'une branche spécifique (avec cache intelligent)
 */
export const getBranchTip = async (
  mainChainTicketId: string,
  restaurantId: string,
  useCache = true
): Promise<TicketData> => {
  try {
    const now = Date.now();
    
    // 💾 Vérifier le cache en premier
    if (useCache && branchTipsCache.has(mainChainTicketId)) {
      const cached = branchTipsCache.get(mainChainTicketId)!;
      
      if (now - cached.lastUpdate < BRANCH_TIPS_CACHE_DURATION) {
        console.log('⚡ [getBranchTip] CACHE HIT:', mainChainTicketId, '-> ticket', cached.ticketId);
        
        // Récupérer depuis le cache local ou Firebase (1 seule lecture)
        const ticketRef = doc(getTicketsCollectionRef(restaurantId), cached.ticketId);
        const ticketSnap = await getDoc(ticketRef);
        
        if (ticketSnap.exists()) {
          return { id: cached.ticketId, ...ticketSnap.data() } as TicketData;
        }
      }
    }

    console.log('⚡ [getBranchTip] CACHE MISS - Recherche optimisée:', mainChainTicketId);
    
    const ticketsRef = getTicketsCollectionRef(restaurantId);
    
    // 🔍 Requête optimisée : chercher le fork actif le plus profond OU le ticket principal
    const branchTipQuery = query(
      ticketsRef,
      where('active', '==', true),
      where('parentTicketId', 'in', [mainChainTicketId, null]), // Parent OU ticket principal
      orderBy('forkDepth', 'desc'), // Le plus profond en premier
      limit(1) // Seulement le bout de la branche
    );

    let branchTipSnap = await getDocs(branchTipQuery);
    
    // Si aucun fork actif trouvé, récupérer le ticket principal
    if (branchTipSnap.empty) {
      const mainTicketRef = doc(ticketsRef, mainChainTicketId);
      const mainTicketSnap = await getDoc(mainTicketRef);
      
      if (mainTicketSnap.exists()) {
        const mainTicket = { id: mainChainTicketId, ...mainTicketSnap.data() } as TicketData;
        
        // Mettre à jour le cache
        branchTipsCache.set(mainChainTicketId, {
          ticketId: mainChainTicketId,
          lastUpdate: now,
          chainDepth: 0
        });
        
        return mainTicket;
      }
      
      throw new Error(`Ticket ${mainChainTicketId} introuvable`);
    }

    const branchTipDoc = branchTipSnap.docs[0];
    const branchTip = { id: branchTipDoc.id, ...branchTipDoc.data() } as TicketData;

    // 💾 Mettre à jour le cache
    branchTipsCache.set(mainChainTicketId, {
      ticketId: branchTip.id,
      lastUpdate: now,
      chainDepth: branchTip.forkDepth || 0
    });

    console.log('⚡ [getBranchTip] ✅ Bout de branche trouvé:', {
      mainChainId: mainChainTicketId,
      branchTipId: branchTip.id,
      chainDepth: branchTip.forkDepth || 0,
      isFork: branchTip.blockType === 'fork'
    });

    return branchTip;

  } catch (error) {
    console.error('❌ [getBranchTip] Erreur:', error);
    throw error;
  }
};

/**
 * 🔄 BATCH - Récupère les bouts de plusieurs branches en une fois (ultra-optimisé)
 */
export const getBatchBranchTips = async (
  mainChainTicketIds: string[],
  restaurantId: string
): Promise<Map<string, TicketData>> => {
  try {
    console.log('🔄 [getBatchBranchTips] Récupération batch de', mainChainTicketIds.length, 'bouts de branches');

    const uncachedIds: string[] = [];
    const now = Date.now();

    // 1️⃣ Vérifier le cache pour tous les IDs
    mainChainTicketIds.forEach(id => {
      if (branchTipsCache.has(id)) {
        const cached = branchTipsCache.get(id)!;
        if (now - cached.lastUpdate < BRANCH_TIPS_CACHE_DURATION) {
          // On récupérera ces tickets en batch
          return;
        }
      }
      uncachedIds.push(id);
    });

    // 2️⃣ Si tous sont en cache, récupération batch des tickets
    if (uncachedIds.length === 0) {
      console.log('🔄 [getBatchBranchTips] Tous en cache - récupération batch');
      
      const cachedTicketIds = mainChainTicketIds.map(id => branchTipsCache.get(id)!.ticketId);
      const batchResults = await getBatchTicketsByIds(cachedTicketIds, restaurantId);
      
      mainChainTicketIds.forEach(mainId => {
        const cachedInfo = branchTipsCache.get(mainId)!;
        const ticket = batchResults.get(cachedInfo.ticketId);
        if (ticket) {
          results.set(mainId, ticket);
        }
      });

      return results;
    }

    // 3️⃣ Requête optimisée pour les non-cachés + mise à jour cache
    const ticketsRef = getTicketsCollectionRef(restaurantId);
    
    // Récupérer tous les tickets actifs qui pourraient être des bouts de branches
    const allActiveTipsQuery = query(
      ticketsRef,
      where('active', '==', true),
      where('parentTicketId', 'in', [...uncachedIds, null])
    );

    const allActiveTipsSnap = await getDocs(allActiveTipsQuery);
    
    // Traiter les résultats et identifier les bouts de branches
    const ticketsByMainChain = new Map<string, TicketData[]>();
    
    allActiveTipsSnap.forEach(docSnap => {
      const ticket = { id: docSnap.id, ...docSnap.data() } as TicketData;
      const mainChainId = ticket.parentTicketId || ticket.id;
      
      if (!ticketsByMainChain.has(mainChainId)) {
        ticketsByMainChain.set(mainChainId, []);
      }
      ticketsByMainChain.get(mainChainId)!.push(ticket);
    });

    // Identifier le bout de chaque branche (ticket avec forkDepth le plus élevé)
    uncachedIds.forEach(mainChainId => {
      const chainTickets = ticketsByMainChain.get(mainChainId) || [];
      
      if (chainTickets.length > 0) {
        const branchTip = chainTickets.reduce((tip, ticket) => 
          (ticket.forkDepth || 0) > (tip.forkDepth || 0) ? ticket : tip
        );
        
        results.set(mainChainId, branchTip);
        
        // Mettre à jour le cache
        branchTipsCache.set(mainChainId, {
          ticketId: branchTip.id,
          lastUpdate: now,
          chainDepth: branchTip.forkDepth || 0
        });
      }
    });

    console.log('🔄 [getBatchBranchTips] ✅', {
      requested: mainChainTicketIds.length,
      cacheHits: mainChainTicketIds.length - uncachedIds.length,
      cacheMisses: uncachedIds.length,
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
 * 🔀 Crée un fork (ticket orphelin) lors d'une modification
 */
export const createTicketFork = async (
  originalTicketId: string,
  restaurantId: string,
  updateData: UpdateTicketData,
  employeeId?: string,
  forkReason: 'modification' | 'correction' | 'annulation' = 'modification'
): Promise<string> => {
  try {
    console.log('🔀 [createTicketFork] Création d\'un fork pour ticket:', originalTicketId);

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

    // 3. Créer les données du fork
    const forkTicketData: Omit<TicketData, 'id'> = {
      ...originalTicket,           // Copier toutes les données originales
      ...updateData,               // Appliquer les modifications
      
      // ====== MÉTADONNÉES DU FORK ======
      blockType: 'fork',
      parentTicketId: originalTicketId,
      mainChainHash: originalTicket.hashe || '', // Hash du bloc principal référencé
      forkReason,
      forkTimestamp: serverTimestamp() as any,
      isOrphan: true,
      forkDepth: (originalTicket.forkDepth || 0) + 1,
      originalTicketData: {
        plats: originalTicket.plats,
        totalPrice: originalTicket.totalPrice,
        status: originalTicket.status,
        notes: originalTicket.notes
      },
      
      // ====== TRACKING DES MODIFICATIONS ======
      modified: true,
      dateModification: serverTimestamp() as any,
      platsdeleted: changes.platsSupprimees.length > 0 ? [
        ...(originalTicket.platsdeleted || []),
        ...changes.platsSupprimees.map(plat => ({
          ...plat,
          dateSupression: serverTimestamp(),
          supprimePar: employeeId
        } as any))
      ] : originalTicket.platsdeleted,
      
      // ====== NOUVEL ID ET HACHAGE ======
      active: true, // Le fork devient le ticket actif
      employeeId: employeeId || originalTicket.employeeId,
      timestamp: serverTimestamp() as any
    };

    // 4. Calculer le hash du fork (basique pour l'instant)
    const forkHash = generateTicketHash(forkTicketData, originalTicketId);
    forkTicketData.hashe = forkHash;

    // 5. Créer le document fork dans Firebase
    const forkRef = await addDoc(getTicketsCollectionRef(restaurantId), forkTicketData);

    console.log('🔀 [createTicketFork] Fork créé avec succès:', {
      forkId: forkRef.id,
      parentId: originalTicketId,
      forkHash: forkHash.substring(0, 8) + '...',
      forkDepth: forkTicketData.forkDepth
    });

    // 6. Mettre à jour le cache pour marquer l'original comme inactif (pas d'updateDoc!)
    const originalTicketInCache = {
      ...originalTicket,
      active: false,
      replacedByFork: forkRef.id,
      forkTimestamp: new Date()
    };
    
    updateTicketInCache(originalTicketInCache);

    // 7. Ajouter le fork au cache
    const newForkTicket: TicketData = {
      id: forkRef.id,
      ...forkTicketData
    } as TicketData;
    
    addTicketToCache(newForkTicket);

    // 8. Mettre à jour le ticket original dans le cache
    updateTicketInCache({
      ...originalTicket,
      active: false,
      replacedByFork: forkRef.id
    });

    console.log('✅ [createTicketFork] Ticket original marqué comme remplacé par fork');

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

    // Compter les tickets actifs
    const activeTicketsQuery = query(
      ticketsRef,
      where('active', '==', true)
    );

    const activeTicketsSnap = await getDocs(activeTicketsQuery);
    const totalActiveTickets = activeTicketsSnap.size;

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
    console.log('🎯 [getActiveTicket] Recherche du ticket actif pour:', originalTicketId);

    const chain = await getTicketChain(originalTicketId, restaurantId);
    
    console.log('🎯 [getActiveTicket] Ticket actif trouvé:', {
      activeId: chain.activeTicket.id,
      isMainTicket: chain.activeTicket.id === originalTicketId,
      isFork: chain.activeTicket.blockType === 'fork'
    });

    return chain.activeTicket;

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
 * 🎯 Crée un nouveau ticket (bloc principal de la chaîne)
 */
export const createMainChainTicket = async (
  ticketData: Omit<TicketData, 'id'>, 
  restaurantId: string
): Promise<string> => {
  try {
    console.log('🎯 [createMainChainTicket] Création nouveau bloc chaîne principale');
    
    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    startTicketsRealtimeSync(restaurantId);

    if (!ticketData.plats || !ticketData.tableId) {
      throw new Error("Données de ticket incomplètes");
    }

    // ====== DONNÉES DU NOUVEAU BLOC PRINCIPAL ======
    const mainChainTicketData = {
      ...ticketData,
      active: true,
      status: 'en_attente' as const,
      dateCreation: serverTimestamp(),
      timestamp: serverTimestamp(),
      
      // ====== MÉTADONNÉES BLOCKCHAIN ======
      blockType: 'main' as const, // 🔗 Bloc principal dans la chaîne
      isOrphan: false,
      forkDepth: 0
    };

    // Filtrer les valeurs undefined
    const filteredTicketData = Object.fromEntries(
      Object.entries(mainChainTicketData).filter(([_, value]) => value !== undefined)
    );

    // ✅ CRÉER dans la collection restaurant/tickets
    const docRef = await addDoc(getTicketsCollectionRef(restaurantId), filteredTicketData);
    
    // Créer l'objet ticket complet pour le cache
    const newTicket: TicketData = {
      id: docRef.id,
      ...filteredTicketData
    } as TicketData;
    
    // Ajouter au cache
    addTicketToCache(newTicket);
    
    console.log('✅ [createMainChainTicket] Nouveau bloc principal créé:', {
      ticketId: docRef.id,
      blockType: 'main',
      tableId: ticketData.tableId
    });
    
    return docRef.id;
  } catch (error) {
    console.error("❌ [createMainChainTicket] Erreur lors de la création:", error);
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
  
  // 🚀 Optimisations pour accès rapide aux bouts de branches
  getAllActiveBranchTips,
  getBranchTip,
  getBatchBranchTips,
  clearBranchTipsCache,
  getBranchTipsCacheStats
};
