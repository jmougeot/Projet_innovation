import {collection, addDoc, doc, updateDoc, getDocs, getDoc, setDoc, query, where, orderBy, limit, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Plat } from "./firebaseMenu";
import Commande from "../service/commande/commande_Table";
// import statement removed as it was incomplete and not needed

export interface PlatQuantite{
    plat: Plat;
    quantite: number;
    status: string;
    tableId: number;
    mission?: string; 
}

export interface CommandeData {
    id: string;
    employeeId: string;
    plats: PlatQuantite[];
    totalPrice: number;
    status: string;
    timestamp: Date;
    tableId: number;
}

// Interface for archived orders
export interface ArchivedOrderData extends CommandeData {
  deletedAt: Date;
  errorReason?: string;
}

// Interface for order creation
export interface CreateOrderData {
  employeeId: string;
  plats: PlatQuantite[];
  totalPrice: number;
  tableId: number;
}

// Cache local pour les commandes - Durée courte car elles changent très fréquemment
let commandesCache: CommandeData[] | null = null;
let lastCommandesCacheUpdate = 0;
const COMMANDES_CACHE_DURATION = 30000; // 30 secondes - Les commandes changent très souvent

// Fonctions utilitaires de cache pour les commandes
export const clearCommandesCache = () => {
  commandesCache = null;
  lastCommandesCacheUpdate = 0;
  console.log('🗑️ Cache des commandes vidé');
};

export const getCommandesCacheInfo = () => {
  const now = Date.now();
  const timeLeft = commandesCache ? Math.max(0, COMMANDES_CACHE_DURATION - (now - lastCommandesCacheUpdate)) : 0;
  return {
    isActive: !!commandesCache,
    itemsCount: commandesCache?.length || 0,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: COMMANDES_CACHE_DURATION,
    durationFormatted: `${COMMANDES_CACHE_DURATION / 1000}s`
  };
};

// 1. Modification de addCommande
export const addCommande = async (commandeData: Partial<CommandeData>): Promise<string> => {
    try {
        if (!commandeData.plats || !commandeData.tableId) {
            throw new Error("Données de commande incomplètes");
        }
        const commandeToAdd = {
            ...commandeData,
            timestamp: new Date().toISOString(),
            status: "en attente",
            totalPrice: commandeData.totalPrice || 0,
        };

        const commandeRef = doc(collection(db, "commandes"), commandeData.id);
        await setDoc(commandeRef, commandeToAdd);
        
        // Invalider le cache après ajout
        clearCommandesCache();
        console.log("✅ Commande ajoutée avec succès, ID:", commandeRef.id);
        return commandeRef.id; // Retourner l'ID Firestore
    } catch (error) {
        console.error("❌ Erreur lors de l'ajout de la commande:", error);
        throw error;
    }
};

export async function getCommandeByTableId(tableId: number): Promise<CommandeData | null> { 
    try {
      console.log("Tentative de récupération pour la table:", tableId);
      const commandesRef = collection(db, "commandes");
      const q = query(
        commandesRef,
        where("tableId", "==", tableId),
        where("status", "==", "en attente"),
      );
      
      const querySnapshot = await getDocs(q);
      console.log("Nombre de résultats:", querySnapshot.size);
      
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...(doc.data() as Omit<CommandeData, 'id'>)
      };
    } catch (error) {
      console.error("Erreur détaillée:", error);
      throw error;
    }
  }

export async function CommandeEncaisse(tableId: number): Promise<void> {
    try {
        const commande = await getCommandeByTableId(tableId);
        if (!commande) {
            throw new Error("Commande non trouvée");
        }
        await updateCommande(commande.id, { status: "encaissée" });
    } catch (error) {
        throw error;
    }
}

export async function updateCommande(documentId: string, newData: Partial<CommandeData>): Promise<void> {
  try {
    console.log("Mise à jour du document:", documentId);
    
    // Référence directe au document avec son ID Firestore
    const commandeRef = doc(db, "commandes", documentId);
    
    // Vérifier si le document existe
    const docSnap = await getDoc(commandeRef);
    
    if (!docSnap.exists()) {
      console.log("Document non trouvé:", documentId);
      throw new Error("Document non trouvé");
    }

    // Mise à jour du document
    await updateDoc(commandeRef, {
      ...newData,
      timestamp: new Date().toISOString()
    });

    // Invalider le cache après modification
    clearCommandesCache();
    console.log("✅ Document mis à jour avec succès:", documentId);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    throw error;
  }
}

