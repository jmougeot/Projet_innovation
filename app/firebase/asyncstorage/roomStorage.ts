import { setItem, getItem, removeItem, STORAGE_KEYS } from './index';

// ====== TYPE SIMPLE ======
export interface SelectedRoom {
  roomName: string;
  selectedAt: Date;
}

// ====== GESTION ROOM SÉLECTIONNÉE ======

/**
 * Enregistrer le nom de la room sélectionnée dans le plan de salle
 */
export const saveSelectedRoomName = async (roomName: string): Promise<void> => {
  try {
    const roomData: SelectedRoom = {
      roomName,
      selectedAt: new Date()
    };
    
    const dataToSave = {
      ...roomData,
      selectedAt: roomData.selectedAt.toISOString()
    };
    
    await setItem(STORAGE_KEYS.SELECTED_ROOM, dataToSave);
    console.log(`✅ [ROOM_STORAGE] Room sélectionnée sauvegardée: ${roomName}`);
    
  } catch (error) {
    console.error(`❌ [ROOM_STORAGE] Erreur sauvegarde room sélectionnée:`, error);
    throw error;
  }
};

/**
 * Récupérer le nom de la room sélectionnée
 */
export const getSelectedRoomName = async (): Promise<string | null> => {
  try {
    const roomData = await getItem<SelectedRoom & { selectedAt: string }>(STORAGE_KEYS.SELECTED_ROOM);
    if (!roomData) {
      console.log(`📱 [ROOM_STORAGE] Aucune room sélectionnée trouvée`);
      return null;
    }
    
    console.log(`📱 [ROOM_STORAGE] Room sélectionnée récupérée: ${roomData.roomName}`);
    return roomData.roomName;
  } catch (error) {
    console.error(`❌ [ROOM_STORAGE] Erreur lecture room sélectionnée:`, error);
    return null;
  }
};

/**
 * Supprimer la room sélectionnée
 */
export const clearSelectedRoomName = async (): Promise<void> => {
  try {
    await removeItem(STORAGE_KEYS.SELECTED_ROOM);
    console.log(`✅ [ROOM_STORAGE] Room sélectionnée supprimée`);
  } catch (error) {
    console.error(`❌ [ROOM_STORAGE] Erreur suppression room sélectionnée:`, error);
    throw error;
  }
};

/**
 * Vérifier si une room est sélectionnée
 */
export const hasSelectedRoomName = async (): Promise<boolean> => {
  try {
    const roomName = await getSelectedRoomName();
    return roomName !== null;
  } catch (error) {
    console.error(`❌ [ROOM_STORAGE] Erreur vérification room sélectionnée:`, error);
    return false;
  }
};

// ====== EXPORT PAR DÉFAUT ======
export default {
  saveSelectedRoomName,
  getSelectedRoomName,
  clearSelectedRoomName,
  hasSelectedRoomName
};
