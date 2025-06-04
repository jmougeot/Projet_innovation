import {
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Plat } from "./firebaseMenu";

// ====== INTERFACES OPTIMISÉES ======

export interface PlatQuantite {
  plat: Plat;
  quantite: number;
  status: 'en_attente' | 'en_preparation' | 'pret' | 'servi' | 'envoye';
  tableId: number;
  mission?: string;
}

export interface CommandeData {
  id: string;
  employeeId: string;
  plats: PlatQuantite[];
  totalPrice: number;
  status: 'en_attente' | 'en_preparation' | 'prete' | 'servie' | 'encaissee';
  timestamp: Timestamp | Date;
  tableId: number;
  dateCreation?: Timestamp | Date;
  estimatedTime?: number; // Temps estimé en minutes
}

// Interface pour les commandes terminées (avec métadonnées d'archivage)
export interface CommandeTerminee extends CommandeData {
  dateTerminee: Timestamp | Date | any;
  dureeTotal: number; // Durée en millisecondes
  satisfaction?: number; // Note de 1 à 5
  notes?: string;
  status: 'encaissee';
}

// Interface for order creation
export interface CreateOrderData {
  employeeId: string;
  plats: PlatQuantite[];
  totalPrice: number;
  tableId: number;
}

// Cache pour commandes EN COURS uniquement - Performance optimisée
let commandesEnCoursCache: CommandeData[] | null = null;
let lastCommandesEnCoursCacheUpdate = 0;
const COMMANDES_CACHE_DURATION = 30000; // 30 secondes

// ====== GESTION CACHE OPTIMISÉE ======

export const clearCommandesCache = () => {
  commandesEnCoursCache = null;
  lastCommandesEnCoursCacheUpdate = 0;
  console.log('🗑️ Cache des commandes en cours vidé');
};

export const getCommandesCacheInfo = () => {
  const now = Date.now();
  const timeLeft = commandesEnCoursCache ? Math.max(0, COMMANDES_CACHE_DURATION - (now - lastCommandesEnCoursCacheUpdate)) : 0;
  return {
    isActive: !!commandesEnCoursCache,
    itemsCount: commandesEnCoursCache?.length || 0,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: COMMANDES_CACHE_DURATION,
    durationFormatted: `${COMMANDES_CACHE_DURATION / 1000}s`
  };
};

// ====== FONCTIONS PRINCIPALES OPTIMISÉES ======

/**
 * 🎯 CRÉATION DE COMMANDE - Va dans collection 'commandes_en_cours'
 */
export const createCommande = async (commandeData: Omit<CommandeData, 'id'>): Promise<string> => {
  try {
    if (!commandeData.plats || !commandeData.tableId) {
      throw new Error("Données de commande incomplètes");
    }

    const commandeToAdd = {
      ...commandeData,
      status: 'en_attente' as const,
      dateCreation: serverTimestamp(),
      timestamp: serverTimestamp()
    };

    // ✅ CRÉER dans la collection EN COURS
    const docRef = await addDoc(collection(db, 'commandes_en_cours'), commandeToAdd);
    
    // Invalider le cache après ajout
    clearCommandesCache();
    console.log("✅ Commande créée dans commandes_en_cours, ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la commande:", error);
    throw error;
  }
};

/**
 * 🏁 TERMINER COMMANDE - Déplace vers collection 'commandes_terminees' (ATOMIQUE)
 */
