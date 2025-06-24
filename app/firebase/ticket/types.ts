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
  platsdeleted? : PlatQuantite[]; // Plats supprimés du ticket
}

// Interface for ticket creation
export interface CreateTicketData {
  employeeId: string;
  plats: PlatQuantite[];
  totalPrice: number;
  tableId: number;
}
