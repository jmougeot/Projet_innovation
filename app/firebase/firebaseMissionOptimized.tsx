import { db } from './firebaseConfig';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  writeBatch,
  serverTimestamp,

  Timestamp,
  deleteField
} from 'firebase/firestore';

// Import function to update user points and level
import { updatePointsAndLevel } from './firebaseUser';

// Types importés des interfaces
import type { Mission } from '../mission/types';

// ====== CACHE MANAGEMENT ======
let missionsCache: Map<string, Mission[]> = new Map(); // Cache par restaurantId
let individualMissionCache: { [missionId: string]: Mission } = {};
let userMissionsCache: { [userId: string]: UserMissionParticipant[] } = {};
let lastMissionsCacheUpdate = 0;
const MISSIONS_CACHE_DURATION = 60000; // 1 minute

// Collections - using restaurant/missions sub-collections structure
const RESTAURANTS_COLLECTION = 'restaurants';

// Helper functions to get collection references
const getRestaurantRefForMissions = (restaurantId: string) => {
  return doc(db, RESTAURANTS_COLLECTION, restaurantId);
};

const getMissionsCollectionRef = (restaurantId: string) => {
  return collection(getRestaurantRefForMissions(restaurantId), 'missions');
};

// ====== TYPES INTERFACES ======

// Interface pour les participants dans la sous-collection 'participants' de chaque mission
interface UserMissionParticipant {
  id: string; // ID du document participant
  userId: string;
  missionId?: string; // ID de la mission parent
  status: "pending" | "completed" | "failed";
  progression: number; // Pourcentage de progression (0-100)
  currentValue?: number; // Valeur actuelle pour les missions avec targetValue
  dateAssigned: Timestamp;
  dateCompletion?: Timestamp | any; // Allow FieldValue for server operations
  isPartOfCollective?: boolean;
  collectiveMissionId?: string;
}

// Interface pour les missions collectives dans la sous-collection 'collectives' de chaque mission
interface CollectiveMissionData {
  id: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  dateCreated: Timestamp;
  dateCompleted?: Timestamp;
  participantIds: string[]; // IDs des documents participants
}

// ====== CACHE UTILITIES ======

export const clearMissionsCache = (restaurantId?: string) => {
  if (restaurantId) {
    missionsCache.delete(restaurantId);
    console.log(`🗑️ Cache des missions vidé pour le restaurant ${restaurantId}`);
  } else {
    missionsCache.clear();
    console.log('🗑️ Cache des missions vidé pour tous les restaurants');
  }
  individualMissionCache = {};
  userMissionsCache = {};
  lastMissionsCacheUpdate = 0;
};

export const getMissionsCacheInfo = (restaurantId: string) => {
  const now = Date.now();
  const cachedMissions = missionsCache.get(restaurantId);
  const timeLeft = cachedMissions ? Math.max(0, MISSIONS_CACHE_DURATION - (now - lastMissionsCacheUpdate)) : 0;
  return {
    isActive: !!cachedMissions,
    allMissionsCount: cachedMissions?.length || 0,
    individualMissionsCount: Object.keys(individualMissionCache).length,
    userMissionsCount: Object.keys(userMissionsCache).length,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: MISSIONS_CACHE_DURATION,
    durationFormatted: `${MISSIONS_CACHE_DURATION / 60000}min`
  };
};

// ====== MISSIONS DE BASE ======

