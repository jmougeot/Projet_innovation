import { getTicketByTableId } from './queries';

export interface ActiveTicketCheckResult {
  hasActiveTickets: boolean;
  activeTicketsCount: number;
  activeTablesWithTickets: { tableId: number; tableNumero: string; ticketId: string }[];
  message: string;
}

/**
 * Vérifie s'il y a des tickets actifs dans une salle donnée
 * @param roomId ID de la salle
 * @param restaurantId ID du restaurant
 * @returns Object avec le statut et les détails des tickets actifs
 */
export const checkActiveTicketsInRoom = async (
  roomId: string, 
  restaurantId: string
): Promise<ActiveTicketCheckResult> => {
  try {
    console.log(`🔍 Vérification des tickets actifs dans la salle ${roomId}`);
    
    // Import dynamique pour éviter les dépendances circulaires
    const { getAllTables } = await import('@/app/firebase/room&table/table');
    
    // 1. Récupérer toutes les tables de la salle
    const tables = await getAllTables(roomId, true, restaurantId);
    console.log(`📊 ${tables.length} tables trouvées dans la salle ${roomId}`);
    
    if (tables.length === 0) {
      return {
        hasActiveTickets: false,
        activeTicketsCount: 0,
        activeTablesWithTickets: [],
        message: `Aucune table dans la salle ${roomId}, suppression possible.`
      };
    }
    
    // 2. Vérifier chaque table pour des tickets actifs
    const activeTablesWithTickets: { tableId: number; tableNumero: string; ticketId: string }[] = [];
    
    for (const table of tables) {
      try {
        const activeTicket = await getTicketByTableId(table.id, restaurantId, true);
        if (activeTicket && activeTicket.active) {
          activeTablesWithTickets.push({
            tableId: table.id,
            tableNumero: table.numero,
            ticketId: activeTicket.id
          });
          console.log(`🎫 Ticket actif trouvé: Table ${table.numero} (ID: ${table.id}) -> Ticket ${activeTicket.id}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erreur lors de la vérification de la table ${table.id}:`, error);
        // Continue avec les autres tables
      }
    }
    
    const hasActiveTickets = activeTablesWithTickets.length > 0;
    const activeTicketsCount = activeTablesWithTickets.length;
    
    let message: string;
    if (hasActiveTickets) {
      const tablesList = activeTablesWithTickets
        .map(item => `Table ${item.tableNumero} (Ticket: ${item.ticketId})`)
        .join(', ');
      message = `❌ Impossible de supprimer la salle "${roomId}". ${activeTicketsCount} table(s) avec tickets actifs: ${tablesList}`;
    } else {
      message = `✅ Aucun ticket actif dans la salle "${roomId}". Suppression possible.`;
    }
    
    console.log(message);
    
    return {
      hasActiveTickets,
      activeTicketsCount,
      activeTablesWithTickets,
      message
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification des tickets actifs dans la salle ${roomId}:`, error);
    throw error;
  }
};
