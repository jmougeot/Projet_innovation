import { db } from './firebaseConfig';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';

// Import function to update user points and level
import { updatePointsAndLevel } from './firebaseUser';

// Types importés des interfaces
import type { Mission, MissionAssignment } from '../mission/types';

// Cache local pour les missions - Durée courte car les missions changent modérément
let missionsCache: Mission[] | null = null;
let individualMissionCache: { [missionId: string]: Mission } = {};
let userMissionsCache: { [userId: string]: UserMission[] } = {};
let collectiveMissionsCache: CollectiveMission[] | null = null;
let lastMissionsCacheUpdate = 0;
const MISSIONS_CACHE_DURATION = 60000; // 1 minute - Les missions changent modérément

// Fonctions utilitaires de cache pour les missions
export const clearMissionsCache = () => {
  missionsCache = null;
  individualMissionCache = {};
  userMissionsCache = {};
  collectiveMissionsCache = null;
  lastMissionsCacheUpdate = 0;
  console.log('🗑️ Cache des missions vidé');
};

export const getMissionsCacheInfo = () => {
  const now = Date.now();
  const timeLeft = missionsCache ? Math.max(0, MISSIONS_CACHE_DURATION - (now - lastMissionsCacheUpdate)) : 0;
  return {
    isActive: missionsCache !== null,
    allMissionsCount: missionsCache?.length || 0,
    individualMissionsCount: Object.keys(individualMissionCache).length,
    userMissionsCount: Object.keys(userMissionsCache).length,
    collectiveMissionsCount: collectiveMissionsCache?.length || 0,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: MISSIONS_CACHE_DURATION,
    durationFormatted: `${MISSIONS_CACHE_DURATION / 60000}min`
  };
};

// Pour les user missions individuelles
interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  status: "pending" | "completed" | "failed";
  progression: number; // Peut être un pourcentage ou une valeur absolue selon la mission
  currentValue?: number; // Valeur actuelle pour les missions avec targetValue
  dateAssigned: Timestamp;
  dateCompletion?: Timestamp | ReturnType<typeof serverTimestamp>;
  isPartOfCollective?: boolean; // Indique si cette mission fait partie d'une mission collective
  collectiveMissionId?: string; // ID de la mission collective si applicable
}

// Pour suivre les missions collectives
interface CollectiveMission {
  id: string;
  missionId: string; // Référence à la mission principale
  userIds: string[]; // Les utilisateurs participants
  targetValue: number; // Valeur cible à atteindre collectivement
  currentValue: number; // Valeur actuelle
  isCompleted: boolean;
  dateCreated: Timestamp;
  dateCompleted?: Timestamp;
}

// ---- MISSIONS DE BASE ----

