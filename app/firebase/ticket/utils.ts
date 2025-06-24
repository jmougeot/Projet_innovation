import { TicketData, PlatQuantite } from './types';
import { getTicketByTableId } from './queries';
import { terminerTicket, updateTicket } from './crud';
import { removeTicketFromCache } from './cache';

// ====== FONCTIONS UTILITAIRES ET MÉTIER ======

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
    
    // Le cache est automatiquement mis à jour dans terminerTicket
    console.log(`✅ Ticket table ${tableId} encaissé et marqué comme inactif`);
  } catch (error) {
    console.error("❌ Erreur lors de l'encaissement:", error);
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
