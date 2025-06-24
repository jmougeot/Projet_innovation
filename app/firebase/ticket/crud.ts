import {
  addDoc,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { TicketData, PlatQuantite } from './types';
import { getTicketsCollectionRef } from './config';
import { calculateTicketHash, getLastTerminatedTicketHash } from './hash';
import {
  addTicketToCache,
  updateTicketInCache,
  removeTicketFromCache,
} from './cache';

// ====== FONCTIONS PRINCIPALES CRUD ======

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
 * 🗑️ SUPPRIMER UN TICKET EN ECRIVANT DELETED : TRUE ET ACTIVE FALSE
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