export const terminerCommande = async (commandeId: string, satisfaction?: number, notes?: string): Promise<void> => {
  try {
    console.log(`🏁 [TERMINER] Finalisation commande: ${commandeId}`);
    
    await runTransaction(db, async (transaction) => {
      // Chercher d'abord dans la nouvelle collection
      const commandeEnCoursRef = doc(db, 'commandes_en_cours', commandeId);
      let commandeDoc = await transaction.get(commandeEnCoursRef);
      let isOldCollection = false;
      
      // Si pas trouvée, chercher dans l'ancienne collection
      if (!commandeDoc.exists()) {
        console.log(`🔄 [TERMINER] Commande non trouvée dans commandes_en_cours, recherche dans commandes`);
        const commandeAncienneRef = doc(db, 'commandes', commandeId);
        commandeDoc = await transaction.get(commandeAncienneRef);
        isOldCollection = true;
        
        if (!commandeDoc.exists()) {
          throw new Error('Commande introuvable dans les collections commandes_en_cours et commandes');
        }
      }
      
      const commandeData = commandeDoc.data() as CommandeData;
      const dateCreation = commandeData.dateCreation instanceof Date 
        ? commandeData.dateCreation.getTime() 
        : commandeData.dateCreation?.toMillis ? commandeData.dateCreation.toMillis() 
        : Date.now();
      
      // Créer dans les archives avec timestamp de fin
      const commandeTermineeRef = doc(db, 'commandes_terminees', commandeId);
      // Build archive data, only include defined optional fields
      const commandeTerminee: Partial<CommandeTerminee> = {
        ...commandeData,
        status: 'encaissee',
        dateTerminee: serverTimestamp(),
        dureeTotal: Date.now() - dateCreation,
        // Only include satisfaction and notes if defined
        ...(satisfaction !== undefined && { satisfaction }),
        ...(notes !== undefined && { notes })
      };
      
      transaction.set(commandeTermineeRef, commandeTerminee);
      
      // Supprimer de la collection source
      if (isOldCollection) {
        const commandeAncienneRef = doc(db, 'commandes', commandeId);
        transaction.delete(commandeAncienneRef);
        console.log(`🗑️ [TERMINER] Suppression de l'ancienne collection 'commandes'`);
      } else {
        transaction.delete(commandeEnCoursRef);
        console.log(`🗑️ [TERMINER] Suppression de 'commandes_en_cours'`);
      }
    });
    
    // Invalider le cache après archivage
    clearCommandesCache();
    console.log('✅ Commande terminée et archivée:', commandeId);
  } catch (error) {
    console.error('❌ Erreur lors de la finalisation:', error);
    throw error;
  }
};

/**
 * 📋 RÉCUPÉRER COMMANDES EN COURS - Performance optimisée avec cache
 */
