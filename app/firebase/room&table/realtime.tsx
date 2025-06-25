import { onSnapshot, query, orderBy, Unsubscribe, collection, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Room, Table } from './types';
import { 
  setRoomsCache, 
  addRoomToCache, 
  updateRoomInCache, 
  removeRoomFromCache,
  setTablesCache,
  addTableToCache,
  updateTableInCache,
  removeTableFromCache
} from './cache';

// ====== RÉFÉRENCES FIRESTORE ======
const getRestaurantRef = (restaurantId: string) => {
  return doc(db, 'restaurants', restaurantId);
};

const getRoomsCollectionRef = (restaurantId: string) => {
  return collection(db, 'restaurants', restaurantId, 'rooms');
};

const getRoomDocRef = (restaurantId: string, roomId: string) => {
  return doc(db, 'restaurants', restaurantId, 'rooms', roomId);
};

// ====== LISTENERS TEMPS RÉEL ======

/**
 * 🔄 Écouter les changements des salles en temps réel
 */
export const setupRoomsRealtimeSync = (restaurantId: string): Unsubscribe => {
  console.log(`🔄 Configuration du listener temps réel pour les salles du restaurant ${restaurantId}`);
  
  const roomsQuery = query(
    getRoomsCollectionRef(restaurantId),
    orderBy('name')
  );

  return onSnapshot(
    roomsQuery,
    (snapshot) => {
      console.log(`📡 Changement détecté dans les salles: ${snapshot.docChanges().length} modifications`);
      
      // Traiter chaque changement
      snapshot.docChanges().forEach((change) => {
        const roomData = { 
          id: change.doc.id, 
          ...(change.doc.data() as Omit<Room, 'id'>)
        } as Room;
        
        switch (change.type) {
          case 'added':
            console.log(`🆕 Nouvelle salle ajoutée: ${roomData.name}`);
            addRoomToCache(roomData);
            break;
            
          case 'modified':
            console.log(`✏️ Salle modifiée: ${roomData.name}`);
            updateRoomInCache(roomData.id!, roomData);
            break;
            
          case 'removed':
            console.log(`🗑️ Salle supprimée: ${roomData.name}`);
            removeRoomFromCache(roomData.id!);
            break;
        }
      });
      
      // Mettre à jour le cache complet si c'est la première fois
      if (snapshot.docChanges().length === snapshot.docs.length) {
        const allRooms = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Room, 'id'>)
        } as Room));
        setRoomsCache(allRooms);
        console.log(`💾 Cache initial des salles chargé: ${allRooms.length} salles`);
      }
    },
    (error) => {
      console.error('❌ Erreur dans le listener des salles:', error);
    }
  );
};

/**
 * 🔄 Écouter les changements des tables d'une salle en temps réel
 */
export const setupTablesRealtimeSync = (restaurantId: string, roomId: string): Unsubscribe => {
  console.log(`🔄 Configuration du listener temps réel pour les tables de la salle ${roomId}`);
  
  const roomDocRef = getRoomDocRef(restaurantId, roomId);

  return onSnapshot(
    roomDocRef,
    (doc) => {
      if (doc.exists()) {
        const roomData = doc.data() as any;
        const tables: Table[] = roomData?.tables || [];
        
        console.log(`📡 Tables mises à jour pour la salle ${roomId}: ${tables.length} tables`);
        setTablesCache(roomId, tables);
      } else {
        console.log(`⚠️ Salle ${roomId} n'existe plus, vidage du cache des tables`);
        setTablesCache(roomId, []);
      }
    },
    (error: any) => {
      console.error(`❌ Erreur dans le listener des tables pour la salle ${roomId}:`, error);
    }
  );
};

/**
 * 🔄 Écouter les changements de toutes les tables de toutes les salles
 */
export const setupAllTablesRealtimeSync = (restaurantId: string): Promise<Unsubscribe[]> => {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Configuration des listeners pour toutes les tables du restaurant ${restaurantId}`);
    
    // D'abord, écouter les salles pour connaître toutes les salles disponibles
    const roomsQuery = query(
      getRoomsCollectionRef(restaurantId),
      orderBy('name')
    );

    const unsubscribers: Unsubscribe[] = [];

    const roomsListener = onSnapshot(
      roomsQuery,
      (snapshot) => {
        const promises: Promise<void>[] = [];
        
        snapshot.docs.forEach((roomDoc) => {
          const roomId = roomDoc.id;
          
          // Configurer un listener pour chaque salle
          const tableListener = setupTablesRealtimeSync(restaurantId, roomId);
          unsubscribers.push(tableListener);
        });
        
        // Ajouter le listener des salles aux unsubscribers
        unsubscribers.push(roomsListener);
        
        console.log(`✅ ${unsubscribers.length} listeners configurés (${snapshot.docs.length} salles + 1 listener salles)`);
        resolve(unsubscribers);
      },
      (error) => {
        console.error('❌ Erreur lors de la configuration des listeners:', error);
        reject(error);
      }
    );
  });
};

// ====== GESTION DES LISTENERS ======

let activeListeners: Unsubscribe[] = [];

/**
 * 🚀 Démarrer la synchronisation temps réel complète
 */
export const startRealtimeSync = async (restaurantId: string): Promise<void> => {
  try {
    console.log(`🚀 Démarrage de la synchronisation temps réel pour le restaurant ${restaurantId}`);
    
    // Arrêter les listeners existants
    stopRealtimeSync();
    
    // Configurer les nouveaux listeners
    activeListeners = await setupAllTablesRealtimeSync(restaurantId);
    
    console.log(`✅ Synchronisation temps réel démarrée avec ${activeListeners.length} listeners`);
  } catch (error) {
    console.error('❌ Erreur lors du démarrage de la synchronisation temps réel:', error);
    throw error;
  }
};

/**
 * 🛑 Arrêter la synchronisation temps réel
 */
export const stopRealtimeSync = (): void => {
  console.log(`🛑 Arrêt de la synchronisation temps réel (${activeListeners.length} listeners)`);
  
  activeListeners.forEach((unsubscribe, index) => {
    try {
      unsubscribe();
      console.log(`✅ Listener ${index + 1} arrêté`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'arrêt du listener ${index + 1}:`, error);
    }
  });
  
  activeListeners = [];
  console.log('🛑 Tous les listeners arrêtés');
};

/**
 * 🔄 Redémarrer la synchronisation temps réel
 */
export const restartRealtimeSync = async (restaurantId: string): Promise<void> => {
  console.log('🔄 Redémarrage de la synchronisation temps réel');
  stopRealtimeSync();
  await startRealtimeSync(restaurantId);
};

/**
 * 📊 Obtenir le statut des listeners
 */
export const getListenersStatus = () => {
  return {
    activeListenersCount: activeListeners.length,
    isActive: activeListeners.length > 0,
    listeners: activeListeners.map((_, index) => `Listener ${index + 1}`)
  };
};

/**
 * 🐛 Debug des listeners
 */
export const debugRealtimeSync = (): void => {
  console.log('🐛 DEBUG SYNCHRONISATION TEMPS RÉEL:');
  console.log('Listeners actifs:', activeListeners.length);
  console.log('Status:', getListenersStatus());
};
