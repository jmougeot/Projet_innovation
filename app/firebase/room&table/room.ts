import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Room } from './types';
import { checkActiveTicketsInRoom } from '../ticket/roomCheck';

const COLLECTION_NAME = 'rooms';

/**
 * Récupère toutes les salles d'un restaurant
 */
export const getRooms = async (restaurantId: string): Promise<Room[]> => {
  try {
    const roomsRef = collection(db, 'restaurants', restaurantId, COLLECTION_NAME);
    const querySnapshot = await getDocs(roomsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Room));
  } catch (error) {
    console.error('Erreur lors de la récupération des salles:', error);
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
 * Crée une nouvelle salle
 */
export const createRoom = async (restaurantId: string, roomData: Omit<Room, 'id'>): Promise<string> => {
  try {
    const roomsRef = collection(db, 'restaurants', restaurantId, COLLECTION_NAME);
    const docRef = await addDoc(roomsRef, roomData);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la salle:', error);
    throw error;
  }
};

/**
 * Met à jour une salle
 */
export const updateRoom = async (restaurantId: string, roomId: string, updates: Partial<Room>): Promise<void> => {
  try {
    const roomDoc = doc(db, 'restaurants', restaurantId, COLLECTION_NAME, roomId);
    await updateDoc(roomDoc, updates);
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
 * Supprime une salle sans vérification (à utiliser avec précaution)
 */
export const deleteRoom = async (restaurantId: string, roomId: string): Promise<void> => {
  try {
    const roomDoc = doc(db, 'restaurants', restaurantId, COLLECTION_NAME, roomId);
    await deleteDoc(roomDoc);
  } catch (error) {
    console.error('Erreur lors de la suppression de la salle:', error);
    throw error;
  }
};