export const createMission = async (mission: Omit<Mission, 'id'>, restaurantId: string) => {
  try {
    const missionsRef = getMissionsCollectionRef(restaurantId);
    const docRef = await addDoc(missionsRef, {
      ...mission,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await updateDoc(docRef, { id: docRef.id });

    clearMissionsCache(restaurantId);
    console.log(`🔄 Cache des missions invalidé après création dans le restaurant ${restaurantId}`);

    return { id: docRef.id };
  } catch (error) {
    console.error("❌ Erreur lors de la création de la mission:", error);
    throw error;
  }
};

export const getMission = async (id: string, restaurantId: string): Promise<Mission | null> => {
  try {
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (individualMissionCache[id] && (now - lastMissionsCacheUpdate) < MISSIONS_CACHE_DURATION) {
      console.log(`📦 Mission ${id} récupérée depuis le cache`);
      return individualMissionCache[id];
    }

    const missionRef = doc(getMissionsCollectionRef(restaurantId), id);
    const missionDoc = await getDoc(missionRef);
    
    if (missionDoc.exists()) {
      const mission = { id: missionDoc.id, ...missionDoc.data() } as Mission;
      
      // Mettre en cache
      individualMissionCache[id] = mission;
      if (Object.keys(individualMissionCache).length === 1) {
        lastMissionsCacheUpdate = now;
      }
      console.log(`💾 Mission ${id} mise en cache`);
      
      return mission;
    } else {
      return null;
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la mission:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (individualMissionCache[id]) {
      console.log(`🔄 Utilisation du cache de secours pour la mission ${id}`);
      return individualMissionCache[id];
    }
    
    throw error;
  }
};

export const getAllMissions = async (restaurantId: string): Promise<Mission[]> => {
  try {
    const now = Date.now();
    
    // Vérifier le cache d'abord
    const cachedMissions = missionsCache.get(restaurantId);
    if (cachedMissions && (now - lastMissionsCacheUpdate) < MISSIONS_CACHE_DURATION) {
      console.log(`📦 Liste des missions récupérée depuis le cache (${cachedMissions.length} missions) pour le restaurant ${restaurantId}`);
      return cachedMissions;
    }

    const missionsRef = getMissionsCollectionRef(restaurantId);
    const querySnapshot = await getDocs(missionsRef);
    
    const missions = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Mission));

    // Mettre en cache
    missionsCache.set(restaurantId, missions);
    lastMissionsCacheUpdate = now;
    
    // Mettre à jour le cache individuel aussi
    missions.forEach(mission => {
      individualMissionCache[mission.id] = mission;
    });
    
    console.log(`💾 Liste des missions mise en cache (${missions.length} missions) pour le restaurant ${restaurantId}`);
    return missions;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des missions:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    const cachedMissions = missionsCache.get(restaurantId);
    if (cachedMissions) {
      console.log(`🔄 Utilisation du cache de secours pour les missions (${cachedMissions.length} missions) du restaurant ${restaurantId}`);
      return cachedMissions;
    }
    
    throw error;
  }
};

export const updateMission = async (id: string, updates: Partial<Mission>, restaurantId: string) => {
  try {
    const missionRef = doc(getMissionsCollectionRef(restaurantId), id);
    await updateDoc(missionRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Invalider le cache après mise à jour
    clearMissionsCache(restaurantId);
    if (individualMissionCache[id]) {
      delete individualMissionCache[id];
    }
    console.log(`🔄 Cache des missions invalidé après mise à jour de ${id} dans le restaurant ${restaurantId}`);

    return { success: true };
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la mission:", error);
    throw error;
  }
};

export const deleteMission = async (id: string, restaurantId: string) => {
  try {
    console.log(`[MISSIONS] Début suppression de la mission ${id} du restaurant ${restaurantId}`);
    
    const batch = writeBatch(db);
    
    // 1. Supprimer la mission principale (les sous-collections seront supprimées manuellement)
    const missionRef = doc(getMissionsCollectionRef(restaurantId), id);
    
    // 2. Supprimer tous les participants dans la sous-collection
    const participantsRef = collection(missionRef, 'participants');
    const participantsSnapshot = await getDocs(participantsRef);
    
    console.log(`[MISSIONS] ${participantsSnapshot.docs.length} participants trouvés`);
    participantsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 3. Supprimer toutes les missions collectives dans la sous-collection
    const collectivesRef = collection(missionRef, 'collectives');
    const collectivesSnapshot = await getDocs(collectivesRef);
    
    console.log(`[MISSIONS] ${collectivesSnapshot.docs.length} missions collectives trouvées`);
    collectivesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 4. Supprimer la mission principale
    batch.delete(missionRef);
    
    // 5. Exécuter toutes les suppressions en une seule transaction
    await batch.commit();
    
    console.log(`[MISSIONS] ✅ Mission ${id} et toutes ses sous-collections supprimées avec succès du restaurant ${restaurantId}`);
    
    // Invalider le cache après suppression
    clearMissionsCache(restaurantId);
    if (individualMissionCache[id]) {
      delete individualMissionCache[id];
    }
    userMissionsCache = {};
    console.log('🔄 Cache complet des missions invalidé après suppression');
    
    return { 
      success: true, 
      deletedParticipants: participantsSnapshot.docs.length,
      deletedCollectives: collectivesSnapshot.docs.length 
    };
  } catch (error) {
    console.error(`[MISSIONS] ❌ Erreur lors de la suppression de la mission ${id}:`, error);
    throw error;
  }
};

// ====== ASSIGNATION DE MISSIONS (SOUS-COLLECTIONS) ======

export const assignMissionToUser = async (missionId: string, userId: string, restaurantId: string) => {
  try {
    // Vérifier que la mission existe
    const missionRef = doc(getMissionsCollectionRef(restaurantId), missionId);
    const missionDoc = await getDoc(missionRef);
    
    if (!missionDoc.exists()) {
      throw new Error("La mission n'existe pas");
    }
    
    // Référence à la sous-collection participants
    const participantsRef = collection(missionRef, 'participants');
    
    // Vérifier si cette mission est déjà assignée à cet utilisateur
    const q = query(participantsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { 
        success: true, 
        message: "Cette mission est déjà assignée à cet utilisateur",
        id: querySnapshot.docs[0].id
      };
    }
    
    // Créer une nouvelle assignation dans la sous-collection
    const docRef = await addDoc(participantsRef, {
      userId,
      status: "pending",
      progression: 0,
      currentValue: 0,
      dateAssigned: serverTimestamp(),
      isPartOfCollective: false
    });
    
    // Invalider le cache des missions utilisateur après assignation
    if (userMissionsCache[userId]) {
      delete userMissionsCache[userId];
    }
    console.log(`🔄 Cache des missions utilisateur ${userId} invalidé après assignation`);
    
    console.log(`Mission assignée avec l'ID: ${docRef.id}`);
    
    return { 
      success: true,
      id: docRef.id
    };
  } catch (error) {
    console.error("Erreur lors de l'assignation de la mission:", error);
    throw error;
  }
};

export const getUserMissions = async (userId: string, restaurantId: string): Promise<UserMissionParticipant[]> => {
  try {
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (userMissionsCache[userId] && (now - lastMissionsCacheUpdate) < MISSIONS_CACHE_DURATION) {
      console.log(`📦 Missions utilisateur ${userId} récupérées depuis le cache (${userMissionsCache[userId].length} missions)`);
      return userMissionsCache[userId];
    }
    
    // Récupérer toutes les missions du restaurant
    const allMissions = await getAllMissions(restaurantId);
    const userParticipations: UserMissionParticipant[] = [];
    
    // Parcourir chaque mission pour chercher les participations de l'utilisateur
    for (const mission of allMissions) {
      const missionRef = doc(getMissionsCollectionRef(restaurantId), mission.id);
      const participantsRef = collection(missionRef, 'participants');
      const q = query(participantsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        userParticipations.push({
          id: doc.id,
          missionId: mission.id,
          userId: data.userId,
          status: data.status,
          progression: data.progression,
          dateAssigned: data.dateAssigned,
          currentValue: data.currentValue,
          dateCompletion: data.dateCompletion,
          isPartOfCollective: data.isPartOfCollective,
          collectiveMissionId: data.collectiveMissionId
        } as UserMissionParticipant);
      });
    }

    // Mettre en cache
    userMissionsCache[userId] = userParticipations;
    console.log(`💾 Missions utilisateur ${userId} mises en cache (${userParticipations.length} missions)`);

    return userParticipations;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des missions de l'utilisateur:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (userMissionsCache[userId]) {
      console.log(`🔄 Utilisation du cache de secours pour les missions utilisateur ${userId}`);
      return userMissionsCache[userId];
    }
    
    throw error;
  }
};

