import { Timestamp } from "firebase/firestore";
import { Plat } from "../firebaseMenu";

// ====== INTERFACES BLOCKCHAIN OPTIMISÉES ======

export interface PlatQuantite {
  plat: Plat;
  quantite: number;
  status: 'en_attente' | 'en_preparation' | 'pret' | 'servi' | 'envoye';
  tableId: number;
  mission?: string;
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

  // ====== CHAMPS BLOCKCHAIN FORK ======
  blockType?: 'main' | 'fork';           // Type de bloc dans la chaîne
  parentTicketId?: string;                // ID du ticket parent (pour les forks)
  mainChainHash?: string;                 // Hash du bloc principal référencé
  forkReason?: 'modification' | 'correction' | 'annulation'; // Raison du fork
  forkTimestamp?: Timestamp | Date;       // Quand le fork a été créé
  isOrphan?: boolean;                     // Si c'est un bloc orphelin
  forkDepth?: number;                     // Profondeur du fork (nombre de modifications)
  originalTicketData?: Partial<TicketData>; // Données du ticket original (avant modification)
  replacedByFork?: string;                // ID du fork qui remplace ce ticket
  lastDirectModification?: Timestamp | Date; // Dernière modification directe (si forcée)
}

// ====== INTERFACES BLOCKCHAIN ======

export interface BlockchainTicketInfo {
  mainChainLength: number;
  forksCount: number;
  orphanedTickets: string[];
  lastMainBlockHash: string;
  totalActiveTickets: number;
}

export interface TicketChainData {
  mainTicket: TicketData;
  forks: TicketData[];
  chainDepth: number;
  activeTicket: TicketData; // Le ticket actuellement actif (main ou fork)
}

export interface ForkCreationData {
  originalTicketId: string;
  restaurantId: string;
  updateData: UpdateTicketData;
  employeeId?: string;
  forkReason?: 'modification' | 'correction' | 'annulation';
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
  active?: boolean; // Pour les fork de finalisation
  dureeTotal?: number; // Pour les tickets terminés
  chainIndex?: number; // Pour la blockchain
  previousHash?: string; // Pour la blockchain
  hashe?: string; // Hash du ticket
  satisfaction?: number; // Note de satisfaction
  dateTerminee?: Date | any; // Date de fin
  // Champs automatiques gérés par le système
  trackModifications?: boolean; // Si true, track les changements de plats
}
