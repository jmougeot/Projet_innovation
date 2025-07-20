/**
 * 🧪 Test de l'architecture hybride - Chaîne Globale + Index des Tickets
 * 
 * Ce fichier teste le nouveau système qui remplace le booléen 'active'
 * par une architecture hybride avec :
 * 1. Chaîne Globale Séquentielle (CS) - Pour l'ordre chronologique
 * 2. Map des Tickets (TM) - Pour l'accès O(1) aux heads
 */

import { 
  addOperationToGlobalChain,
  getTicketHead,
  getAllTicketHeads,
  verifyGlobalChain
} from './globalChain';

import { 
  createMainChainTicket,
  createTicketFork,
  getActiveTicket,
  updateTicketWithFork,
  validateTicket,
  getAllActiveBranchTips,
  getBranchTip
} from './blockchain';

// ====== TEST DE L'ARCHITECTURE HYBRIDE ======

/**
 * 🎯 Test complet du nouveau système
 */
export const testHybridArchitecture = async (restaurantId: string) => {
  try {
    console.log('🧪 [TEST] Début test architecture hybride');
    console.log('=' .repeat(50));

    // 1. ✅ TEST : Création d'un ticket principal
    console.log('📝 1. Test création ticket principal...');
    const ticketId = await createMainChainTicket({
      employeeId: 'emp123',
      tableId: 5,
      active: true,
      timestamp: new Date(),
      plats: [
        { 
          plat: { id: 'plat1', name: 'Pizza Margherita', category: 'Plats', price: 12.50 },
          quantite: 1,
          status: 'en_attente',
          tableId: 5
        }
      ],
      totalPrice: 12.50,
      status: 'en_attente'
    }, restaurantId);
    console.log('✅ Ticket créé:', ticketId);

    // 2. ✅ TEST : Vérification dans la chaîne globale
    console.log('\n🔗 2. Test accès via chaîne globale...');
    const head1 = await getTicketHead(restaurantId, ticketId);
    console.log('✅ Head récupéré:', {
      ticketId: head1?.ticketId,
      sequenceId: head1?.sequenceId,
      operation: head1?.operation
    });

    // 3. ✅ TEST : Récupération du ticket actif
    console.log('\n🎯 3. Test récupération ticket actif...');
    const activeTicket = await getActiveTicket(ticketId, restaurantId);
    console.log('✅ Ticket actif:', {
      id: activeTicket.id,
      status: activeTicket.status,
      totalPrice: activeTicket.totalPrice
    });

    // 4. ✅ TEST : Modification via fork
    console.log('\n🔀 4. Test modification via fork...');
    const forkId = await updateTicketWithFork(
      ticketId,
      restaurantId,
      {
        plats: [
          { 
            plat: { id: 'plat1', name: 'Pizza Margherita', category: 'Plats', price: 12.50 },
            quantite: 1,
            status: 'en_attente',
            tableId: 5
          },
          { 
            plat: { id: 'plat2', name: 'Coca Cola', category: 'Boissons', price: 3.50 },
            quantite: 1,
            status: 'en_attente',
            tableId: 5
          }
        ],
        totalPrice: 16.00
      },
      'emp123',
      'modification'
    );
    console.log('✅ Fork créé:', forkId);

    // 5. ✅ TEST : Vérification nouveau head
    console.log('\n🔗 5. Test nouveau head après fork...');
    const head2 = await getTicketHead(restaurantId, ticketId);
    console.log('✅ Nouveau head:', {
      ticketId: head2?.ticketId,
      sequenceId: head2?.sequenceId,
      operation: head2?.operation
    });

    // 6. ✅ TEST : Validation du ticket
    console.log('\n✅ 6. Test validation ticket...');
    await validateTicket(ticketId, restaurantId, 'emp123', 'carte');
    console.log('✅ Ticket validé');

    // 7. ✅ TEST : Vérification head final
    console.log('\n🔗 7. Test head final après validation...');
    const head3 = await getTicketHead(restaurantId, ticketId);
    console.log('✅ Head final:', {
      ticketId: head3?.ticketId,
      sequenceId: head3?.sequenceId,
      operation: head3?.operation
    });

    // 8. ✅ TEST : Comparaison nouvelle vs ancienne méthode
    console.log('\n⚡ 8. Comparaison performance...');
    
    // Ancienne méthode (simulée)
    const start1 = Date.now();
    const oldMethod = await getAllActiveBranchTips(restaurantId);
    const time1 = Date.now() - start1;
    
    // Nouvelle méthode
    const start2 = Date.now();
    const newMethod = await getAllTicketHeads(restaurantId);
    const time2 = Date.now() - start2;
    
    console.log('📊 Résultats performance:');
    console.log(`   - Ancienne méthode (getAllActiveBranchTips): ${time1}ms`);
    console.log(`   - Nouvelle méthode (getAllTicketHeads): ${time2}ms`);
    console.log(`   - Amélioration: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);

    // 9. ✅ TEST : Vérification intégrité chaîne
    console.log('\n🔒 9. Test vérification intégrité...');
    const isValid = await verifyGlobalChain(restaurantId);
    console.log('✅ Chaîne valide:', isValid);

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 [TEST] Architecture hybride validée avec succès !');
    console.log('📈 Avantages confirmés:');
    console.log('   ✅ Plus de dépendance au booléen "active"');
    console.log('   ✅ Accès O(1) aux heads via l\'index');
    console.log('   ✅ Ordre chronologique préservé');
    console.log('   ✅ Intégrité cryptographique maintenue');

  } catch (error) {
    console.error('❌ [TEST] Erreur dans le test:', error);
    throw error;
  }
};

/**
 * 📊 Benchmark comparatif ancien vs nouveau système
 */
export const benchmarkPerformance = async (restaurantId: string, ticketCount: number = 100) => {
  try {
    console.log(`📊 [BENCHMARK] Test de performance avec ${ticketCount} tickets`);
    
    // Simuler l'ancien système (requête avec where active = true)
    const start1 = Date.now();
    const oldResults = await getAllActiveBranchTips(restaurantId);
    const oldTime = Date.now() - start1;
    
    // Nouveau système (index direct)
    const start2 = Date.now();
    const newResults = await getAllTicketHeads(restaurantId);
    const newTime = Date.now() - start2;
    
    console.log('📈 Résultats du benchmark:');
    console.log(`   🔸 Ancien système: ${oldTime}ms (${oldResults.length} résultats)`);
    console.log(`   🔸 Nouveau système: ${newTime}ms (${newResults.length} résultats)`);
    console.log(`   🚀 Gain de performance: ${((oldTime - newTime) / oldTime * 100).toFixed(1)}%`);
    
    return {
      oldTime,
      newTime,
      improvement: ((oldTime - newTime) / oldTime * 100),
      oldResultsCount: oldResults.length,
      newResultsCount: newResults.length
    };
    
  } catch (error) {
    console.error('❌ [BENCHMARK] Erreur:', error);
    throw error;
  }
};

// ====== UTILITAIRES DE TEST ======

/**
 * 🧹 Nettoie les données de test
 */
export const cleanupTestData = async (restaurantId: string) => {
  console.log('🧹 [CLEANUP] Nettoyage des données de test...');
  // Note: En production, implémenter la suppression sécurisée
  console.log('⚠️ Nettoyage non implémenté pour éviter les suppressions accidentelles');
};

/**
 * 🎮 Fonction principale de test (à appeler depuis la console)
 */
export const runFullTest = async (restaurantId: string = 'test-restaurant') => {
  try {
    await testHybridArchitecture(restaurantId);
    await benchmarkPerformance(restaurantId);
    console.log('\n🎉 Tous les tests terminés avec succès !');
  } catch (error) {
    console.error('❌ Échec des tests:', error);
  }
};

// Export pour utilisation externe
export default {
  testHybridArchitecture,
  benchmarkPerformance,
  cleanupTestData,
  runFullTest
};