export const updateUserMissionStatus = async (
  missionId: string,
  participantId: string,
  status: "pending" | "completed" | "failed",
  progression: number,
  restaurantId: string,
  currentValue?: number
) => {
  try {
    const missionRef = doc(getMissionsCollectionRef(restaurantId), missionId);
    const participantRef = doc(missionRef, 'participants', participantId);
    const participantDoc = await getDoc(participantRef);
    
    if (!participantDoc.exists()) {
      throw new Error("Cette assignation de mission n'existe pas");
    }
    
    const updateData: Partial<UserMissionParticipant> = {
      status,
      progression,
      ...(currentValue !== undefined ? { currentValue } : {}),
      ...(status === "completed" ? { dateCompletion: serverTimestamp() } : {})
    };
    
    await updateDoc(participantRef, updateData);
    
    // Invalider le cache des missions utilisateur après mise à jour du statut
    const participant = participantDoc.data() as UserMissionParticipant;
    if (userMissionsCache[participant.userId]) {
      delete userMissionsCache[participant.userId];
    }
    console.log(`🔄 Cache des missions utilisateur ${participant.userId} invalidé après mise à jour du statut`);
    
    // Si cette mission fait partie d'une mission collective, mettre à jour la progression collective
    if (participant.isPartOfCollective && participant.collectiveMissionId) {
      await updateCollectiveMissionProgress(missionId, participant.collectiveMissionId, restaurantId);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la mission:", error);
    throw error;
  }
};

export const updateUserMissionProgress = async (
  missionId: string,
  participantId: string,
  currentValue: number,
  restaurantId: string
) => {
  try {
    console.log(`📊 [DEBUG] updateUserMissionProgress appelée: mission=${missionId}, participant=${participantId}, currentValue=${currentValue}`);
    
    const missionRef = doc(getMissionsCollectionRef(restaurantId), missionId);
    const participantRef = doc(missionRef, 'participants', participantId);
    const participantDoc = await getDoc(participantRef);
    
    if (!participantDoc.exists()) {
      throw new Error("Cette assignation de mission n'existe pas");
    }
    
    const participant = participantDoc.data() as UserMissionParticipant;
    console.log(`📊 [DEBUG] Participant actuel:`, { 
      userId: participant.userId, 
      status: participant.status, 
      currentValue: participant.currentValue,
      progression: participant.progression 
    });
    
    // Vérifier si la mission était déjà complétée
    const wasAlreadyCompleted = participant.status === "completed";
    
    // Récupérer les détails de la mission pour obtenir targetValue
    const mission = await getMission(missionId, restaurantId);
    if (!mission) {
      throw new Error("Mission non trouvée");
    }
    
    console.log(`📊 [DEBUG] Mission details: titre="${mission.titre}", targetValue=${mission.targetValue}`);
    
    const targetValue = mission.targetValue || 100;
    const progressPercentage = Math.min(100, Math.round((currentValue / targetValue) * 100));
    const isCompleted = currentValue >= targetValue;
    
    console.log(`📊 [DEBUG] Calculs: targetValue=${targetValue}, progressPercentage=${progressPercentage}, isCompleted=${isCompleted}`);
    
    const updateData: Partial<UserMissionParticipant> = {
      currentValue,
      progression: progressPercentage,
      ...(isCompleted ? { 
        status: "completed" as const,
        dateCompletion: serverTimestamp() 
      } : {})
    };
    
    await updateDoc(participantRef, updateData);
    if (isCompleted) {
      // Remove userId field then delete participant doc post-completion
      await updateDoc(participantRef, { userId: deleteField() });
      await deleteDoc(participantRef);
      console.log(`📄 Participant ${participantId} cleaned up after mission completion`);
    }

    // Invalider le cache des missions utilisateur après mise à jour de la progression
    if (userMissionsCache[participant.userId]) {
      delete userMissionsCache[participant.userId];
    }
    console.log(`🔄 Cache des missions utilisateur ${participant.userId} invalidé après mise à jour de progression`);
    
    // Si la mission vient d'être complétée, attribuer des points
    if (isCompleted && !wasAlreadyCompleted && mission.points) {
      try {
        await updatePointsAndLevel(participant.userId, mission.points);
        console.log(`[POINTS] ✅ ${mission.points} points attribués à l'utilisateur ${participant.userId} pour la mission "${mission.titre}"`);
      } catch (pointsError) {
        console.error(`[POINTS] ❌ Erreur lors de l'attribution des points:`, pointsError);
      }
    }
    
    // Si cette mission fait partie d'une mission collective, mettre à jour la progression collective
    if (participant.isPartOfCollective && participant.collectiveMissionId) {
      await updateCollectiveMissionProgress(missionId, participant.collectiveMissionId, restaurantId);
    }
    
    return { 
      success: true, 
      currentValue, 
      progressPercentage, 
      isCompleted,
      pointsAwarded: (isCompleted && !wasAlreadyCompleted && mission.points) ? mission.points : 0
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression:", error);
    throw error;
  }
};

// ====== MISSIONS COLLECTIVES (SOUS-COLLECTIONS) ======

export const createCollectiveMission = async (
  missionId: string,
  userIds: string[],
  targetValue: number,
  restaurantId: string
) => {
  try {
    // Vérifier que la mission existe
    const missionRef = doc(getMissionsCollectionRef(restaurantId), missionId);
    const missionDoc = await getDoc(missionRef);
    
    if (!missionDoc.exists()) {
      throw new Error("La mission n'existe pas");
    }
    
    const batch = writeBatch(db);
    const participantIds: string[] = [];
    
    // 1. Créer ou mettre à jour les participants pour chaque utilisateur
    const participantsRef = collection(missionRef, 'participants');
    
    for (const userId of userIds) {
      // Vérifier si ce participant existe déjà
      const q = query(participantsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Créer un nouveau participant
        const newParticipantRef = doc(participantsRef);
        batch.set(newParticipantRef, {
          userId,
          status: "pending",
          progression: 0,
          currentValue: 0,
          dateAssigned: serverTimestamp(),
          isPartOfCollective: true
        });
        participantIds.push(newParticipantRef.id);
      } else {
        // Mettre à jour le participant existant
        const participantDoc = querySnapshot.docs[0];
        batch.update(participantDoc.ref, {
          isPartOfCollective: true
        });
        participantIds.push(participantDoc.id);
      }
    }
    
    // 2. Créer la mission collective dans la sous-collection
    const collectivesRef = collection(missionRef, 'collectives');
    const newCollectiveRef = doc(collectivesRef);
    
    batch.set(newCollectiveRef, {
      targetValue,
      currentValue: 0,
      isCompleted: false,
      dateCreated: serverTimestamp(),
      participantIds
    });
    
    // 3. Mettre à jour les participants avec l'ID de la mission collective
    for (const participantId of participantIds) {
      const participantRef = doc(participantsRef, participantId);
      batch.update(participantRef, {
        collectiveMissionId: newCollectiveRef.id
      });
    }
    
    await batch.commit();
    
    // Invalider le cache après création de la mission collective
    for (const userId of userIds) {
      if (userMissionsCache[userId]) {
        delete userMissionsCache[userId];
      }
    }
    console.log(`🔄 Cache des missions utilisateurs invalidé après création de mission collective`);
    
    return { id: newCollectiveRef.id, success: true };
  } catch (error) {
    console.error("Erreur lors de la création de la mission collective:", error);
    throw error;
  }
};

export const updateCollectiveMissionProgress = async (missionId: string, collectiveId: string, restaurantId: string) => {
  try {
    // Récupérer la mission collective
    const missionRef = doc(getMissionsCollectionRef(restaurantId), missionId);
    const collectiveRef = doc(missionRef, 'collectives', collectiveId);
    const collectiveDoc = await getDoc(collectiveRef);
    
    if (!collectiveDoc.exists()) {
      throw new Error("La mission collective n'existe pas");
    }
    
    const collective = collectiveDoc.data() as CollectiveMissionData;
    
    // Récupérer tous les participants liés à cette mission collective
    const participantsRef = collection(missionRef, 'participants');
    const q = query(participantsRef, where("collectiveMissionId", "==", collectiveId));
    const querySnapshot = await getDocs(q);
    
    // Calculer la progression totale
    let totalValue = 0;
    querySnapshot.docs.forEach(doc => {
      const participant = doc.data() as UserMissionParticipant;
      totalValue += participant.currentValue || 0;
    });
    
    // Mettre à jour la mission collective
    const isCompleted = totalValue >= collective.targetValue;
    
    await updateDoc(collectiveRef, {
      currentValue: totalValue,
      isCompleted,
      ...(isCompleted && !collective.isCompleted ? { dateCompleted: serverTimestamp() } : {})
    });
    
    console.log(`🔄 Mission collective mise à jour - Valeur: ${totalValue}/${collective.targetValue}`);
    
    return { success: true, currentValue: totalValue, isCompleted };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression de la mission collective:", error);
    throw error;
  }
};

export const getCollectiveMissions = async (missionId: string, restaurantId: string): Promise<CollectiveMissionData[]> => {
  try {
    const missionRef = doc(getMissionsCollectionRef(restaurantId), missionId);
    const collectivesRef = collection(missionRef, 'collectives');
    const querySnapshot = await getDocs(collectivesRef);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as CollectiveMissionData));
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des missions collectives:", error);
    throw error;
  }
};