export const getCommandesEnCours = async (useCache = true): Promise<CommandeData[]> => {
  try {
    const now = Date.now();
    
    // Vérifier le cache
    if (useCache && commandesEnCoursCache && (now - lastCommandesEnCoursCacheUpdate) < COMMANDES_CACHE_DURATION) {
      console.log(`📱 ${commandesEnCoursCache.length} commandes en cours depuis le cache`);
      return commandesEnCoursCache;
    }

    console.log(`🔄 Chargement des commandes en cours depuis Firebase...`);
    
    // ✅ LIRE SEULEMENT les commandes en cours
    const q = query(
      collection(db, 'commandes_en_cours'),
      orderBy('dateCreation', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const commandes: CommandeData[] = [];
    
    querySnapshot.forEach((doc) => {
      commandes.push({ 
        id: doc.id, 
        ...doc.data() 
      } as CommandeData);
    });
    
    // Mettre en cache
    commandesEnCoursCache = commandes;
    lastCommandesEnCoursCacheUpdate = now;
    
    console.log(`✅ ${commandes.length} commandes en cours chargées et mises en cache`);
    return commandes;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des commandes en cours:`, error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (commandesEnCoursCache) {
      console.log(`🔄 Utilisation du cache de secours`);
      return commandesEnCoursCache;
    }
    
    throw error;
  }
};

/**
 * 📊 ÉCOUTE TEMPS RÉEL - Commandes en cours seulement
 */
export const listenToCommandesEnCours = (callback: (commandes: CommandeData[]) => void): Unsubscribe => {
  const q = query(
    collection(db, 'commandes_en_cours'),
    orderBy('dateCreation', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const commandes: CommandeData[] = [];
    snapshot.forEach((doc) => {
      commandes.push({
        id: doc.id,
        ...doc.data()
      } as CommandeData);
    });
    
    // Mettre à jour le cache lors des changements temps réel
    commandesEnCoursCache = commandes;
    lastCommandesEnCoursCacheUpdate = Date.now();
    
    console.log(`🔄 ${commandes.length} commandes en cours mises à jour (temps réel)`);
    callback(commandes);
  });
};

/**
 * 🔍 RÉCUPÉRER UNE COMMANDE EN COURS PAR TABLE ID
 * Cherche d'abord dans 'commandes_en_cours', puis dans 'commandes' (rétrocompatibilité)
 */
export const getCommandeByTableId = async (tableId: number): Promise<CommandeData | null> => {
  try {
    console.log(`🔍 [FIREBASE] Recherche commande pour table ${tableId} (type: ${typeof tableId})`);
    
    // Chercher d'abord dans la nouvelle collection avec différents types
    const commandesEnCoursRef = collection(db, "commandes_en_cours");
    
    // Essayer avec le type number d'abord
    let qEnCours = query(commandesEnCoursRef, where("tableId", "==", tableId));
    console.log(`🔍 [FIREBASE] Exécution requête collection 'commandes_en_cours' avec tableId number: ${tableId}`);
    let querySnapshotEnCours = await getDocs(qEnCours);
    console.log(`🔍 [FIREBASE] Résultats 'commandes_en_cours' (number): ${querySnapshotEnCours.size} documents`);
    
    // Si pas trouvé, essayer avec le type string
    if (querySnapshotEnCours.empty) {
      qEnCours = query(commandesEnCoursRef, where("tableId", "==", tableId.toString()));
      console.log(`🔍 [FIREBASE] Exécution requête collection 'commandes_en_cours' avec tableId string: "${tableId}"`);
      querySnapshotEnCours = await getDocs(qEnCours);
      console.log(`🔍 [FIREBASE] Résultats 'commandes_en_cours' (string): ${querySnapshotEnCours.size} documents`);
    }
    
    if (!querySnapshotEnCours.empty) {
      const docSnapshot = querySnapshotEnCours.docs[0];
      const commandeData = docSnapshot.data() as Omit<CommandeData, 'id'>;
      const commande = { id: docSnapshot.id, ...commandeData };
      console.log(`✅ [FIREBASE] Commande trouvée dans commandes_en_cours:`, commande);
      return commande;
    }
    
    // Si pas trouvée, chercher dans l'ancienne collection pour rétrocompatibilité
    console.log(`🔄 [FIREBASE] Recherche dans l'ancienne collection 'commandes'`);
    const commandesRef = collection(db, "commandes");
    const qCommandes = query(commandesRef, where("tableId", "==", tableId));
    
    console.log(`🔍 [FIREBASE] Exécution requête collection 'commandes'`);
    const querySnapshotCommandes = await getDocs(qCommandes);
    console.log(`🔍 [FIREBASE] Résultats 'commandes': ${querySnapshotCommandes.size} documents`);
    
    if (querySnapshotCommandes.size > 0) {
      console.log(`🔍 [FIREBASE] Documents trouvés dans 'commandes':`);
      querySnapshotCommandes.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  - Document ${index}: ID=${doc.id}, tableId=${data.tableId}, status=${data.status}`);
      });
    }
    
    if (!querySnapshotCommandes.empty) {
      const docSnapshot = querySnapshotCommandes.docs[0];
      const commandeData = docSnapshot.data() as any; // Use any to handle legacy data
      const commande = { id: docSnapshot.id, ...commandeData };
      
      // Filtrer les commandes déjà encaissées (support legacy status values)
      if (commandeData.status === 'encaissee' || commandeData.status === 'encaissée') {
        console.log(`⚠️ [FIREBASE] Commande trouvée mais déjà encaissée, ignorée`);
        return null;
      }
      
      console.log(`✅ [FIREBASE] Commande trouvée dans ancienne collection 'commandes':`, commande);
      return commande as CommandeData;
    }
    
    console.log(`❌ [FIREBASE] Aucune commande trouvée pour la table ${tableId}`);
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de la commande:", error);
    return null;
  }
};

/**
 * 💰 ENCAISSER UNE COMMANDE - Déplace vers archives
 */
export const CommandeEncaisse = async (tableId: number): Promise<void> => {
  try {
    const commande = await getCommandeByTableId(tableId);
    if (!commande) {
      throw new Error("Commande non trouvée");
    }
    
    // Terminer la commande (la déplace automatiquement vers les archives)
    await terminerCommande(commande.id);
    console.log(`✅ Commande table ${tableId} encaissée et archivée`);
  } catch (error) {
    console.error("❌ Erreur lors de l'encaissement:", error);
    throw error;
  }
};

/**
 * ✏️ METTRE À JOUR UNE COMMANDE EN COURS
 */
export const updateCommande = async (documentId: string, newData: Partial<CommandeData>): Promise<void> => {
  try {
    console.log("Mise à jour de la commande:", documentId);
    
    // Mettre à jour dans les commandes en cours
    const commandeRef = doc(db, 'commandes_en_cours', documentId);
    
    // Vérifier si le document existe
    const docSnap = await getDoc(commandeRef);
    
    if (!docSnap.exists()) {
      console.log("Commande non trouvée dans les commandes en cours:", documentId);
      throw new Error("Commande non trouvée");
    }

    // Mise à jour du document
    await updateDoc(commandeRef, {
      ...newData,
      timestamp: serverTimestamp()
    });

    // Invalider le cache après modification
    clearCommandesCache();
    console.log("✅ Commande mise à jour avec succès:", documentId);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    throw error;
  }
};

/**
 * 📊 RÉCUPÉRER COMMANDES PAR STATUT (en cours uniquement)
 */
export const getCommandesByStatus = async (status: CommandeData['status']): Promise<CommandeData[]> => {
  try {
    console.log(`🔄 Récupération des commandes avec statut: ${status}`);
    
    const q = query(
      collection(db, 'commandes_en_cours'),
      where("status", "==", status),
      orderBy('dateCreation', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const commandes: CommandeData[] = [];
    
    querySnapshot.forEach((doc) => {
      commandes.push({ 
        id: doc.id, 
        ...(doc.data() as Omit<CommandeData, 'id'>) 
      });
    });
    
    console.log(`✅ ${commandes.length} commandes trouvées avec statut ${status}`);
    return commandes;
  } catch (error) {
    console.error(`❌ Erreur récupération commandes (${status}):`, error);
    throw error;
  }
};

/**
 * 🍽️ METTRE À JOUR LE STATUT D'UN PLAT
 */
export const updateStatusPlat = async (tableId: number, platName: string, newStatus: PlatQuantite['status']): Promise<void> => {
  try {
    const commande = await getCommandeByTableId(tableId);
    if (!commande) {
      throw new Error("Commande non trouvée");
    }
    
    const platToUpdate = commande.plats.find((p) => p.plat.name === platName);
    if (!platToUpdate) {
      throw new Error("Plat non trouvé");
    }
    
    // Mettre à jour le statut du plat
    platToUpdate.status = newStatus;
    
    // Sauvegarder la commande mise à jour
    await updateCommande(commande.id, { plats: commande.plats });
    
    console.log(`✅ Statut du plat "${platName}" mis à jour: ${newStatus}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du statut du plat:", error);
    throw error;
  }
};

/**
 * 🔄 CHANGER LE STATUT D'UNE COMMANDE
 */
export const changeStatusCommande = async (id: string, status: CommandeData['status']): Promise<void> => {
  try {
    await updateCommande(id, { status });
    console.log(`✅ Statut de la commande ${id} changé vers: ${status}`);
  } catch (error) {
    console.error("❌ Erreur lors du changement de statut:", error);
    throw error;
  }
};

/**
 * 📈 RÉCUPÉRER LES COMMANDES TERMINÉES (pour statistiques)
 */
export const getCommandesTerminees = async (limitCount?: number): Promise<CommandeTerminee[]> => {
  try {
    let q = query(
      collection(db, 'commandes_terminees'),
      orderBy('dateTerminee', 'desc')
    );
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const commandes: CommandeTerminee[] = [];
    
    querySnapshot.forEach((doc) => {
      commandes.push({ 
        id: doc.id, 
        ...doc.data() 
      } as CommandeTerminee);
    });
    
    console.log(`✅ ${commandes.length} commandes terminées récupérées`);
    return commandes;
  } catch (error) {
    console.error("❌ Erreur récupération commandes terminées:", error);
    throw error;
  }
};

/**
 * 🗑️ PURGE DES ANCIENNES COMMANDES TERMINÉES
 */
export const purgeOldCommandes = async (monthsOld = 6): Promise<number> => {
  try {
    const dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() - monthsOld);
    
    const q = query(
      collection(db, 'commandes_terminees'),
      where('dateTerminee', '<', dateLimit)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('Aucune commande ancienne à purger');
      return 0;
    }
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log(`✅ ${snapshot.size} commandes anciennes purgées`);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Erreur lors de la purge:', error);
    throw error;
  }
};

/**
 * 🔍 DIAGNOSTIC - Vérifier l'état des collections
 */
export const diagnosticCommandes = async () => {
  try {
    console.log('🔍 === DIAGNOSTIC DES COMMANDES ===');
    
    // Vérifier commandes en cours
    const qEnCours = query(collection(db, 'commandes_en_cours'));
    const snapshotEnCours = await getDocs(qEnCours);
    
    console.log(`📊 Commandes en cours: ${snapshotEnCours.size}`);
    snapshotEnCours.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: Table ${data.tableId}, Status: ${data.status}`);
    });
    
    // Vérifier commandes terminées
    const qTerminees = query(
      collection(db, 'commandes_terminees'), 
      orderBy('dateTerminee', 'desc'), 
      limit(5)
    );
    const snapshotTerminees = await getDocs(qTerminees);
    
    console.log(`📋 Dernières commandes terminées: ${snapshotTerminees.size}`);
    snapshotTerminees.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: Table ${data.tableId}, Terminée: ${data.dateTerminee}`);
    });
    
    return {
      commandesEnCours: snapshotEnCours.size,
      commandesTerminees: snapshotTerminees.size,
      diagnostic: 'success'
    };
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    throw error;
  }
};

