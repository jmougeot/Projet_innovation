import {
  addDoc,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { TicketData, PlatQuantite, UpdateTicketData } from './types';
import { getTicketsCollectionRef } from './config';
import { calculateTicketHash, getLastTerminatedTicketHash } from './hash';
import {
  addTicketToCache,
  updateTicketInCache,
  removeTicketFromCache,
} from './cache';
import { startTicketsRealtimeSync, getTicketListenersStatus } from './realtime';
import { 
  prepareTicketUpdateWithTracking, 
  generateModificationSummary 
} from './modifications';

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

// ====== FONCTIONS PRINCIPALES CRUD ======

/**
 * 🎯 CRÉATION DE TICKET - Une seule collection tickets avec active=true
 */
export const createTicket = async (ticketData: Omit<TicketData, 'id'>, restaurantId: string): Promise<string> => {
  try {
    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    await ensureTicketsRealtimeSyncStarted(restaurantId);

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
    
    // Créer l'objet ticket complet pour le cache
    const newTicket: TicketData = {
      id: docRef.id,
      ...filteredTicketData
    } as TicketData;
    
    // Ajouter au cache au lieu de le vider
    addTicketToCache(newTicket);
    
    console.log("✅ Ticket créé dans collection restaurant/tickets, ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Erreur lors de la création du ticket:", error);
    throw error;
  }
};

/**
 * 🏁 TERMINER TICKET - Marquer comme inactif avec active=false et calculer son hash
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
    
    const ticketData = { ...ticketDoc.data(), id: ticketId } as TicketData;
    const dateCreation = ticketData.dateCreation instanceof Date 
      ? ticketData.dateCreation.getTime() 
      : ticketData.dateCreation?.toMillis ? ticketData.dateCreation.toMillis() 
      : Date.now();
    
    // Récupérer les informations de la chaîne de hachage
    const lastTicketHash = await getLastTerminatedTicketHash(restaurantId);
    const chainIndex = lastTicketHash ? lastTicketHash.index + 1 : 1;
    const previousHash = lastTicketHash ? lastTicketHash.hash : '';
    
    // Préparer les données de mise à jour avec informations de chaîne
    const updateDataForHash: Partial<TicketData> = {
      active: false,
      status: 'encaissee',
      dateTerminee: new Date(), // Date temporaire pour le calcul du hash
      dureeTotal: Date.now() - dateCreation,
      chainIndex: chainIndex,
      previousHash: previousHash,
      // Only include satisfaction and notes if defined
      ...(satisfaction !== undefined && { satisfaction }),
      ...(notes !== undefined && { notes })
    };
    
    // Créer le ticket avec les nouvelles données pour calculer le hash
    const ticketForHash = { ...ticketData, ...updateDataForHash };
    const ticketHash = calculateTicketHash(ticketForHash);
    const finalUpdateData: Partial<TicketData> = {
      ...updateDataForHash,
      dateTerminee: serverTimestamp() as any, // Firebase Timestamp final
      hashe: ticketHash
    };
    
    await updateDoc(ticketRef, finalUpdateData);
    
    // Mettre à jour le cache avec le ticket terminé
    const terminatedTicket: TicketData = {
      ...ticketData,
      ...finalUpdateData,
      hashe: ticketHash
    } as TicketData;
    
    // Mettre à jour le cache intelligemment
    updateTicketInCache(terminatedTicket);
    
    console.log('✅ Ticket terminé et hashé:', { 
      ticketId, 
      hash: ticketHash, 
      chainIndex, 
      previousHash: previousHash || 'GENESIS' 
    });
  } catch (error) {
    console.error('❌ Erreur lors de la finalisation:', error);
    throw error;
  }
};

/**
 * ✏️ METTRE À JOUR UN TICKET
 */
/**
 * 🔄 MISE À JOUR DE TICKET - Version améliorée avec tracking des modifications
 */
export const updateTicket = async (
  documentId: string, 
  restaurantId: string, 
  updateData: UpdateTicketData,
  employeeId?: string,
  trackModifications: boolean = true
): Promise<void> => {
  try {
    console.log("🔄 Mise à jour du ticket avec tracking:", documentId);
    
    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    await ensureTicketsRealtimeSyncStarted(restaurantId);
    
    // Mettre à jour dans la collection tickets
    const ticketRef = doc(getTicketsCollectionRef(restaurantId), documentId);
    
    // Vérifier si le document existe et récupérer les données actuelles
    const docSnap = await getDoc(ticketRef);
    
    if (!docSnap.exists()) {
      console.log("❌ Ticket non trouvé dans la collection tickets:", documentId);
      throw new Error("Ticket non trouvé");
    }

    const originalTicket = { id: documentId, ...docSnap.data() } as TicketData;
    
    // Préparer les données de mise à jour avec tracking si activé
    let finalUpdateData: Partial<TicketData>;
    
    if (trackModifications && updateData.trackModifications !== false) {
      // Utiliser le système de tracking avancé
      finalUpdateData = prepareTicketUpdateWithTracking(originalTicket, updateData, employeeId);
      
      // Générer et logger le résumé des modifications
      const modificationSummary = generateModificationSummary(originalTicket, updateData);
      console.log(`📋 Modifications ticket ${documentId}: ${modificationSummary}`);
    } else {
      // Mise à jour simple sans tracking
      finalUpdateData = updateData;
    }

    // Ajouter timestamp de mise à jour
    finalUpdateData.timestamp = serverTimestamp() as any;

    // Mise à jour du document Firebase
    await updateDoc(ticketRef, finalUpdateData);

    // Créer le ticket mis à jour pour le cache
    const updatedTicket: TicketData = {
      ...originalTicket,
      ...finalUpdateData,
      id: documentId
    } as TicketData;

    // Mettre à jour le cache intelligemment
    updateTicketInCache(updatedTicket);
    
    console.log("✅ Ticket mis à jour avec succès:", documentId);
    
    // Log détaillé si tracking activé
    if (trackModifications && finalUpdateData.modified) {
      console.log(`🔍 Ticket ${documentId} marqué comme modifié avec ${(finalUpdateData.platsdeleted || []).length} plat(s) supprimé(s)`);
    }
    
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour avec tracking:", error);
    throw error;
  }
};

/**
 * 🔄 MISE À JOUR SIMPLE - Version legacy pour compatibilité
 */
export const updateTicketLegacy = async (documentId: string, restaurantId: string, newData: Partial<TicketData>): Promise<void> => {
  try {
    console.log("Mise à jour simple du ticket:", documentId);
    
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

    // Mise à jour du document
    await updateDoc(ticketRef, {
      ...newData,
      timestamp: serverTimestamp()
    });

    // Créer le ticket mis à jour pour le cache
    const updatedTicket: TicketData = {
      ...currentData,
      ...newData,
      id: documentId
    } as TicketData;

    // Mettre à jour le cache intelligemment
    updateTicketInCache(updatedTicket);
    
    console.log("✅ Ticket mis à jour avec succès:", documentId);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    throw error;
  }
};

/**
 * 🗑️ SUPPRIMER UN TICKET EN ECRIVANT DELETED : TRUE ; ACTIVE : FALSE
 */

export const deleteTicket = async (ticketId : string, restaurantId: string): Promise<void> => {
  try {
    console.log("Suppression du ticket:", ticketId);
    
    // Chercher le ticket dans la collection tickets
    const ticketRef = doc(getTicketsCollectionRef(restaurantId), ticketId);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      throw new Error('Ticket introuvable');
    }
    
    const ticketData = ticketDoc.data() as TicketData;
    const tableId = ticketData.tableId;
    
    // Mettre à jour le document pour marquer comme supprimé
    await updateDoc(ticketRef, {
      deleted: true,
      active: false,
      timestamp: serverTimestamp()
    });
    removeTicketFromCache(ticketId, tableId);
    
    console.log("✅ Ticket marqué comme supprimé:", ticketId);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du ticket:", error);
    throw error;
  }
}