export const getUserCollectiveMissions = async (userId: string, restaurantId: string): Promise<CollectiveMissionData[]> => {
  try {
    const allMissions = await getAllMissions(restaurantId);
    const userCollectives: CollectiveMissionData[] = [];
    
    for (const mission of allMissions) {
      const missionRef = doc(getMissionsCollectionRef(restaurantId), mission.id);
      const participantsRef = collection(missionRef, 'participants');
      const q = query(
        participantsRef, 
        where("userId", "==", userId),
        where("isPartOfCollective", "==", true)
      );
      const participantsSnapshot = await getDocs(q);
      
      for (const participantDoc of participantsSnapshot.docs) {
        const participant = participantDoc.data() as UserMissionParticipant;
        if (participant.collectiveMissionId) {
          const collectiveRef = doc(missionRef, 'collectives', participant.collectiveMissionId);
          const collectiveDoc = await getDoc(collectiveRef);
          if (collectiveDoc.exists()) {
            userCollectives.push({
              id: collectiveDoc.id,
              ...collectiveDoc.data(),
              missionId: mission.id
            } as CollectiveMissionData & { missionId: string });
          }
        }
      }
    }
    
    return userCollectives;
  } catch (error) {
    console.error("Erreur lors de la récupération des missions collectives de l'utilisateur:", error);
    throw error;
  }
};