// Créer une nouvelle mission
export const createMission = async (mission: Omit<Mission, 'id'>) => {
  try {
    const missionsRef = collection(db, 'missions');
    const docRef = await addDoc(missionsRef, {
      ...mission,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await updateDoc(docRef, { id: docRef.id });

    // Invalider le cache après création
    missionsCache = null;
    console.log('🔄 Cache des missions invalidé après création');

    return { id: docRef.id };
  } catch (error) {
    console.error("❌ Erreur lors de la création de la mission:", error);
    throw error;
  }
};

// Récupérer une mission par ID
export const getMission = async (id: string): Promise<Mission | null> => {
  try {
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (individualMissionCache[id] && (now - lastMissionsCacheUpdate) < MISSIONS_CACHE_DURATION) {
      console.log(`📦 Mission ${id} récupérée depuis le cache`);
      return individualMissionCache[id];
    }

    const missionRef = doc(db, 'missions', id);
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

// Récupérer toutes les missions
export const getAllMissions = async (): Promise<Mission[]> => {
  try {
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (missionsCache && (now - lastMissionsCacheUpdate) < MISSIONS_CACHE_DURATION) {
      console.log(`📦 Liste des missions récupérée depuis le cache (${missionsCache.length} missions)`);
      return missionsCache;
    }

    const missionsRef = collection(db, 'missions');
    const querySnapshot = await getDocs(missionsRef);
    
    const missions = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Mission));

    // Mettre en cache
    missionsCache = missions;
    lastMissionsCacheUpdate = now;
    
    // Mettre à jour le cache individuel aussi
    missions.forEach(mission => {
      individualMissionCache[mission.id] = mission;
    });
    
    console.log(`💾 Liste des missions mise en cache (${missions.length} missions)`);
    return missions;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des missions:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (missionsCache) {
      console.log(`🔄 Utilisation du cache de secours pour les missions (${missionsCache.length} missions)`);
      return missionsCache;
    }
    
    throw error;
  }
};

// Mettre à jour une mission
export const updateMission = async (id: string, updates: Partial<Mission>) => {
  try {
    const missionRef = doc(db, 'missions', id);
    await updateDoc(missionRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Invalider le cache après mise à jour
    missionsCache = null;
    if (individualMissionCache[id]) {
      delete individualMissionCache[id];
    }
    console.log(`🔄 Cache des missions invalidé après mise à jour de ${id}`);

    return { success: true };
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la mission:", error);
    throw error;
  }
};

// Supprimer une mission
export const deleteMission = async (id: string) => {
  try {
    console.log(`[MISSIONS] Début suppression de la mission ${id}`);
    
    const batch = writeBatch(db);
    
    // 1. Supprimer la mission principale
    const missionRef = doc(db, 'missions', id);
    batch.delete(missionRef);
    console.log(`[MISSIONS] Mission principale ${id} marquée pour suppression`);
    
    // 2. Supprimer toutes les assignations individuelles liées à cette mission
    const userMissionsRef = collection(db, 'user_missions');
    const userMissionsQuery = query(userMissionsRef, where("missionId", "==", id));
    const userMissionsSnapshot = await getDocs(userMissionsQuery);
    
    console.log(`[MISSIONS] ${userMissionsSnapshot.docs.length} assignations individuelles trouvées`);
    userMissionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 3. Supprimer toutes les missions collectives liées à cette mission
    const collectiveMissionsRef = collection(db, 'collective_missions');
    const collectiveMissionsQuery = query(collectiveMissionsRef, where("missionId", "==", id));
    const collectiveMissionsSnapshot = await getDocs(collectiveMissionsQuery);
    
    console.log(`[MISSIONS] ${collectiveMissionsSnapshot.docs.length} missions collectives trouvées`);
    collectiveMissionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 4. Exécuter toutes les suppressions en une seule transaction
    await batch.commit();
    
    console.log(`[MISSIONS] ✅ Mission ${id} et toutes ses données liées supprimées avec succès`);
    
    // Invalider le cache après suppression
    missionsCache = null;
    if (individualMissionCache[id]) {
      delete individualMissionCache[id];
    }
    // Invalider le cache des missions utilisateurs car les assignations ont été supprimées
    userMissionsCache = {};
    collectiveMissionsCache = null;
    console.log('🔄 Cache complet des missions invalidé après suppression');
    
    return { 
      success: true, 
      deletedUserMissions: userMissionsSnapshot.docs.length,
      deletedCollectiveMissions: collectiveMissionsSnapshot.docs.length 
    };
  } catch (error) {
    console.error(`[MISSIONS] ❌ Erreur lors de la suppression de la mission ${id}:`, error);
    throw error;
  }
};

// ---- ASSIGNATION DE MISSIONS ----

// Assigner une mission à un utilisateur
export const assignMissionToUser = async (missionId: string, userId: string) => {
  try {
    // Vérifier que la mission existe
    const missionRef = doc(db, 'missions', missionId);
    const missionDoc = await getDoc(missionRef);
    
    if (!missionDoc.exists()) {
      throw new Error("La mission n'existe pas");
    }
    
    const userMissionRef = collection(db, 'user_missions');
    
    // Vérifier si cette mission est déjà assignée à cet utilisateur
    const q = query(
      userMissionRef, 
      where("userId", "==", userId), 
      where("missionId", "==", missionId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { 
        success: true, 
        message: "Cette mission est déjà assignée à cet utilisateur",
        id: querySnapshot.docs[0].id
      };
    }
    
    // Créer une nouvelle assignation
    const docRef =    await addDoc(userMissionRef, {
      userId,
      missionId,
      status: "pending",
      progression: 0,
      currentValue: 0, // Initialiser la valeur actuelle à 0
      dateAssigned: serverTimestamp(),
      isPartOfCollective: false
    });
    
    // Invalider le cache des missions utilisateur après assignation
    if (userMissionsCache[userId]) {
      delete userMissionsCache[userId];
    }
    console.log(`🔄 Cache des missions utilisateur ${userId} invalidé après assignation`);
    
    console.log(`Mission individuelle créée avec l'ID: ${docRef.id}`);
    
    return { 
      success: true,
      id: docRef.id
    };
  } catch (error) {
    console.error("Erreur lors de l'assignation de la mission:", error);
    throw error;
  }
};

// Récupérer les missions d'un utilisateur
export const getUserMissions = async (userId: string): Promise<UserMission[]> => {
  try {
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (userMissionsCache[userId] && (now - lastMissionsCacheUpdate) < MISSIONS_CACHE_DURATION) {
      console.log(`📦 Missions utilisateur ${userId} récupérées depuis le cache (${userMissionsCache[userId].length} missions)`);
      return userMissionsCache[userId];
    }
    
    const userMissionsRef = collection(db, 'user_missions');
    const q = query(userMissionsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const userMissions = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as UserMission));

    // Mettre en cache
    userMissionsCache[userId] = userMissions;
    if (Object.keys(userMissionsCache).length === 1) {
      lastMissionsCacheUpdate = now;
    }
    console.log(`💾 Missions utilisateur ${userId} mises en cache (${userMissions.length} missions)`);

    return userMissions;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des missions de l'utilisateur:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (userMissionsCache[userId]) {
      console.log(`🔄 Utilisation du cache de secours pour les missions utilisateur ${userId} (${userMissionsCache[userId].length} missions)`);
      return userMissionsCache[userId];
    }
    
    throw error;
  }
};


// Mettre à jour le statut d'une mission pour un utilisateur
export const updateUserMissionStatus = async (
  userMissionId: string, 
  status: "pending" | "completed" | "failed",
  progression: number,
  currentValue?: number // Valeur absolue optionnelle
) => {
  try {
    const userMissionRef = doc(db, 'user_missions', userMissionId);
    const userMissionDoc = await getDoc(userMissionRef);
    
    if (!userMissionDoc.exists()) {
      throw new Error("Cette assignation de mission n'existe pas");
    }
    
    const updateData: Partial<UserMission> = {
      status,
      progression,
      ...(currentValue !== undefined ? { currentValue } : {}),
      ...(status === "completed" ? { dateCompletion: serverTimestamp() } : {})
    };
    
    await updateDoc(userMissionRef, updateData);
    
    // Invalider le cache des missions utilisateur après mise à jour du statut
    const userMission = userMissionDoc.data() as UserMission;
    if (userMissionsCache[userMission.userId]) {
      delete userMissionsCache[userMission.userId];
    }
    console.log(`🔄 Cache des missions utilisateur ${userMission.userId} invalidé après mise à jour du statut`);
    
    // Si cette mission fait partie d'une mission collective, mettre à jour la progression collective
    if (userMission.isPartOfCollective && userMission.collectiveMissionId) {
      await updateCollectiveMissionProgress(userMission.collectiveMissionId);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la mission:", error);
    throw error;
  }
};

// Mettre à jour la progression d'une mission avec une valeur absolue
export const updateUserMissionProgress = async (
  userMissionId: string,
  currentValue: number
) => {
  try {
    const userMissionRef = doc(db, 'user_missions', userMissionId);
    const userMissionDoc = await getDoc(userMissionRef);
    
    if (!userMissionDoc.exists()) {
      throw new Error("Cette assignation de mission n'existe pas");
    }
    
    const userMission = userMissionDoc.data() as UserMission;
    
    // Vérifier si la mission était déjà complétée
    const wasAlreadyCompleted = userMission.status === "completed";
    
    // Récupérer les détails de la mission pour obtenir targetValue
    const mission = await getMission(userMission.missionId);
    if (!mission) {
      throw new Error("Mission non trouvée");
    }
    
    const targetValue = mission.targetValue || 100;
    const progressPercentage = Math.min(100, Math.round((currentValue / targetValue) * 100));
    const isCompleted = currentValue >= targetValue;
    
    const updateData: Partial<UserMission> = {
      currentValue,
      progression: progressPercentage,
      ...(isCompleted ? { 
        status: "completed" as const,
        dateCompletion: serverTimestamp() 
      } : {})
    };
    
    await updateDoc(userMissionRef, updateData);
    
    // Invalider le cache des missions utilisateur après mise à jour de la progression
    if (userMissionsCache[userMission.userId]) {
      delete userMissionsCache[userMission.userId];
    }
    console.log(`🔄 Cache des missions utilisateur ${userMission.userId} invalidé après mise à jour de progression`);
    
    // Si la mission vient d'être complétée (pas déjà complétée avant), attribuer des points
    if (isCompleted && !wasAlreadyCompleted && mission.points) {
      try {
        await updatePointsAndLevel(userMission.userId, mission.points);
        console.log(`[POINTS] ✅ ${mission.points} points attribués à l'utilisateur ${userMission.userId} pour la mission "${mission.titre}"`);
      } catch (pointsError) {
        console.error(`[POINTS] ❌ Erreur lors de l'attribution des points:`, pointsError);
        // Ne pas faire échouer la mission si l'attribution des points échoue
      }
    }
    
    // Si cette mission fait partie d'une mission collective, mettre à jour la progression collective
    if (userMission.isPartOfCollective && userMission.collectiveMissionId) {
      await updateCollectiveMissionProgress(userMission.collectiveMissionId);
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

// ---- MISSIONS COLLECTIVES ----

// Créer une mission collective
export const createCollectiveMission = async (
  missionId: string,
  userIds: string[],
  targetValue: number
) => {
  try {
    // Vérifier que la mission existe
    const missionRef = doc(db, 'missions', missionId);
    const missionDoc = await getDoc(missionRef);
    
    if (!missionDoc.exists()) {
      throw new Error("La mission n'existe pas");
    }
    
    const batch = writeBatch(db);
    
    // 1. Créer la mission collective
    const collectiveMissionsRef = collection(db, 'collective_missions');
    const newCollectiveRef = doc(collectiveMissionsRef);
    
    batch.set(newCollectiveRef, {
      missionId,
      userIds,
      targetValue,
      currentValue: 0,
      isCompleted: false,
      dateCreated: serverTimestamp()
    });
    
    // 2. Créer ou mettre à jour les missions individuelles pour chaque utilisateur
    const userMissionsRef = collection(db, 'user_missions');
    
    for (const userId of userIds) {
      // Vérifier si cette mission est déjà assignée à l'utilisateur
      const q = query(
        userMissionsRef, 
        where("userId", "==", userId), 
        where("missionId", "==", missionId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Créer une nouvelle assignation
        const newUserMissionRef = doc(userMissionsRef);
        batch.set(newUserMissionRef, {
          userId,
          missionId,
          status: "pending",
          progression: 0,
          currentValue: 0, // Initialiser la valeur actuelle à 0
          dateAssigned: serverTimestamp(),
          isPartOfCollective: true,
          collectiveMissionId: newCollectiveRef.id
        });
      } else {
        // Mettre à jour l'assignation existante
        const userMissionDoc = querySnapshot.docs[0];
        batch.update(userMissionDoc.ref, {
          isPartOfCollective: true,
          collectiveMissionId: newCollectiveRef.id
        });
      }
    }
    
    await batch.commit();
    
    // Invalider le cache après création de la mission collective
    collectiveMissionsCache = null;
    // Invalider le cache des missions utilisateur pour tous les utilisateurs impliqués
    for (const userId of userIds) {
      if (userMissionsCache[userId]) {
        delete userMissionsCache[userId];
      }
    }
    console.log(`🔄 Cache des missions collectives et utilisateurs invalidé après création de mission collective`);
    
    return { id: newCollectiveRef.id, success: true };
  } catch (error) {
    console.error("Erreur lors de la création de la mission collective:", error);
    throw error;
  }
};

// Mettre à jour la progression d'une mission collective
export const updateCollectiveMissionProgress = async (collectiveMissionId: string) => {
  try {
    // Récupérer la mission collective
    const collectiveMissionRef = doc(db, 'collective_missions', collectiveMissionId);
    const collectiveMissionDoc = await getDoc(collectiveMissionRef);
    
    if (!collectiveMissionDoc.exists()) {
      throw new Error("La mission collective n'existe pas");
    }
    
    const collectiveMission = collectiveMissionDoc.data() as CollectiveMission;
    
    // Récupérer toutes les missions individuelles liées
    const userMissionsRef = collection(db, 'user_missions');
    const q = query(
      userMissionsRef, 
      where("collectiveMissionId", "==", collectiveMissionId)
    );
    const querySnapshot = await getDocs(q);
    
    // Calculer la progression totale
    let totalValue = 0;
    querySnapshot.docs.forEach(doc => {
      const userMission = doc.data() as UserMission;
      // Utiliser currentValue si disponible, sinon utiliser progression comme valeur absolue
      totalValue += userMission.currentValue || userMission.progression;
    });
    
    // Mettre à jour la mission collective
    const isCompleted = totalValue >= collectiveMission.targetValue;
    
    await updateDoc(collectiveMissionRef, {
      currentValue: totalValue,
      isCompleted,
      ...(isCompleted && !collectiveMission.isCompleted ? { dateCompleted: serverTimestamp() } : {})
    });
    
    // Invalider le cache des missions collectives après mise à jour
    collectiveMissionsCache = null;
    console.log(`🔄 Cache des missions collectives invalidé après mise à jour de progression`);
    
    return { success: true, currentValue: totalValue, isCompleted };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression de la mission collective:", error);
    throw error;
  }
};

// Récupérer les missions collectives
export const getCollectiveMissions = async (): Promise<CollectiveMission[]> => {
  try {
    const now = Date.now();
    
    // Vérifier le cache d'abord
    if (collectiveMissionsCache && (now - lastMissionsCacheUpdate) < MISSIONS_CACHE_DURATION) {
      console.log(`📦 Missions collectives récupérées depuis le cache (${collectiveMissionsCache.length} missions)`);
      return collectiveMissionsCache;
    }
    
    const collectiveMissionsRef = collection(db, 'collective_missions');
    const querySnapshot = await getDocs(collectiveMissionsRef);
    
    const missions = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as CollectiveMission));
    
    // Mettre en cache les résultats
    collectiveMissionsCache = missions;
    lastMissionsCacheUpdate = now;
    console.log(`💾 Missions collectives mises en cache (${missions.length} missions)`);
    
    return missions;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des missions collectives:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (collectiveMissionsCache) {
      console.log(`🔄 Utilisation du cache de secours pour les missions collectives (${collectiveMissionsCache.length} missions)`);
      return collectiveMissionsCache;
    }
    
    throw error;
  }
};

// Récupérer les missions collectives d'un utilisateur
export const getUserCollectiveMissions = async (userId: string): Promise<CollectiveMission[]> => {
  try {
    const collectiveMissionsRef = collection(db, 'collective_missions');
    const q = query(collectiveMissionsRef, where("userIds", "array-contains", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as CollectiveMission));
  } catch (error) {
    console.error("Erreur lors de la récupération des missions collectives de l'utilisateur:", error);
    throw error;
  }
};

// Ajouter un utilisateur à une mission collective
export const addUserToCollectiveMission = async (
  collectiveMissionId: string, 
  userId: string
) => {
  try {
    // Récupérer la mission collective
    const collectiveMissionRef = doc(db, 'collective_missions', collectiveMissionId);
    const collectiveMissionDoc = await getDoc(collectiveMissionRef);
    
    if (!collectiveMissionDoc.exists()) {
      throw new Error("La mission collective n'existe pas");
    }
    
    const collectiveMission = collectiveMissionDoc.data() as CollectiveMission;
    
    // Vérifier si l'utilisateur est déjà dans la mission collective
    if (collectiveMission.userIds.includes(userId)) {
      return { success: true, message: "L'utilisateur fait déjà partie de cette mission collective" };
    }
    
    const batch = writeBatch(db);
    
    // Ajouter l'utilisateur à la mission collective
    batch.update(collectiveMissionRef, {
      userIds: arrayUnion(userId)
    });
    
    // Créer une mission individuelle pour cet utilisateur
    const userMissionsRef = collection(db, 'user_missions');
    const newUserMissionRef = doc(userMissionsRef);
    
    batch.set(newUserMissionRef, {
      userId,
      missionId: collectiveMission.missionId,
      status: "pending",
      progression: 0,
      currentValue: 0, // Initialiser la valeur actuelle à 0
      dateAssigned: serverTimestamp(),
      isPartOfCollective: true,
      collectiveMissionId
    });
    
    await batch.commit();
    
    // Invalider le cache après ajout d'utilisateur à la mission collective
    collectiveMissionsCache = null;
    if (userMissionsCache[userId]) {
      delete userMissionsCache[userId];
    }
    console.log(`🔄 Cache des missions collectives et utilisateur ${userId} invalidé après ajout`);
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'utilisateur à la mission collective:", error);
    throw error;
  }
};

// Supprimer un utilisateur d'une mission collective
export const removeUserFromCollectiveMission = async (
  collectiveMissionId: string,
  userId: string
) => {
  try {
    const batch = writeBatch(db);
    
    // Retirer l'utilisateur de la mission collective
    const collectiveMissionRef = doc(db, 'collective_missions', collectiveMissionId);
    batch.update(collectiveMissionRef, {
      userIds: arrayRemove(userId)
    });
    
    // Trouver et mettre à jour ou supprimer la mission individuelle associée
    const userMissionsRef = collection(db, 'user_missions');
    const q = query(
      userMissionsRef,
      where("userId", "==", userId),
      where("collectiveMissionId", "==", collectiveMissionId)
    );
    const querySnapshot = await getDocs(q);
    
    querySnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isPartOfCollective: false,
        collectiveMissionId: null
      });
    });
    
    await batch.commit();
    
    // Mettre à jour la progression après avoir retiré l'utilisateur
    await updateCollectiveMissionProgress(collectiveMissionId);
    
    // Invalider le cache après retrait d'utilisateur de la mission collective
    collectiveMissionsCache = null;
    if (userMissionsCache[userId]) {
      delete userMissionsCache[userId];
    }
    console.log(`🔄 Cache des missions collectives et utilisateur ${userId} invalidé après retrait`);
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors du retrait de l'utilisateur de la mission collective:", error);
    throw error;
  }
};

export const getMissionPlatsForUser = async (userId: string): Promise<string[]> => {
  try {
    console.log(`[MISSIONS] Début récupération optimisée des plats pour l'utilisateur ${userId}`);
    
    // Récupérer toutes les missions depuis le cache ou Firebase
    const allMissions = await getAllMissions();
    console.log(`[MISSIONS] ${allMissions.length} missions totales récupérées`);
    
    // Filtrer les missions où l'utilisateur est assigné (userId dans le tableau UserId)
    const userAssignedMissions = allMissions.filter(mission => 
      mission.UserId && mission.UserId.includes(userId)
    );
    console.log(`[MISSIONS] ${userAssignedMissions.length} missions assignées à l'utilisateur trouvées`);
    
    // Extraire les IDs des plats associés à ces missions
    const platIds: string[] = [];
    
    userAssignedMissions.forEach(mission => {
      if (mission.plat && mission.plat.id) {
        platIds.push(mission.plat.id);
        console.log(`[MISSIONS] Plat ID "${mission.plat.id}" ajouté depuis la mission "${mission.titre}"`);
      }
    });
    
    // Supprimer les doublons si un même plat est associé à plusieurs missions
    const uniquePlatIds = [...new Set(platIds)];
    console.log(`[MISSIONS] ✅ ${uniquePlatIds.length} plats uniques trouvés pour l'utilisateur ${userId}`);
    
    return uniquePlatIds;
  } catch (error) {
    console.error(`[MISSIONS] ❌ Erreur lors de la récupération optimisée des plats pour l'utilisateur ${userId}:`, error);
    
    // En cas d'erreur, retourner un tableau vide
    return [];
  }
};

// Récupérer les missions avec plats associés pour un utilisateur (version optimisée)
export const getUserMissionsWithPlats = async (userId: string) => {
  try {
    // Récupérer toutes les missions de l'utilisateur
    const userMissions = await getUserMissions(userId);
    console.log(`[MISSIONS] ${userMissions.length} missions trouvées pour l'utilisateur`);
    
    // Récupérer les détails de toutes les missions pour avoir accès aux plats associés
    const missionsWithDetails = await Promise.all(
      userMissions.map(async (userMission) => {
        try {
          const mission = await getMission(userMission.missionId);
          return { userMission, mission };
        } catch (error) {
          console.warn(`[MISSIONS] Erreur lors de la récupération de la mission ${userMission.missionId}:`, error);
          return { userMission, mission: null };
        }
      })
    );
    
    // Filtrer les missions qui ont des plats associés
    const missionsWithPlats = missionsWithDetails.filter(
      ({ mission }) => mission && mission.plat && mission.plat.id
    );
    
    console.log(`[MISSIONS] ${missionsWithPlats.length} missions trouvées avec des plats associés`);
    missionsWithPlats.forEach(({ mission, userMission }) => {
      console.log(`[MISSIONS] Mission "${mission?.titre}" associée au plat ID: ${mission?.plat?.id} (Status: ${userMission.status})`);
    });
    
    return missionsWithPlats;
  } catch (error) {
    console.error("Erreur lors de la récupération des missions avec plats:", error);
    return [];
  }
};

// ---- FONCTION POUR CONNECTER ENCAISSEMENT ET MISSIONS ----

// Mettre à jour la progression des missions basée sur les plats validés
export const updateMissionsProgressFromDishes = async (
  userId: string,
  validatedDishes: { plat: { id?: string; name: string; price: number }; quantite: number }[]
) => {
  try {
    console.log(`[MISSIONS] Début mise à jour pour utilisateur ${userId} avec ${validatedDishes.length} plats validés`);
    
    // Filtrer les plats qui ont un ID valide
    const dishesWithId = validatedDishes.filter(dish => dish.plat.id);
    console.log(`[MISSIONS] ${dishesWithId.length} plats avec ID valide trouvés:`, 
      dishesWithId.map(d => `${d.plat.name} (ID: ${d.plat.id}, Qty: ${d.quantite})`));
    
    if (dishesWithId.length === 0) {
      console.log("[MISSIONS] Aucun plat avec ID valide, arrêt de la mise à jour des missions");
      return {
        success: true,
        updatedMissions: 0,
        processedDishes: 0,
        message: "Aucun plat avec ID valide à traiter"
      };
    }
    
    // Utiliser la fonction optimisée pour récupérer les missions avec plats
    const missionsWithPlats = await getUserMissionsWithPlats(userId);
    
    // Pour chaque plat validé, vérifier s'il correspond à une mission
    const progressUpdates: Promise<any>[] = [];
    let updatedMissionsCount = 0;
    let totalPointsAwarded = 0;
    let completedMissions: string[] = [];
    
    for (const validatedDish of dishesWithId) {
      // Trouver les missions qui correspondent à ce plat
      const matchingMissions = missionsWithPlats.filter(
        ({ mission }) => mission?.plat?.id === validatedDish.plat.id
      );
      
      console.log(`[MISSIONS] Plat "${validatedDish.plat.name}" (ID: ${validatedDish.plat.id}) correspond à ${matchingMissions.length} mission(s)`);
      
      // Mettre à jour la progression pour chaque mission correspondante
      for (const { userMission, mission } of matchingMissions) {
        if (mission && userMission.status !== "completed") {
          // Calculer la nouvelle valeur actuelle
          const currentValue = (userMission.currentValue || 0) + validatedDish.quantite;
          
          console.log(`[MISSIONS] Mission "${mission.titre}": progression de ${userMission.currentValue || 0} à ${currentValue}`);
          
          // Ajouter la mise à jour à la liste des promesses
          progressUpdates.push(
            updateUserMissionProgress(userMission.id, currentValue)
              .then((result) => {
                console.log(`[MISSIONS] ✅ Mission "${mission.titre}" mise à jour avec succès`);
                updatedMissionsCount++;
                
                // Si des points ont été attribués
                if (result.pointsAwarded > 0) {
                  totalPointsAwarded += result.pointsAwarded;
                  completedMissions.push(mission.titre);
                  console.log(`[MISSIONS] 🎉 Mission "${mission.titre}" complétée! ${result.pointsAwarded} points attribués`);
                }
                
                return result;
              })
              .catch((error) => {
                console.error(`[MISSIONS] ❌ Erreur mise à jour mission "${mission.titre}":`, error);
                throw error;
              })
          );
        } else if (userMission.status === "completed") {
          console.log(`[MISSIONS] Mission "${mission?.titre}" déjà complétée, pas de mise à jour`);
        }
      }
    }
    
    // Exécuter toutes les mises à jour en parallèle
    if (progressUpdates.length > 0) {
      await Promise.all(progressUpdates);
      console.log(`[MISSIONS] ✅ ${updatedMissionsCount} missions mises à jour avec succès`);
      
      if (totalPointsAwarded > 0) {
        console.log(`[MISSIONS] 🎉 Total: ${totalPointsAwarded} points attribués pour ${completedMissions.length} mission(s) complétée(s)`);
      }
    } else {
      console.log("[MISSIONS] Aucune mission à mettre à jour");
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
    console.error("[MISSIONS] ❌ Erreur lors de la mise à jour des missions depuis les plats:", error);
    throw error;
  }
};

// ---- ANALYTICS ET REPORTING ----

// Obtenir des statistiques sur les missions et leur progression
export const getMissionProgressAnalytics = async (userId: string) => {
  try {
    const userMissions = await getUserMissions(userId);
    
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
          const mission = await getMission(userMission.missionId);
          return { userMission, mission };
        } catch (error) {
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

// Obtenir l'historique des mises à jour de progression d'une mission
export const getMissionProgressHistory = async (userMissionId: string) => {
  try {
    // Cette fonction pourrait être étendue pour stocker un historique des changements
    // Pour l'instant, on retourne les données actuelles
    const userMissionRef = doc(db, 'user_missions', userMissionId);
    const userMissionDoc = await getDoc(userMissionRef);
    
    if (!userMissionDoc.exists()) {
      throw new Error("Mission utilisateur non trouvée");
    }
    
    const userMission = userMissionDoc.data() as UserMission;
    const mission = await getMission(userMission.missionId);
    
    return {
      userMission,
      mission,
      currentProgress: userMission.progression || 0,
      currentValue: userMission.currentValue || 0,
      lastUpdated: userMission.dateAssigned || new Date()
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
  addUserToCollectiveMission,
  removeUserFromCollectiveMission,
  getMissionPlatsForUser,
  getUserMissionsWithPlats,
  updateMissionsProgressFromDishes,
  getMissionProgressAnalytics,
  getMissionProgressHistory,
  // Cache utilities
  clearMissionsCache,
  getMissionsCacheInfo
};

