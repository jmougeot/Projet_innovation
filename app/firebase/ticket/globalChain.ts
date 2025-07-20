import { 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  setDoc,
  serverTimestamp,
  collection
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getTicketsCollectionRef } from './config';
import CryptoJS from 'crypto-js';

// ====== ARCHITECTURE HYBRIDE - CHAÎNE GLOBALE + INDEX ======

export interface GlobalChainBlock {
  sequenceId: string;           // "Séq.001", "Séq.002", etc.
  ticketId: string;            // T123, T456, etc.
  operation: 'create' | 'update' | 'cancel' | 'terminate';
  timestamp: any;              // serverTimestamp
  previousHash: string;        // Hash du bloc précédent
  hash: string;               // Hash de ce bloc
  data: any;                  // Données de l'opération
  restaurantId: string;       // Pour isolation par restaurant
}

export interface TicketMapEntry {
  ticketId: string;
  sequences: string[];        // Liste des séquences [S1, S3, S5]
  lastSequence: string;       // Dernière séquence (head)
  lastUpdate: any;           // Timestamp de la dernière mise à jour
}

/**
 * 🔗 Ajoute une opération à la chaîne globale et met à jour l'index
 */
export const addOperationToGlobalChain = async (
  restaurantId: string,
  ticketId: string,
  operation: 'create' | 'update' | 'cancel' | 'terminate',
  data: any
): Promise<string> => {
  try {
    console.log('🔗 [GlobalChain] Ajout opération:', { ticketId, operation });

    // 1. Obtenir le dernier bloc de la chaîne pour le restaurant
    const lastBlock = await getLastGlobalBlock(restaurantId);
    const previousHash = lastBlock?.hash || "GENESIS";
    
    // 2. Générer l'ID de séquence
    const sequenceNumber = await getNextSequenceNumber(restaurantId);
    const sequenceId = `Séq.${sequenceNumber.toString().padStart(3, '0')}`;

    // 3. Créer le nouveau bloc
    const newBlock: GlobalChainBlock = {
      sequenceId,
      ticketId,
      operation,
      timestamp: serverTimestamp(),
      previousHash,
      hash: '', // Sera calculé
      data,
      restaurantId
    };

    // 4. Calculer le hash du bloc
    newBlock.hash = calculateBlockHash(newBlock);

    // 5. Ajouter le bloc à la chaîne globale
    const chainRef = collection(db, 'restaurants', restaurantId, 'global_chain');
    const blockRef = await addDoc(chainRef, newBlock);

    console.log('🔗 [GlobalChain] Bloc créé:', {
      sequenceId,
      blockId: blockRef.id,
      hash: newBlock.hash.substring(0, 8) + '...'
    });

    // 6. Mettre à jour l'index des tickets
    await updateTicketMap(restaurantId, ticketId, sequenceId);

    // 7. Mettre à jour le head du ticket pour accès rapide
    await updateTicketHead(restaurantId, ticketId, sequenceId);

    return sequenceId;

  } catch (error) {
    console.error('❌ [GlobalChain] Erreur ajout opération:', error);
    throw error;
  }
};

/**
 * 🔍 Récupère le dernier bloc de la chaîne globale
 */
