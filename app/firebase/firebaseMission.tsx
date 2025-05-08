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

// Types importés des interfaces
import type { Mission, MissionAssignment } from '../mission/Interface';

// Pour les user missions individuelles
interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  status: "pending" | "completed" | "failed";
  progression: number;
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
    return { id: docRef.id };
  } catch (error) {
    console.error("Erreur lors de la création de la mission:", error);
    throw error;
  }
};

// Récupérer une mission par ID
export const getMission = async (id: string): Promise<Mission | null> => {
  try {
    const missionRef = doc(db, 'missions', id);
    const missionDoc = await getDoc(missionRef);
    
    if (missionDoc.exists()) {
      return { id: missionDoc.id, ...missionDoc.data() } as Mission;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la mission:", error);
    throw error;
  }
};

// Récupérer toutes les missions
export const getAllMissions = async (): Promise<Mission[]> => {
  try {
    const missionsRef = collection(db, 'missions');
    const querySnapshot = await getDocs(missionsRef);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Mission));
  } catch (error) {
    console.error("Erreur lors de la récupération des missions:", error);
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
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la mission:", error);
    throw error;
  }
};

// Supprimer une mission
export const deleteMission = async (id: string) => {
  try {
    const missionRef = doc(db, 'missions', id);
    await deleteDoc(missionRef);
    
    // Supprimer aussi toutes les assignations liées à cette mission
    const userMissionsRef = collection(db, 'user_missions');
    const q = query(userMissionsRef, where("missionId", "==", id));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de la mission:", error);
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
    const docRef = await addDoc(userMissionRef, {
      userId,
      missionId,
      status: "pending",
      progression: 0,
      dateAssigned: serverTimestamp(),
      isPartOfCollective: false
    });
    
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
    const userMissionsRef = collection(db, 'user_missions');
    const q = query(userMissionsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as UserMission));
  } catch (error) {
    console.error("Erreur lors de la récupération des missions de l'utilisateur:", error);
    throw error;
  }
};

// Mettre à jour le statut d'une mission pour un utilisateur
export const updateUserMissionStatus = async (
  userMissionId: string, 
  status: "pending" | "completed" | "failed",
  progression: number
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
      ...(status === "completed" ? { dateCompletion: serverTimestamp() } : {})
    };
    
    await updateDoc(userMissionRef, updateData);
    
    // Si cette mission fait partie d'une mission collective, mettre à jour la progression collective
    const userMission = userMissionDoc.data() as UserMission;
    if (userMission.isPartOfCollective && userMission.collectiveMissionId) {
      await updateCollectiveMissionProgress(userMission.collectiveMissionId);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la mission:", error);
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
      totalValue += userMission.progression;
    });
    
    // Mettre à jour la mission collective
    const isCompleted = totalValue >= collectiveMission.targetValue;
    
    await updateDoc(collectiveMissionRef, {
      currentValue: totalValue,
      isCompleted,
      ...(isCompleted && !collectiveMission.isCompleted ? { dateCompleted: serverTimestamp() } : {})
    });
    
    return { success: true, currentValue: totalValue, isCompleted };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression de la mission collective:", error);
    throw error;
  }
};

// Récupérer les missions collectives
export const getCollectiveMissions = async (): Promise<CollectiveMission[]> => {
  try {
    const collectiveMissionsRef = collection(db, 'collective_missions');
    const querySnapshot = await getDocs(collectiveMissionsRef);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as CollectiveMission));
  } catch (error) {
    console.error("Erreur lors de la récupération des missions collectives:", error);
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
      dateAssigned: serverTimestamp(),
      isPartOfCollective: true,
      collectiveMissionId
    });
    
    await batch.commit();
    
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
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors du retrait de l'utilisateur de la mission collective:", error);
    throw error;
  }
};

// Récupérer les plats associés à des missions pour un utilisateur
export const getMissionPlatsForUser = async (userId: string): Promise<string[]> => {
  try {
    
    // Récupérer toutes les missions de l'utilisateur
    const userMissions = await getUserMissions(userId);
    
    // Récupérer les détails de chaque mission
    const missionIds = userMissions.map(um => um.missionId);
    const missionPlats: string[] = [];
    
    // Pour chaque mission, vérifier si elle est associée à un plat
    for (const missionId of missionIds) {
      console.log("Recherche des détails pour la mission:", missionId);
      const mission = await getMission(missionId);
      console.log("Détails de la mission:", mission);
      
      // Essayer différentes façons que la mission pourrait stocker le plat ID
      if (mission) {
        if (mission.plat && mission.plat.id) {
          missionPlats.push(mission.plat.id);
        } else {
        }
      }
    }
    
    return missionPlats;
  } catch (error) {
    console.error("Erreur lors de la récupération des plats avec mission:", error);
    return [];
  }
};