// ====== FONCTIONS UTILITAIRES ======

export const getMissionPlatsForUser = async (userId: string, restaurantId: string): Promise<string[]> => {
  try {
    // Récupérer les missions de l'utilisateur via les sous-collections
    const userMissions = await getUserMissions(userId, restaurantId);
    const platIds: string[] = [];
    
    // Pour chaque mission de l'utilisateur, récupérer le plat associé
    for (const userMission of userMissions) {
      try {
        const mission = await getMission(userMission.missionId!, restaurantId);
        if (mission?.plat?.id) {
          platIds.push(mission.plat.id);
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération de la mission ${userMission.missionId}:`, error);
      }
    }
    
    // Supprimer les doublons
    const uniquePlatIds = [...new Set(platIds)];
    
    return uniquePlatIds;
  } catch (error) {
    console.error(`[MISSIONS] ❌ Erreur lors de la récupération des plats pour l'utilisateur ${userId}:`, error);
    return [];
  }
};

export const updateMissionsProgressFromDishes = async (
  userId: string,
  validatedDishes: { plat: { id?: string; name: string; price: number }; quantite: number }[],
  restaurantId: string
) => {
  try {
    console.log(`🍽️ [DEBUG] updateMissionsProgressFromDishes appelée pour userId: ${userId}`);
    console.log(`🍽️ [DEBUG] Plats reçus:`, validatedDishes.map(d => ({ name: d.plat.name, id: d.plat.id, quantite: d.quantite })));
    
    const dishesWithId = validatedDishes.filter(dish => dish.plat.id);
    
    if (dishesWithId.length === 0) {
      console.log(`🍽️ [DEBUG] Aucun plat avec ID valide trouvé`);
      return {
        success: true,
        updatedMissions: 0,
        processedDishes: 0,
        message: "Aucun plat avec ID valide à traiter"
      };
    }

    console.log(`🍽️ [DEBUG] ${dishesWithId.length} plats avec ID valide trouvés`);

    // Récupérer les participations de l'utilisateur une seule fois
    const userMissions = await getUserMissions(userId, restaurantId);
    console.log(`🍽️ [DEBUG] ${userMissions.length} missions utilisateur trouvées`);
    
    let updatedMissionsCount = 0;
    let totalPointsAwarded = 0;
    let completedMissions: string[] = [];

    // Créer un map des plats validés pour un accès rapide
    const dishMap = new Map<string, number>();
    dishesWithId.forEach(dish => {
      const platId = dish.plat.id!;
      dishMap.set(platId, (dishMap.get(platId) || 0) + dish.quantite);
    });
    console.log(`🍽️ [DEBUG] Map des plats créée:`, Array.from(dishMap.entries()));

    // Traiter chaque mission de l'utilisateur
    for (const userMission of userMissions) {
      if (userMission.status === "completed") {
        console.log(`🍽️ [DEBUG] Mission ${userMission.missionId} déjà complétée, ignorée`);
        continue;
      }

      // Récupérer les détails de la mission
      const mission = await getMission(userMission.missionId!, restaurantId);
      if (!mission || !mission.plat?.id) {
        console.log(`🍽️ [DEBUG] Mission ${userMission.missionId} non trouvée ou sans plat ID`);
        continue;
      }

      console.log(`🍽️ [DEBUG] Traitement mission "${mission.titre}" avec plat ID: ${mission.plat.id}`);

      // Vérifier si cette mission correspond à un plat validé
      const platQuantity = dishMap.get(mission.plat.id);
      if (!platQuantity) {
        console.log(`🍽️ [DEBUG] Aucune quantité trouvée pour plat ${mission.plat.id} dans cette commande`);
        continue;
      }

      console.log(`🍽️ [DEBUG] Quantité trouvée: ${platQuantity} pour mission "${mission.titre}"`);

      try {
        const oldCurrentValue = userMission.currentValue || 0;
        const currentValue = oldCurrentValue + platQuantity;
        
        console.log(`🍽️ [DEBUG] Ancienne valeur: ${oldCurrentValue}, nouvelle valeur: ${currentValue}`);
        
        // Mettre à jour la progression (gère automatiquement les missions collectives)
        const result = await updateUserMissionProgress(
          userMission.missionId!,
          userMission.id,
          currentValue,
          restaurantId
        );
        
        console.log(`🍽️ [DEBUG] Résultat mise à jour:`, result);
        
        updatedMissionsCount++;
        if (result.pointsAwarded > 0) {
          totalPointsAwarded += result.pointsAwarded;
          completedMissions.push(mission.titre);
        }
      } catch (error) {
        console.error(`🍽️ [ERROR] Erreur lors de la mise à jour de la mission ${mission.id}:`, error);
      }
    }
    
    return {
      success: true,
      updatedMissions: updatedMissionsCount,
      completedMissions: completedMissions.length,
      totalPointsAwarded,
      completedMissionTitles: completedMissions,
      processedDishes: dishesWithId.length,
      message: `${updatedMissionsCount} missions mises à jour, ${completedMissions.length} complétées, ${totalPointsAwarded} points attribués pour ${dishesWithId.length} plats traités`
    };
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour des missions depuis les plats:", error);
    throw error;
  }
};

// ====== ANALYTICS ET REPORTING ======

export const getMissionProgressAnalytics = async (userId: string, restaurantId: string) => {
  try {
    const userMissions = await getUserMissions(userId, restaurantId);
    
    // Statistiques générales
    const totalMissions = userMissions.length;
    const completedMissions = userMissions.filter(m => m.status === "completed").length;
    const pendingMissions = userMissions.filter(m => m.status === "pending").length;
    const failedMissions = userMissions.filter(m => m.status === "failed").length;
    
    // Progression moyenne
    const totalProgress = userMissions.reduce((sum, mission) => sum + (mission.progression || 0), 0);
    const averageProgress = totalMissions > 0 ? Math.round(totalProgress / totalMissions) : 0;
    
    // Missions avec plats associés
    const missionsWithDetails = await Promise.all(
      userMissions.map(async (userMission) => {
        try {
          const mission = await getMission(userMission.missionId!, restaurantId);
          return { userMission, mission };
        } catch (error) {
          console.warn('Error fetching mission:', error);
          return { userMission, mission: null };
        }
      })
    );
    
    const missionsWithDishes = missionsWithDetails.filter(
      ({ mission }) => mission && mission.plat && mission.plat.id
    ).length;
    
    // Points totaux gagnés
    const totalPointsEarned = missionsWithDetails
      .filter(({ userMission }) => userMission.status === "completed")
      .reduce((sum, { mission }) => sum + (mission?.points || 0), 0);
    
    return {
      totalMissions,
      completedMissions,
      pendingMissions,
      failedMissions,
      averageProgress,
      missionsWithDishes,
      totalPointsEarned,
      completionRate: totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0
    };
  } catch (error) {
    console.error("Erreur lors du calcul des analytics des missions:", error);
    throw error;
  }
};

export const getMissionProgressHistory = async (missionId: string, participantId: string, restaurantId: string) => {
  try {
    const missionRef = doc(getMissionsCollectionRef(restaurantId), missionId);
    const participantRef = doc(missionRef, 'participants', participantId);
    const participantDoc = await getDoc(participantRef);
    
    if (!participantDoc.exists()) {
      throw new Error("Participant non trouvé");
    }
    
    const participant = participantDoc.data() as UserMissionParticipant;
    const mission = await getMission(missionId, restaurantId);
    
    return {
      participant,
      mission,
      currentProgress: participant.progression || 0,
      currentValue: participant.currentValue || 0,
      lastUpdated: participant.dateAssigned || new Date()
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    throw error;
  }
};

export default {
  createMission,
  getMission,
  getAllMissions,
  updateMission,
  deleteMission,
  assignMissionToUser,
  getUserMissions,
  updateUserMissionStatus,
  updateUserMissionProgress,
  createCollectiveMission,
  updateCollectiveMissionProgress,
  getCollectiveMissions,
  getUserCollectiveMissions,
  getMissionPlatsForUser,
  updateMissionsProgressFromDishes,
  getMissionProgressAnalytics,
  getMissionProgressHistory,
  // Cache utilities
  clearMissionsCache,
  getMissionsCacheInfo
};