/**
 * 🔍 DIAGNOSTIC - Lister toutes les commandes par table ID
 */
export const diagnosticCommandesByTable = async (tableId: number): Promise<void> => {
  try {
    console.log(`🔍 === DIAGNOSTIC COMMANDES POUR TABLE ${tableId} ===`);
    
    // Vérifier commandes_en_cours
    const qEnCours = query(collection(db, 'commandes_en_cours'));
    const snapshotEnCours = await getDocs(qEnCours);
    
    console.log(`📊 Collection 'commandes_en_cours': ${snapshotEnCours.size} documents`);
    snapshotEnCours.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: Table ${data.tableId}, Status: ${data.status}, TypeTableId: ${typeof data.tableId}`);
      if (data.tableId === tableId || data.tableId === tableId.toString()) {
        console.log(`    ✅ MATCH trouvé pour table ${tableId}!`);
      }
    });
    
    // Vérifier ancienne collection commandes
    const qCommandes = query(collection(db, 'commandes'));
    const snapshotCommandes = await getDocs(qCommandes);
    
    console.log(`📋 Collection 'commandes': ${snapshotCommandes.size} documents`);
    snapshotCommandes.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${doc.id}: Table ${data.tableId}, Status: ${data.status}, TypeTableId: ${typeof data.tableId}`);
      if (data.tableId === tableId || data.tableId === tableId.toString()) {
        console.log(`    ✅ MATCH trouvé pour table ${tableId}!`);
      }
    });
    
    console.log(`🔍 === FIN DIAGNOSTIC TABLE ${tableId} ===`);
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
};

// ====== EXPORTS ======

export default {
  // Fonctions optimisées
  createCommande,
  terminerCommande,
  getCommandesEnCours,
  listenToCommandesEnCours,
  getCommandesByStatus,
  getCommandesTerminees,
  purgeOldCommandes,
  
  // Fonctions de gestion
  getCommandeByTableId,
  CommandeEncaisse,
  updateCommande,
  updateStatusPlat,
  changeStatusCommande,
  
  // Utilitaires cache
  clearCommandesCache,
  getCommandesCacheInfo,
  
  // Diagnostics
  diagnosticCommandes,
  diagnosticCommandesByTable
};
