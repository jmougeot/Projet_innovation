import { getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import CryptoJS from 'crypto-js';
import { TicketData, PlatQuantite } from './types';
import { getTicketsCollectionRef } from './config';

// ====== FONCTIONS DE HACHAGE ET INTÉGRITÉ ======

/**
 * Calcule le hash SHA-256 d'un ticket pour la chaîne de hachage
 * @param ticket Le ticket à hasher
 * @returns Le hash SHA-256 en hexadécimal
 */
export const calculateTicketHash = (ticket: TicketData): string => {
  try {
    // Créer une copie du ticket sans les champs de hachage pour éviter la récursion
    const ticketForHash = {
      id: ticket.id,
      employeeId: ticket.employeeId,
      status: ticket.status,
      tableId: ticket.tableId,
      timestamp: ticket.timestamp instanceof Timestamp ? ticket.timestamp.toDate().toISOString() : ticket.timestamp,
      plats: ticket.plats?.map((plat: PlatQuantite) => ({
        plat: {
          id: plat.plat.id,
          name: plat.plat.name,
          category: plat.plat.category,
          price: plat.plat.price,
          description: plat.plat.description,
          mission: plat.plat.mission
        },
        quantite: plat.quantite,
        status: plat.status,
        tableId: plat.tableId,
        mission: plat.mission
      })) || [],
      totalPrice: ticket.totalPrice,
      active: ticket.active,
      notes: ticket.notes || '',
      dateCreation: ticket.dateCreation instanceof Timestamp ? ticket.dateCreation.toDate().toISOString() : ticket.dateCreation,
      dateTerminee: ticket.dateTerminee instanceof Timestamp ? ticket.dateTerminee.toDate().toISOString() : ticket.dateTerminee,
      estimatedTime: ticket.estimatedTime,
      dureeTotal: ticket.dureeTotal,
      satisfaction: ticket.satisfaction,
      chainIndex: ticket.chainIndex,
      previousHash: ticket.previousHash || ''
    };

    // Convertir en JSON avec tri des clés pour assurer la cohérence
    const jsonString = JSON.stringify(ticketForHash, Object.keys(ticketForHash).sort());
    
    // Calculer le hash SHA-256
    const hash = CryptoJS.SHA256(jsonString).toString(CryptoJS.enc.Hex);
    
    return hash;
  } catch (error) {
    console.error('Erreur lors du calcul du hash du ticket:', error);
    throw new Error('Impossible de calculer le hash du ticket');
  }
};

/**
 * 🔍 OBSOLÈTE - Récupère le hash du dernier ticket terminé dans la chaîne
 * Cette fonction est remplacée par l'architecture hybride globalChain.ts
 */
export const getLastTerminatedTicketHash = async (restaurantId: string): Promise<{ hash: string; index: number } | null> => {
  console.warn('⚠️ [getLastTerminatedTicketHash] OBSOLÈTE - Utilisez verifyGlobalChain() à la place');
  
  try {
    const ticketsRef = getTicketsCollectionRef(restaurantId);
    const q = query(
      ticketsRef,
      where('deleted', '!=', true), // Remplacer active par un critère plus approprié
      orderBy('chainIndex', 'desc'),
      limit(1) 
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log('Aucun ticket terminé trouvé pour le restaurant:', restaurantId);
      return null;
    }
    
    // Filtrer côté client pour trouver le dernier ticket avec un hash
    const ticketsWithHash = querySnapshot.docs
      .map(doc => doc.data() as TicketData)
      .filter(ticket => ticket.hashe && ticket.chainIndex !== undefined)
      .sort((a, b) => (b.chainIndex || 0) - (a.chainIndex || 0));
    
    if (ticketsWithHash.length === 0) {
      return null;
    }
    
    const lastTicket = ticketsWithHash[0];
    return {
      hash: lastTicket.hashe || '',
      index: lastTicket.chainIndex || 0
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du dernier ticket hashé:', error);
    return null;
  }
};