export async function getCommandesByStatus(status: string, useCache = true): Promise<CommandeData[]> {
    try {
        const now = Date.now();
        const cacheKey = `commandes_${status}`;
        
        // Pour les commandes, on utilise un cache très court car elles changent souvent
        if (useCache && commandesCache && (now - lastCommandesCacheUpdate) < COMMANDES_CACHE_DURATION) {
            const cachedCommandes = commandesCache.filter(cmd => cmd.status === status);
            console.log(`📱 Commandes (${status}) chargées depuis le cache local`);
            return cachedCommandes;
        }

        console.log(`🔄 Chargement des commandes (${status}) depuis Firebase...`);
        const commandesRef = collection(db, "commandes");
        const q = query(
            commandesRef,
            where("status", "==", status),        
        );
        const querySnapshot = await getDocs(q);
        const commandes: CommandeData[] = [];
        querySnapshot.forEach((doc) => {
            commandes.push({ id: doc.id, ...(doc.data() as Omit<CommandeData, 'id'>) });
        });
        
        // Mettre à jour le cache (simple pour les commandes par statut)
        if (!commandesCache) commandesCache = [];
        // Remplacer les commandes du même statut dans le cache
        commandesCache = commandesCache.filter(cmd => cmd.status !== status).concat(commandes);
        lastCommandesCacheUpdate = now;
        
        console.log(`✅ ${commandes.length} commandes (${status}) chargées et mises en cache`);
        return commandes;
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération des commandes (${status}):`, error);
        
        // En cas d'erreur, retourner le cache si disponible
        if (commandesCache) {
            const cachedCommandes = commandesCache.filter(cmd => cmd.status === status);
            if (cachedCommandes.length > 0) {
                console.log(`🔄 Utilisation du cache de secours pour les commandes (${status})`);
                return cachedCommandes;
            }
        }
        
        throw error;
    }
}

export async function updateStatusPlat(tableId: number, plat: string, status: string): Promise<void> {
    try {
        const commande = await getCommandeByTableId(tableId);
        if (!commande) {
            throw new Error("Commande non trouvée");
        }
        const platToUpdate = commande.plats.find((p) => p.plat.name === plat);
        if (!platToUpdate) {
            throw new Error("Plat non trouvé");
        }
        if (status === "prêt") {
            platToUpdate.status = "envoyé";
        }
        if (status === "en cours") {
            platToUpdate.status = "prêt";

        } 
        if (status === "en attente") {
            platToUpdate.status = "en cours";
        }       
        await updateCommande(commande.id, commande);
    } catch (error) {
        throw error;
    }
}

export async function changeStatusCommande(id: string, status: string): Promise<void> {
    try {
        const commandeRef = doc(db, "commandes", id);
        await updateDoc(commandeRef, { status });
    } catch (error) {
        throw error;
    }
}

// Nouvelle fonction pour archiver une commande
export async function archiveCommande(id: string): Promise<void> {
    try {
        const commandeRef = doc(db, "commandes", id);
        await updateDoc(commandeRef, { status: "archivée" });
    } catch (error) {
        throw error;
    }
}

// Nouvelle fonction pour supprimer une commande
export async function deleteCommande(id: string): Promise<void> {
    try {
        const commandeRef = doc(db, "commandes", id);
        await deleteDoc(commandeRef);
    } catch (error) {
        throw error;
    }
}

/**
 * Add a new order (alternative to addCommande with different structure)
 * @param orderData - Order data to add
 * @returns Promise<string> - The order ID
 */
export async function addOrder(orderData: CreateOrderData): Promise<string> {
  try {
    const orderToAdd = {
      ...orderData,
      status: "in progress",
      timestamp: new Date(),
    };

    const docRef = await addDoc(collection(db, "orders"), orderToAdd);
    console.log("Commande ajoutée avec succès :", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de la commande :", error);
    throw error;
  }
}

/**
 * Delete an order with archiving
 * @param orderId - The ID of the order to delete
 * @param errorReason - Optional reason for deletion
 * @returns Promise<void>
 */
export async function deleteOrder(orderId: string, errorReason?: string): Promise<void> {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    
    if (!orderDoc.exists()) {
      throw new Error(`Commande avec l'ID ${orderId} non trouvée`);
    }

    const orderData = orderDoc.data() as CommandeData;
    const archivedData: ArchivedOrderData = {
      ...orderData,
      deletedAt: new Date(),
      errorReason: errorReason || "Suppression manuelle"
    };

    // Archive the order
    await setDoc(doc(db, "archived_orders", orderId), archivedData);
    
    // Delete the original order
    await deleteDoc(doc(db, "orders", orderId));
    
    console.log("Commande supprimée et archivée avec succès !");
  } catch (error) {
    console.error("Erreur lors de la suppression de la commande :", error);
    throw error;
  }
}

/**
 * Get archived orders
 * @returns Promise<ArchivedOrderData[]>
 */
export async function getArchivedOrders(): Promise<ArchivedOrderData[]> {
  try {
    const archivedSnapshot = await getDocs(collection(db, "archived_orders"));
    const archivedOrders: ArchivedOrderData[] = [];
    
    archivedSnapshot.forEach((doc) => {
      archivedOrders.push({
        id: doc.id,
        ...doc.data()
      } as ArchivedOrderData);
    });

    return archivedOrders;
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes archivées :", error);
    throw error;
  }
}

export default {
  addCommande,
  getCommandeByTableId,
  CommandeEncaisse,
  updateCommande,
  getCommandesByStatus,
  updateStatusPlat,
  changeStatusCommande,
  archiveCommande,
  deleteCommande,
  addOrder,
  deleteOrder,
  getArchivedOrders
};