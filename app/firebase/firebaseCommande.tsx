import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Plat } from "./firebaseMenu";

export interface PlatQuantite{
    plat: Plat;
    quantite: number;
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

export const addCommande = async (commandeData: Partial<CommandeData>): Promise<any> => {
    try {
        // Vérification des données requises
        if (!commandeData.plats || !commandeData.tableId) {
            throw new Error("Données de commande incomplètes");
        }

        const commandeToAdd = {
            ...commandeData,
            timestamp: new Date().toISOString(),
            status: "en attente", // Status par défaut
            totalPrice: commandeData.totalPrice || 0,
        };

        const commandeRef = await addDoc(collection(db, "commandes"), commandeToAdd);
        console.log("Commande ajoutée avec succès :", commandeRef.id);
        return commandeRef;
    } catch (error) {
        console.error("Erreur lors de l'ajout de la commande:", error);
        throw error;
    }
};

export async function getCommandes() {
    try {
        const commandesSnapshot = await getDocs(collection(db, "commandes"));
        const commandes : CommandeData[]= [];
        commandesSnapshot.forEach((doc) => {
            commandes.push({ id: doc.id, ...(doc.data() as Omit<CommandeData, 'id'>) });
        });
        return commandes;
    } catch (error) {
        throw error;
    }
}

export async function updateCommande(id: string, data: Partial<CommandeData>) {
    try {
        const commandeRef = doc(db, "commandes", id);
        await updateDoc(commandeRef, data);
    } catch (error) {
        throw error;
    }
}