export const getLastGlobalBlock = async (restaurantId: string): Promise<GlobalChainBlock | null> => {
  try {
    const chainRef = collection(db, 'restaurants', restaurantId, 'global_chain');
    const lastBlockQuery = query(
      chainRef,
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const querySnap = await getDocs(lastBlockQuery);
    
    if (querySnap.empty) {
      return null;
    }

    const doc = querySnap.docs[0];
    return { ...doc.data() } as GlobalChainBlock;

  } catch (error) {
    console.error('❌ [GlobalChain] Erreur récupération dernier bloc:', error);
    return null;
  }
};

/**
 * 🔢 Obtient le prochain numéro de séquence
 */
export const getNextSequenceNumber = async (restaurantId: string): Promise<number> => {
  try {
    const counterRef = doc(db, 'restaurants', restaurantId, 'counters', 'global_sequence');
    const counterSnap = await getDoc(counterRef);
    
    let nextNumber = 1;
    if (counterSnap.exists()) {
      nextNumber = (counterSnap.data().current || 0) + 1;
    }

    // Mettre à jour le compteur
    await setDoc(counterRef, { current: nextNumber }, { merge: true });
    
    return nextNumber;

  } catch (error) {
    console.error('❌ [GlobalChain] Erreur compteur séquence:', error);
    throw error;
  }
};

/**
 * 🗂️ Met à jour l'index des tickets (Map des Tickets)
 */
export const updateTicketMap = async (
  restaurantId: string,
  ticketId: string,
  sequenceId: string
): Promise<void> => {
  try {
    const mapRef = doc(db, 'restaurants', restaurantId, 'ticket_map', ticketId);
    const mapSnap = await getDoc(mapRef);
    
    let sequences: string[] = [];
    if (mapSnap.exists()) {
      sequences = mapSnap.data().sequences || [];
    }

    // Ajouter la nouvelle séquence
    sequences.push(sequenceId);

    const mapEntry: TicketMapEntry = {
      ticketId,
      sequences,
      lastSequence: sequenceId,
      lastUpdate: serverTimestamp()
    };

    await setDoc(mapRef, mapEntry);
    
    console.log('🗂️ [TicketMap] Index mis à jour:', {
      ticketId,
      sequenceCount: sequences.length,
      lastSequence: sequenceId
    });

  } catch (error) {
    console.error('❌ [TicketMap] Erreur mise à jour index:', error);
    throw error;
  }
};

/**
 * ⚡ Met à jour le head du ticket pour accès rapide
 */
export const updateTicketHead = async (
  restaurantId: string,
  ticketId: string,
  sequenceId: string
): Promise<void> => {
  try {
    const headRef = doc(db, 'restaurants', restaurantId, 'ticket_heads', ticketId);
    
    await setDoc(headRef, {
      ticketId,
      headSequenceId: sequenceId,
      lastUpdate: serverTimestamp()
    });

    console.log('⚡ [TicketHead] Head mis à jour:', { ticketId, sequenceId });

  } catch (error) {
    console.error('❌ [TicketHead] Erreur mise à jour head:', error);
    throw error;
  }
};

/**
 * 🔐 Calcule le hash d'un bloc
 */
export const calculateBlockHash = (block: Omit<GlobalChainBlock, 'hash'>): string => {
  const hashData = {
    sequenceId: block.sequenceId,
    ticketId: block.ticketId,
    operation: block.operation,
    previousHash: block.previousHash,
    data: block.data,
    timestamp: typeof block.timestamp === 'object' ? Date.now() : block.timestamp
  };

  const hashString = JSON.stringify(hashData);
  return CryptoJS.SHA256(hashString).toString();
};

/**
 * 📊 Récupère l'historique complet d'un ticket
 */
export const getTicketHistory = async (
  restaurantId: string,
  ticketId: string
): Promise<GlobalChainBlock[]> => {
  try {
    console.log('📊 [TicketHistory] Récupération historique:', ticketId);

    // 1. Récupérer les séquences du ticket depuis l'index
    const mapRef = doc(db, 'restaurants', restaurantId, 'ticket_map', ticketId);
    const mapSnap = await getDoc(mapRef);
    
    if (!mapSnap.exists()) {
      return [];
    }

    const sequences = mapSnap.data().sequences || [];
    
    // 2. Récupérer les blocs correspondants dans la chaîne globale
    const chainRef = collection(db, 'restaurants', restaurantId, 'global_chain');
    const history: GlobalChainBlock[] = [];

    // Récupérer en batch (max 10 par requête Firebase)
    for (let i = 0; i < sequences.length; i += 10) {
      const batch = sequences.slice(i, i + 10);
      const batchQuery = query(
        chainRef,
        where('sequenceId', 'in', batch),
        orderBy('timestamp', 'asc')
      );

      const batchSnap = await getDocs(batchQuery);
      batchSnap.forEach(doc => {
        history.push(doc.data() as GlobalChainBlock);
      });
    }

    console.log('📊 [TicketHistory] Historique récupéré:', {
      ticketId,
      blocksCount: history.length
    });

    return history;

  } catch (error) {
    console.error('❌ [TicketHistory] Erreur récupération historique:', error);
    throw error;
  }
};

/**
 * ⚡ Récupère le head d'un ticket (dernière opération)
 */
export const getTicketHead = async (
  restaurantId: string,
  ticketId: string
): Promise<GlobalChainBlock | null> => {
  try {
    // 1. Récupérer le head depuis l'index rapide
    const headRef = doc(db, 'restaurants', restaurantId, 'ticket_heads', ticketId);
    const headSnap = await getDoc(headRef);
    
    if (!headSnap.exists()) {
      return null;
    }

    const headSequenceId = headSnap.data().headSequenceId;
    
    // 2. Récupérer le bloc correspondant dans la chaîne globale
    const chainRef = collection(db, 'restaurants', restaurantId, 'global_chain');
    const blockQuery = query(
      chainRef,
      where('sequenceId', '==', headSequenceId),
      limit(1)
    );

    const blockSnap = await getDocs(blockQuery);
    
    if (blockSnap.empty) {
      return null;
    }

    return blockSnap.docs[0].data() as GlobalChainBlock;

  } catch (error) {
    console.error('❌ [TicketHead] Erreur récupération head:', error);
    return null;
  }
};

/**
 * 🔍 Récupère tous les heads de tickets (bouts de branches)
 */
export const getAllTicketHeads = async (restaurantId: string): Promise<GlobalChainBlock[]> => {
  try {
    console.log('🔍 [AllHeads] Récupération de tous les heads...');

    // 1. Récupérer tous les heads depuis l'index
    const headsRef = collection(db, 'restaurants', restaurantId, 'ticket_heads');
    const headsSnap = await getDocs(headsRef);
    
    if (headsSnap.empty) {
      return [];
    }

    // 2. Extraire les IDs de séquences
    const sequenceIds = headsSnap.docs.map(doc => doc.data().headSequenceId);
    
    // 3. Récupérer les blocs correspondants
    const chainRef = collection(db, 'restaurants', restaurantId, 'global_chain');
    const heads: GlobalChainBlock[] = [];

    // Batch par groupes de 10
    for (let i = 0; i < sequenceIds.length; i += 10) {
      const batch = sequenceIds.slice(i, i + 10);
      const batchQuery = query(
        chainRef,
        where('sequenceId', 'in', batch)
      );

      const batchSnap = await getDocs(batchQuery);
      batchSnap.forEach(doc => {
        heads.push(doc.data() as GlobalChainBlock);
      });
    }

    console.log('🔍 [AllHeads] Heads récupérés:', heads.length);
    return heads;

  } catch (error) {
    console.error('❌ [AllHeads] Erreur récupération heads:', error);
    throw error;
  }
};

/**
 * 🔐 Vérifie l'intégrité de la chaîne globale
 */
export const verifyGlobalChain = async (restaurantId: string): Promise<boolean> => {
  try {
    console.log('🔐 [ChainVerify] Vérification intégrité chaîne globale...');

    const chainRef = collection(db, 'restaurants', restaurantId, 'global_chain');
    const chainQuery = query(chainRef, orderBy('timestamp', 'asc'));
    const chainSnap = await getDocs(chainQuery);

    if (chainSnap.empty) {
      return true; // Chaîne vide = valide
    }

    let previousHash = "GENESIS";
    let isValid = true;

    chainSnap.forEach(doc => {
      const block = doc.data() as GlobalChainBlock;
      
      // Vérifier la liaison avec le bloc précédent
      if (block.previousHash !== previousHash) {
        console.error('🔐 [ChainVerify] Erreur liaison:', {
          sequenceId: block.sequenceId,
          expected: previousHash,
          found: block.previousHash
        });
        isValid = false;
        return;
      }

      // Vérifier le hash du bloc
      const calculatedHash = calculateBlockHash({
        sequenceId: block.sequenceId,
        ticketId: block.ticketId,
        operation: block.operation,
        timestamp: block.timestamp,
        previousHash: block.previousHash,
        data: block.data,
        restaurantId: block.restaurantId
      });

      if (block.hash !== calculatedHash) {
        console.error('🔐 [ChainVerify] Erreur hash:', {
          sequenceId: block.sequenceId,
          expected: calculatedHash,
          found: block.hash
        });
        isValid = false;
        return;
      }

      previousHash = block.hash;
    });

    console.log('🔐 [ChainVerify] Résultat:', isValid ? 'VALIDE' : 'INVALIDE');
    return isValid;

  } catch (error) {
    console.error('❌ [ChainVerify] Erreur vérification:', error);
    return false;
  }
};

/**
 * 🔍 Vérifie l'intégrité d'un ticket spécifique
 */
export const verifyTicket = async (
  restaurantId: string,
  ticketId: string
): Promise<boolean> => {
  try {
    console.log('🔍 [TicketVerify] Vérification ticket:', ticketId);

    const history = await getTicketHistory(restaurantId, ticketId);
    
    if (history.length === 0) {
      return true; // Pas d'historique = valide
    }

    // Vérifier que tous les blocs existent et ont des hash valides
    for (const block of history) {
      const calculatedHash = calculateBlockHash({
        sequenceId: block.sequenceId,
        ticketId: block.ticketId,
        operation: block.operation,
        timestamp: block.timestamp,
        previousHash: block.previousHash,
        data: block.data,
        restaurantId: block.restaurantId
      });

      if (block.hash !== calculatedHash) {
        console.error('🔍 [TicketVerify] Hash invalide:', {
          sequenceId: block.sequenceId,
          expected: calculatedHash,
          found: block.hash
        });
        return false;
      }
    }

    console.log('🔍 [TicketVerify] Ticket valide:', ticketId);
    return true;

  } catch (error) {
    console.error('❌ [TicketVerify] Erreur vérification ticket:', error);
    return false;
  }
};

// ====== EXPORTS ======
export default {
  addOperationToGlobalChain,
  getTicketHistory,
  getTicketHead,
  getAllTicketHeads,
  verifyGlobalChain,
  verifyTicket,
  getLastGlobalBlock,
  calculateBlockHash
};
