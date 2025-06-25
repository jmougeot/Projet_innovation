import { Timestamp } from "firebase/firestore";
import { Plat } from "../firebaseMenu";

// ====== INTERFACES OPTIMISÉES ======

export interface PlatQuantite {
  plat: Plat;
  quantite: number;
  status: 'en_attente' | 'en_preparation' | 'pret' | 'servi' | 'envoye';
  tableId: number;
  mission?: string;
}

export interface ChainTicketData { 
  hash : string;
  previousHash: string;
  chainIndex : number;
  merkleRoot : string
}

export interface TicketChainInfo {
  restaurantId: string;
  lastHash: string;
  lastIndex: number;
  totalTickets: number;
  lastUpdate: number;
}

export interface TicketData {
  id: string;
  employeeId: string;
  plats: PlatQuantite[];
  totalPrice: number;
  active: boolean; // Indique si le ticket est actif ou non
  status: 'en_attente' | 'en_preparation' | 'prete' | 'servie' | 'encaissee';
  timestamp: Timestamp | Date;
  tableId: number;
  dateCreation?: Timestamp | Date;
  dateTerminee?: Timestamp | Date; // Date de fin si le ticket est terminé
  estimatedTime?: number; // Temps estimé en minutes
  dureeTotal?: number; // Durée en millisecondes (calculée à la fin)
  satisfaction?: number; // Note de 1 à 5
  notes?: string;
  hashe?: string; // Hash SHA-256 du ticket terminé (pour vérification d'intégrité)
  chainIndex?: number; // Index dans la chaîne de hachage
  previousHash?: string; // Hash du ticket précédent dans la chaîne
  deleted?: boolean; // Indique si le ticket a été supprimé
  modified?: boolean; // Indique si le ticket a été modifié (plats ajoutés/supprimés)
  platsdeleted?: PlatQuantite[]; // Plats supprimés du ticket (historique)
  dateModification?: Timestamp | Date; // Date de la dernière modification
}

// Interface for ticket creation
export interface CreateTicketData {
  employeeId: string;
  plats: PlatQuantite[];
  totalPrice: number;
  tableId: number;
}

// ====== TYPES POUR GESTION DES MODIFICATIONS ======

export interface TicketModification {
  type: 'plat_ajoute' | 'plat_supprime' | 'plat_modifie' | 'quantite_changee';
  timestamp: Timestamp | Date;
  employeeId?: string;
  platData?: PlatQuantite;
  ancienneQuantite?: number;
  nouvelleQuantite?: number;
}

export interface UpdateTicketData {
  plats?: PlatQuantite[];
  totalPrice?: number;
  status?: 'en_attente' | 'en_preparation' | 'prete' | 'servie' | 'encaissee';
  estimatedTime?: number;
  notes?: string;
  // Champs automatiques gérés par le système
  trackModifications?: boolean; // Si true, track les changements de plats
}
