import { onSnapshot, query, orderBy, where, Unsubscribe, collection, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TicketData } from './types';
import { 
  setTicketsActifsCache,
  setLastTicketsActifsCacheUpdate,
  updateTicketInCache,
  addTicketToCache,
  removeTicketFromCache,
  updateTableCacheWithTicket
} from './cache';

// ====== RÉFÉRENCES FIRESTORE ======
const getRestaurantRef = (restaurantId: string) => {
  return doc(db, 'restaurants', restaurantId);
};

const getTicketsCollectionRef = (restaurantId: string) => {
  return collection(db, 'restaurants', restaurantId, 'tickets');
};

const getTicketDocRef = (restaurantId: string, ticketId: string) => {
  return doc(db, 'restaurants', restaurantId, 'tickets', ticketId);
};

// ====== LISTENERS TEMPS RÉEL ======

/**
 * 🔄 Écouter les changements des tickets ACTIFS en temps réel
 */
export const setupActiveTicketsRealtimeSync = (restaurantId: string): Unsubscribe => {
  console.log(`🔄 Configuration du listener temps réel pour les tickets actifs du restaurant ${restaurantId}`);
  
  const activeTicketsQuery = query(
    getTicketsCollectionRef(restaurantId),
    where('active', '==', true),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(
    activeTicketsQuery,
    (snapshot) => {
      console.log(`📡 Changement détecté dans les tickets actifs: ${snapshot.docChanges().length} modifications`);
      
      // Traiter chaque changement
      snapshot.docChanges().forEach((change) => {
        const ticketData = { 
          id: change.doc.id, 
          ...(change.doc.data() as Omit<TicketData, 'id'>)
        } as TicketData;
        
        switch (change.type) {
          case 'added':
            console.log(`🆕 Nouveau ticket actif ajouté: ${ticketData.id}`);
            addTicketToCache(ticketData);
            // Mettre à jour le cache de la table correspondante
            updateTableCacheWithTicket(ticketData.tableId, ticketData);
            break;
            
          case 'modified':
            console.log(`✏️ Ticket actif modifié: ${ticketData.id}`);
            updateTicketInCache(ticketData);
            // Mettre à jour le cache de la table si le ticket est toujours actif
            if (ticketData.active) {
              updateTableCacheWithTicket(ticketData.tableId, ticketData);
            } else {
              // Si le ticket n'est plus actif, vider le cache de la table
              updateTableCacheWithTicket(ticketData.tableId, null);
            }
            break;
            
          case 'removed':
            console.log(`🗑️ Ticket actif supprimé: ${ticketData.id}`);
            removeTicketFromCache(ticketData.id, ticketData.tableId);
            updateTableCacheWithTicket(ticketData.tableId, null);
            break;
        }
      });
      
      // Mettre à jour le cache complet si c'est la première fois
      if (snapshot.docChanges().length === snapshot.docs.length) {
        const allActiveTickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<TicketData, 'id'>)
        } as TicketData));
        
        setTicketsActifsCache(allActiveTickets);
        setLastTicketsActifsCacheUpdate(Date.now());
        console.log(`💾 Cache initial des tickets actifs chargé: ${allActiveTickets.length} tickets`);
      }
    },
    (error) => {
      console.error('❌ Erreur dans le listener des tickets actifs:', error);
    }
  );
};

/**
 * 🔄 Écouter les changements d'un ticket spécifique en temps réel
 */
export const setupTicketRealtimeSync = (restaurantId: string, ticketId: string): Unsubscribe => {
  console.log(`🔄 Configuration du listener temps réel pour le ticket ${ticketId}`);
  
  const ticketDocRef = getTicketDocRef(restaurantId, ticketId);

  return onSnapshot(
    ticketDocRef,
    (doc) => {
      if (doc.exists()) {
        const ticketData = {
          id: doc.id,
          ...doc.data()
        } as TicketData;
        
        console.log(`📡 Ticket ${ticketId} mis à jour en temps réel`);
        updateTicketInCache(ticketData);
        
        // Mettre à jour le cache de la table
        if (ticketData.active) {
          updateTableCacheWithTicket(ticketData.tableId, ticketData);
        } else {
          updateTableCacheWithTicket(ticketData.tableId, null);
        }
      } else {
        console.log(`⚠️ Ticket ${ticketId} supprimé`);
        // Note: On ne peut pas récupérer tableId du ticket supprimé ici
        // Il faudra gérer ça dans la fonction de suppression
      }
    },
    (error: any) => {
      console.error(`❌ Erreur dans le listener du ticket ${ticketId}:`, error);
    }
  );
};

/**
 * 🔄 Écouter les changements des tickets d'une table spécifique en temps réel
 */
