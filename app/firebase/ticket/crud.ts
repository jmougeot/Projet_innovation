
import { TicketData, UpdateTicketData, TicketChainData } from './types';

import { 
  createMainChainTicket, 
  updateTicketWithFork, 
  getActiveTicket,
  getTicketChain,
  validateTicket
} from './blockchain';

// ====== FONCTIONS PRINCIPALES CRUD BLOCKCHAIN ======

/**
 * 🎯 CRÉATION DE TICKET - Nouveau bloc dans la chaîne principale (BLOCKCHAIN)
 */
export const createTicket = async (ticketData: Omit<TicketData, 'id'>, restaurantId: string): Promise<string> => {
  try {
    console.log('🎯 [createTicket] Création d\'un nouveau ticket via blockchain');
    
    // Utiliser la fonction blockchain pour créer un bloc principal
    return await createMainChainTicket(ticketData, restaurantId);
    
  } catch (error) {
    console.error("❌ [createTicket] Erreur lors de la création du ticket:", error);
    throw error;
  }
};

/**
 * 🏁 TERMINER TICKET - Utilise la nouvelle architecture hybride (validateTicket)
 */
export const terminerTicket = async (
  ticketId: string, 
  restaurantId: string, 
  satisfaction?: number, 
  notes?: string,
  paymentMethod: 'especes' | 'carte' | 'cheque' | 'virement' = 'especes',
  employeeId?: string
): Promise<void> => {
  try {
    console.log(`🏁 [terminerTicket] Finalisation ticket via nouvelle architecture: ${ticketId}`);
    
    // ✅ NOUVELLE ARCHITECTURE : Utiliser validateTicket au lieu de l'ancien système
    await validateTicket(
      ticketId,
      restaurantId,
      employeeId || 'default',
      paymentMethod
    );
    
    // Si satisfaction ou notes sont fournis, créer un fork supplémentaire pour les ajouter
    if (satisfaction !== undefined || notes !== undefined) {
      const updateData: UpdateTicketData = {};
      if (satisfaction !== undefined) updateData.satisfaction = satisfaction;
      if (notes !== undefined) updateData.notes = notes;
      
      await updateTicketWithFork(
        ticketId,
        restaurantId,
        updateData,
        employeeId || 'default',
        'correction'
      );
    }
    
    console.log('✅ [terminerTicket] Ticket terminé via nouvelle architecture:', {
      ticketId,
      paymentMethod,
      satisfaction,
      notes
    });
    
  } catch (error) {
    console.error('❌ [terminerTicket] Erreur lors de la finalisation:', error);
    throw error;
  }
};

/**
 * 🔄 MISE À JOUR DE TICKET - Système blockchain avec FORK (JAMAIS de updateDoc)
 */
export const updateTicket = async (
  documentId: string, 
  restaurantId: string, 
  updateData: UpdateTicketData,
  employeeId?: string,
  forkReason: 'modification' | 'correction' | 'annulation' = 'modification'
): Promise<string> => { // Retourne l'ID du fork créé
  try {
    console.log("🔄 [updateTicket] Mise à jour via fork blockchain:", documentId);
    
    // Trouver le ticket actuellement actif (peut être un fork existant)
    const activeTicket = await getActiveTicket(documentId, restaurantId);
    
    // Créer un fork au lieu d'utiliser updateDoc
    const forkId = await updateTicketWithFork(
      activeTicket.id, // ID du ticket actif à forker
      restaurantId,
      updateData,
      employeeId,
      forkReason
    );
    
    console.log("✅ [updateTicket] Fork créé avec succès:", {
      originalTicketId: documentId,
      activeTicketId: activeTicket.id,
      newForkId: forkId
    });
    
    return forkId;
    
  } catch (error) {
    console.error("❌ [updateTicket] Erreur lors de la mise à jour:", error);
    throw error;
  }
};

/**
 * 🗑️ SUPPRIMER UN TICKET - Crée un fork avec status "deleted" (BLOCKCHAIN)
 */
export const deleteTicket = async (
  ticketId: string, 
  restaurantId: string, 
  employeeId?: string
): Promise<string> => {
  try {
    console.log("🗑️ [deleteTicket] Suppression du ticket via fork:", ticketId);
    
    // Créer un fork pour marquer le ticket comme supprimé
    const deletedForkId = await updateTicketWithFork(
      ticketId,
      restaurantId,
      {
        status: 'encaissee', // Statut final pour suppression
        notes: 'Ticket supprimé' // Indiquer la suppression
      },
      employeeId,
      'annulation' // Raison du fork
    );
    
    console.log("✅ [deleteTicket] Ticket marqué comme supprimé via fork:", {
      originalTicketId: ticketId,
      deletedForkId
    });
    
    return deletedForkId;
    
  } catch (error) {
    console.error("❌ [deleteTicket] Erreur lors de la suppression du ticket:", error);
    throw error;
  }
};

/**
 * 📋 OBTENIR LE TICKET ACTIF - Récupère la version active (peut être un fork)
 */
export const getTicketActif = async (
  originalTicketId: string,
  restaurantId: string
): Promise<TicketData> => {
  try {
    console.log("📋 [getTicketActif] Récupération du ticket actif:", originalTicketId);
    
    return await getActiveTicket(originalTicketId, restaurantId);
    
  } catch (error) {
    console.error("❌ [getTicketActif] Erreur:", error);
    throw error;
  }
};

/**
 * � OBTENIR LA CHAÎNE COMPLÈTE D'UN TICKET
 */
export const getTicketHistorique = async (
  originalTicketId: string,
  restaurantId: string
): Promise<TicketChainData> => {
  try {
    console.log("🔗 [getTicketHistorique] Récupération de l'historique:", originalTicketId);
    
    return await getTicketChain(originalTicketId, restaurantId);
    
  } catch (error) {
    console.error("❌ [getTicketHistorique] Erreur:", error);
    throw error;
  }
};

// ====== EXPORTS PRINCIPAUX ======
export default {
  // Fonctions principales BLOCKCHAIN (plus d'updateDoc)
  createTicket,           // Crée un nouveau bloc principal
  updateTicket,           // Crée un fork au lieu d'update
  terminerTicket,         // Crée un fork de finalisation
  deleteTicket,           // Crée un fork de suppression
  
  // Fonctions de consultation
  getTicketActif,         // Récupère le ticket actuellement actif
  getTicketHistorique,    // Récupère toute la chaîne d'un ticket
};