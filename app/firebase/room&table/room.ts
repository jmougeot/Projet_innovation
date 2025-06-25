import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Room } from './types';
import { checkActiveTicketsInRoom } from '../ticket/roomCheck';
import { 
  getRoomsCache, 
  setRoomsCache, 
  addRoomToCache, 
  updateRoomInCache, 
  removeRoomFromCache 
} from './cache';
import { startRealtimeSync, getListenersStatus } from './realtime';

const COLLECTION_NAME = 'rooms';

// Variable pour s'assurer qu'on démarre la sync une seule fois par restaurant
let syncStartedForRestaurants = new Set<string>();

/**
 * 🚀 Auto-démarrage de la synchronisation temps réel
 */
const ensureRealtimeSyncStarted = async (restaurantId: string) => {
  const status = getListenersStatus();
  
  // Si déjà démarré pour ce restaurant, ne rien faire
  if (syncStartedForRestaurants.has(restaurantId) && status.isActive) {
    return;
  }
  
  try {
    console.log(`🚀 Auto-démarrage de la synchronisation pour ${restaurantId}`);
    await startRealtimeSync(restaurantId);
    syncStartedForRestaurants.add(restaurantId);
    console.log(`✅ Synchronisation auto-démarrée pour ${restaurantId}`);
  } catch (error) {
    console.warn(`⚠️ Impossible de démarrer la sync pour ${restaurantId}:`, error);
    // Continue sans sync (fallback sur cache statique)
  }
};

/**
 * Récupère toutes les salles d'un restaurant avec cache intelligent
 */
export const getRooms = async (restaurantId: string, useCache: boolean = true): Promise<Room[]> => {
  try {
    // 🚀 Auto-démarrer la synchronisation temps réel si pas encore active
    await ensureRealtimeSyncStarted(restaurantId);

    // Vérifier le cache d'abord
    if (useCache) {
      const cachedRooms = getRoomsCache();
      if (cachedRooms) {
        console.log(`🏠 ${cachedRooms.length} salles chargées depuis le cache`);
        return cachedRooms;
      }
    }

    console.log('🔄 Chargement des salles depuis Firebase');
    const roomsRef = collection(db, 'restaurants', restaurantId, COLLECTION_NAME);
    const querySnapshot = await getDocs(roomsRef);
    
    const rooms = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Room, 'id'>)
    } as Room));

    // Mettre à jour le cache
    setRoomsCache(rooms);
    console.log(`✅ ${rooms.length} salles chargées et mises en cache`);

    return rooms;
  } catch (error) {
    console.error('Erreur lors de la récupération des salles:', error);
    
    // Fallback sur le cache en cas d'erreur
    const cachedRooms = getRoomsCache();
    if (cachedRooms) {
      console.log('🔄 Utilisation du cache de secours pour les salles');
      return cachedRooms;
    }
    
    throw error;
  }
};

/**
 * Récupère une salle spécifique
 */
export const getRoom = async (restaurantId: string, roomId: string): Promise<Room | null> => {
  try {
    const roomDoc = doc(db, 'restaurants', restaurantId, COLLECTION_NAME, roomId);
    const docSnapshot = await getDoc(roomDoc);
    
    if (docSnapshot.exists()) {
      return {
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as Room;
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la salle:', error);
    throw error;
  }
};

/**
 * Crée une nouvelle salle avec mise à jour du cache
 */
export const createRoom = async (restaurantId: string, roomData: Omit<Room, 'id'>): Promise<string> => {
  try {
    const roomsRef = collection(db, 'restaurants', restaurantId, COLLECTION_NAME);
    const docRef = await addDoc(roomsRef, roomData);
    
    // Ajouter au cache
    const newRoom = { id: docRef.id, ...roomData };
    addRoomToCache(newRoom);
    
    console.log(`✅ Salle "${roomData.name}" créée avec succès`);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la salle:', error);
    throw error;
  }
};

/**
 * Met à jour une salle avec mise à jour du cache
 */
export const updateRoom = async (restaurantId: string, roomId: string, updates: Partial<Room>): Promise<void> => {
  try {
    const roomDoc = doc(db, 'restaurants', restaurantId, COLLECTION_NAME, roomId);
    await updateDoc(roomDoc, updates);
    
    // Mettre à jour le cache
    updateRoomInCache(roomId, updates);
    
    console.log(`✅ Salle "${roomId}" mise à jour avec succès`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la salle:', error);
    throw error;
  }
};

/**
 * Supprime une salle si elle n'a pas de tickets actifs
 * Cette fonction vérifie d'abord qu'aucun ticket actif n'existe pour cette salle
 */
export const deleteRoomSafe = async (restaurantId: string, roomId: string): Promise<void> => {
  try {
    // Vérifier s'il y a des tickets actifs dans cette salle
    const checkResult = await checkActiveTicketsInRoom(roomId, restaurantId);
    
    if (checkResult.hasActiveTickets) {
      throw new Error(`Impossible de supprimer la salle : ${checkResult.message}`);
    }
    
    const roomDoc = doc(db, 'restaurants', restaurantId, COLLECTION_NAME, roomId);
    await deleteDoc(roomDoc);
  } catch (error) {
    console.error('Erreur lors de la suppression de la salle:', error);
    throw error;
  }
};

/**
 * Supprime une salle sans vérification (à utiliser avec précaution) avec mise à jour du cache
 */
export const deleteRoom = async (restaurantId: string, roomId: string): Promise<void> => {
  try {
    const roomDoc = doc(db, 'restaurants', restaurantId, COLLECTION_NAME, roomId);
    await deleteDoc(roomDoc);
    
    // Supprimer du cache
    removeRoomFromCache(roomId);
    
    console.log(`✅ Salle "${roomId}" supprimée avec succès`);
  } catch (error) {
    console.error('Erreur lors de la suppression de la salle:', error);
    throw error;
  }
};
