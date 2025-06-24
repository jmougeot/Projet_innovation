// Test simple du hachage des tickets
const CryptoJS = require('crypto-js');

// Simuler un ticket de test
const testTicket = {
  id: 'test-ticket-1',
  employeeId: 'employee123',
  status: 'encaissee',
  tableId: 5,
  timestamp: '2024-01-15T10:30:00.000Z',
  plats: [
    {
      plat: {
        id: 'plat1',
        name: 'Pizza Margherita',
        category: 'Pizza',
        price: 12.50,
        description: 'Tomate, mozzarella, basilic',
        mission: false
      },
      quantite: 2,
      status: 'servi',
      tableId: 5,
      mission: undefined
    }
  ],
  totalPrice: 25.00,
  active: false,
  notes: 'Client satisfait',
  dateCreation: '2024-01-15T10:00:00.000Z',
  dateTerminee: '2024-01-15T10:30:00.000Z',
  estimatedTime: 15,
  dureeTotal: 1800000, // 30 minutes en ms
  satisfaction: 5,
  chainIndex: 1,
  previousHash: ''
};

// Fonction de hachage (similaire à celle du projet)
function calculateTicketHash(ticket) {
  try {
    // Créer une copie du ticket sans les champs de hachage pour éviter la récursion
    const ticketForHash = {
      id: ticket.id,
      employeeId: ticket.employeeId,
      status: ticket.status,
      tableId: ticket.tableId,
      timestamp: ticket.timestamp,
      plats: ticket.plats?.map((plat) => ({
        plat: {
          id: plat.plat.id,
          name: plat.plat.name,
          category: plat.plat.category,
          price: plat.plat.price,
          description: plat.plat.description,
          mission: plat.plat.mission
        },
        quantite: plat.quantite,
        status: plat.status,
        tableId: plat.tableId,
        mission: plat.mission
      })) || [],
      totalPrice: ticket.totalPrice,
      active: ticket.active,
      notes: ticket.notes || '',
      dateCreation: ticket.dateCreation,
      dateTerminee: ticket.dateTerminee,
      estimatedTime: ticket.estimatedTime,
      dureeTotal: ticket.dureeTotal,
      satisfaction: ticket.satisfaction,
      chainIndex: ticket.chainIndex,
      previousHash: ticket.previousHash || ''
    };

    // Convertir en JSON avec tri des clés pour assurer la cohérence
    const jsonString = JSON.stringify(ticketForHash, Object.keys(ticketForHash).sort());
    
    // Calculer le hash SHA-256
    const hash = CryptoJS.SHA256(jsonString).toString(CryptoJS.enc.Hex);
    
    return hash;
  } catch (error) {
    console.error('Erreur lors du calcul du hash du ticket:', error);
    throw new Error('Impossible de calculer le hash du ticket');
  }
}

// Test du hachage
console.log('🧪 Test du hachage des tickets');
console.log('==========================================');

const hash1 = calculateTicketHash(testTicket);
console.log('Hash du ticket test:', hash1);

// Test de reproductibilité
const hash2 = calculateTicketHash(testTicket);
console.log('Hash reproductible:', hash1 === hash2 ? '✅ OUI' : '❌ NON');

// Test avec modification
const modifiedTicket = { ...testTicket, satisfaction: 4 };
const hash3 = calculateTicketHash(modifiedTicket);
console.log('Hash modifié différent:', hash1 !== hash3 ? '✅ OUI' : '❌ NON');

console.log('==========================================');
console.log('Exemple de chaîne de hachage:');
console.log('Ticket 1 (Genesis):', hash1);
console.log('Ticket 2 (previous:', hash1.substring(0, 8) + '...):', hash3);