export const setupTableTicketsRealtimeSync = (restaurantId: string, tableId: number): Unsubscribe => {
  console.log(`🔄 Configuration du listener temps réel pour les tickets de la table ${tableId}`);
  
  const tableTicketsQuery = query(
    getTicketsCollectionRef(restaurantId),
    where('tableId', '==', tableId),
    where('active', '==', true),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(
    tableTicketsQuery,
    (snapshot) => {
      console.log(`📡 Tickets de la table ${tableId} mis à jour: ${snapshot.docs.length} tickets actifs`);
      
      // Prendre le ticket le plus récent (premier dans la liste triée par timestamp desc)
      const latestTicket = snapshot.docs.length > 0 ? {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as TicketData : null;
      
      updateTableCacheWithTicket(tableId, latestTicket);
      
      // Mettre à jour le cache global pour tous les tickets de cette table
      snapshot.docChanges().forEach((change) => {
        const ticketData = {
          id: change.doc.id,
          ...change.doc.data()
        } as TicketData;
        
        switch (change.type) {
          case 'added':
            addTicketToCache(ticketData);
            break;
          case 'modified':
            updateTicketInCache(ticketData);
            break;
          case 'removed':
            removeTicketFromCache(ticketData.id, ticketData.tableId);
            break;
        }
      });
    },
    (error) => {
      console.error(`❌ Erreur dans le listener des tickets de la table ${tableId}:`, error);
    }
  );
};

// ====== GESTION DES LISTENERS ======

let activeTicketListeners: Map<string, Unsubscribe> = new Map();

/**
 * 🚀 Démarrer la synchronisation temps réel des tickets actifs
 */
export const startTicketsRealtimeSync = async (restaurantId: string): Promise<void> => {
  try {
    console.log(`🚀 Démarrage de la synchronisation temps réel des tickets pour le restaurant ${restaurantId}`);
    
    // Arrêter les listeners existants pour ce restaurant
    stopTicketsRealtimeSync(restaurantId);
    
    // Configurer le listener pour tous les tickets actifs
    const activeTicketsListener = setupActiveTicketsRealtimeSync(restaurantId);
    activeTicketListeners.set(`${restaurantId}_active`, activeTicketsListener);
    
    console.log(`✅ Synchronisation temps réel des tickets démarrée pour ${restaurantId}`);
  } catch (error) {
    console.error('❌ Erreur lors du démarrage de la synchronisation temps réel des tickets:', error);
    throw error;
  }
};

/**
 * 🚀 Démarrer la synchronisation temps réel pour une table spécifique
 */
export const startTableTicketsRealtimeSync = async (restaurantId: string, tableId: number): Promise<void> => {
  try {
    console.log(`🚀 Démarrage de la synchronisation temps réel pour la table ${tableId}`);
    
    const tableListenerKey = `${restaurantId}_table_${tableId}`;
    
    // Arrêter le listener existant pour cette table s'il existe
    const existingListener = activeTicketListeners.get(tableListenerKey);
    if (existingListener) {
      existingListener();
      activeTicketListeners.delete(tableListenerKey);
    }
    
    // Configurer le nouveau listener
    const tableTicketsListener = setupTableTicketsRealtimeSync(restaurantId, tableId);
    activeTicketListeners.set(tableListenerKey, tableTicketsListener);
    
    console.log(`✅ Synchronisation temps réel démarrée pour la table ${tableId}`);
  } catch (error) {
    console.error(`❌ Erreur lors du démarrage de la sync pour la table ${tableId}:`, error);
    throw error;
  }
};

/**
 * 🛑 Arrêter la synchronisation temps réel des tickets
 */
export const stopTicketsRealtimeSync = (restaurantId?: string): void => {
  if (restaurantId) {
    // Arrêter seulement les listeners de ce restaurant
    const keysToRemove: string[] = [];
    activeTicketListeners.forEach((unsubscribe, key) => {
      if (key.startsWith(restaurantId)) {
        try {
          unsubscribe();
          keysToRemove.push(key);
          console.log(`✅ Listener tickets ${key} arrêté`);
        } catch (error) {
          console.error(`❌ Erreur lors de l'arrêt du listener ${key}:`, error);
        }
      }
    });
    keysToRemove.forEach(key => activeTicketListeners.delete(key));
    console.log(`🛑 Tous les listeners tickets arrêtés pour ${restaurantId}`);
  } else {
    // Arrêter tous les listeners
    console.log(`🛑 Arrêt de tous les listeners tickets (${activeTicketListeners.size} listeners)`);
    
    activeTicketListeners.forEach((unsubscribe, key) => {
      try {
        unsubscribe();
        console.log(`✅ Listener tickets ${key} arrêté`);
      } catch (error) {
        console.error(`❌ Erreur lors de l'arrêt du listener ${key}:`, error);
      }
    });
    
    activeTicketListeners.clear();
    console.log('🛑 Tous les listeners tickets arrêtés');
  }
};

/**
 * 🔄 Redémarrer la synchronisation temps réel des tickets
 */
export const restartTicketsRealtimeSync = async (restaurantId: string): Promise<void> => {
  console.log('🔄 Redémarrage de la synchronisation temps réel des tickets');
  stopTicketsRealtimeSync(restaurantId);
  await startTicketsRealtimeSync(restaurantId);
};

/**
 * 📊 Obtenir le statut des listeners tickets
 */
export const getTicketListenersStatus = () => {
  const listenerKeys = Array.from(activeTicketListeners.keys());
  return {
    activeListenersCount: activeTicketListeners.size,
    isActive: activeTicketListeners.size > 0,
    listeners: listenerKeys,
    restaurantListeners: listenerKeys.filter(key => key.includes('_active')),
    tableListeners: listenerKeys.filter(key => key.includes('_table_'))
  };
};

/**
 * 🐛 Debug des listeners tickets
 */
export const debugTicketsRealtimeSync = (): void => {
  console.log('🐛 DEBUG SYNCHRONISATION TEMPS RÉEL TICKETS:');
  console.log('Listeners actifs:', activeTicketListeners.size);
  console.log('Status:', getTicketListenersStatus());
  activeTicketListeners.forEach((_, key) => {
    console.log(`  - ${key}`);
  });
};

