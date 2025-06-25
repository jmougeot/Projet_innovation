// ====== EXPORTS CENTRALISÉS BLOCKCHAIN ======

// Types et interfaces
export * from './types';

// Configuration
export * from './config';

// Cache intelligent
export * from './cache';

// Fonctions de hachage
export * from './hash';

// 🔗 Blockchain et Fork System (PRINCIPAL)
export * from './blockchain';

// Opérations CRUD (avec blockchain - plus d'updateDoc)
export * from './crud';

// Requêtes et recherches (mise à jour pour blockchain)
export * from './queries';

// Utilitaires métier
export * from './utils';

// Vérifications de salle
export * from './roomCheck';

// Synchronisation temps réel
export * from './realtime';

// Gestion des modifications et tracking
export * from './modifications';

// 🔗 Export par défaut BLOCKCHAIN (fonctions principales seulement)
import { 
  createTicket, 
  updateTicket, 
  terminerTicket, 
  deleteTicket,
  getTicketActif,
  getTicketHistorique
} from './crud';
import { 
  createTicketFork,
  getTicketChain,
  getBlockchainStats,
  updateTicketWithFork,
  createMainChainTicket
} from './blockchain';
import { getTicketsActifs, getTicketByTableId } from './queries';
import { ticketEncaisse, updateStatusPlat } from './utils';

export default {
  // 🔗 FONCTIONS BLOCKCHAIN PRINCIPALES
  createTicket,          // Crée un nouveau bloc principal
  updateTicket,          // Crée un fork au lieu d'update
  terminerTicket,        // Fork de finalisation
  deleteTicket,          // Fork de suppression
  getTicketActif,        // Récupère le ticket actif (peut être un fork)
  getTicketHistorique,   // Récupère toute la chaîne
  
  // 🔀 FONCTIONS BLOCKCHAIN AVANCÉES
  createTicketFork,      // Crée un fork explicitement
  updateTicketWithFork,  // Version détaillée du fork
  getTicketChain,        // Analyse complète de la chaîne
  getBlockchainStats,    // Statistiques de la blockchain
  createMainChainTicket, // Crée un bloc principal
  
  // 📊 REQUÊTES (compatibles blockchain)
  getTicketsActifs,      // Récupère tous les tickets actifs (inclut forks)
  getTicketByTableId,    // Récupère le ticket actif d'une table
  
  // 🛠️ UTILITAIRES MÉTIER
  ticketEncaisse,        // Encaisse via fork
  updateStatusPlat,      // Met à jour un plat via fork
};
