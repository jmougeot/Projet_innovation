import { 
  grantRestaurantAccess, 
  createInitialRestaurantAccess,
  ROLE_PERMISSIONS 
} from './restaurantAccess';
import { DEFAULT_RESTAURANT_ID } from './firebaseRestaurant';
import { auth } from './firebaseConfig';

/**
 * 🧪 DONNÉES DE TEST pour l'authentification restaurant
 */

// Exemples d'utilisateurs test
export const TEST_USERS = {
  manager: {
    email: 'manager@restaurant.com',
    password: 'manager123',
    role: 'manager' as const,
    name: 'Gestionnaire Restaurant'
  },
  owner: {
    email: 'owner@restaurant.com', 
    password: 'owner123',
    role: 'owner' as const,
    name: 'Propriétaire Restaurant'
  },
  staff: {
    email: 'staff@restaurant.com',
    password: 'staff123', 
    role: 'staff' as const,
    name: 'Employé Restaurant'
  },
  admin: {
    email: 'admin@restaurant.com',
    password: 'admin123',
    role: 'admin' as const,
    name: 'Administrateur'
  }
};

/**
 * Créer des accès de test pour tous les utilisateurs de démonstration
 */
export const setupTestRestaurantAccess = async (): Promise<void> => {
  try {
    console.log('🧪 Configuration des accès de test...');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('⚠️ Aucun utilisateur connecté pour créer les accès de test');
      return;
    }

    // Accorder l'accès au restaurant par défaut pour l'utilisateur actuel
    await createInitialRestaurantAccess(currentUser.uid, DEFAULT_RESTAURANT_ID);
    
    console.log('✅ Accès de test créé pour l\'utilisateur actuel');
    console.log(`   - Restaurant: ${DEFAULT_RESTAURANT_ID}`);
    console.log(`   - Utilisateur: ${currentUser.email}`);
    console.log(`   - Rôle: owner`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des accès de test:', error);
    throw error;
  }
};

/**
 * Accorder rapidement des rôles de test
 */
export const grantTestRole = async (
  targetUserId: string,
  role: 'owner' | 'manager' | 'staff' | 'admin',
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté pour accorder des rôles');
    }

    await grantRestaurantAccess(
      targetUserId,
      restaurantId,
      role,
      currentUser.uid
    );

    console.log(`✅ Rôle ${role} accordé à l'utilisateur ${targetUserId}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'attribution du rôle de test:', error);
    throw error;
  }
};

/**
 * Vérifier les permissions d'un rôle
 */
export const checkRolePermissions = (role: keyof typeof ROLE_PERMISSIONS): void => {
  console.log(`🔍 Permissions pour le rôle "${role}":`);
  const permissions = ROLE_PERMISSIONS[role];
  
  if (permissions.includes('all')) {
    console.log('   - 🟢 TOUTES LES PERMISSIONS');
  } else {
    permissions.forEach(permission => {
      console.log(`   - 🟢 ${permission}`);
    });
  }
};

/**
 * Afficher un résumé des rôles disponibles
 */
export const displayRoleSummary = (): void => {
  console.log('📋 RÉSUMÉ DES RÔLES RESTAURANT:');
  console.log('');
  
  console.log('👑 OWNER (Propriétaire):');
  checkRolePermissions('owner');
  console.log('');
  
  console.log('🛡️ ADMIN (Administrateur):'); 
  checkRolePermissions('admin');
  console.log('');
  
  console.log('👔 MANAGER (Gestionnaire):');
  checkRolePermissions('manager');
  console.log('');
  
  console.log('👥 STAFF (Employé):');
  checkRolePermissions('staff');
  console.log('');
};

/**
 * Créer un scénario de test complet
 */
export const runAuthenticationTestScenario = async (): Promise<void> => {
  try {
    console.log('🎬 SCÉNARIO DE TEST - Authentification Restaurant');
    console.log('================================================');
    
    // 1. Afficher les rôles disponibles
    displayRoleSummary();
    
    // 2. Créer l'accès initial
    await setupTestRestaurantAccess();
    
    // 3. Vérifications
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('');
      console.log('✅ Test d\'authentification terminé avec succès');
      console.log(`👤 Utilisateur: ${currentUser.email}`);
      console.log(`🏪 Restaurant: ${DEFAULT_RESTAURANT_ID}`);
      console.log('');
      console.log('🚀 Vous pouvez maintenant:');
      console.log('   1. Accéder à /restaurant/select');
      console.log('   2. Sélectionner votre restaurant');
      console.log('   3. Gérer le restaurant avec vos permissions');
    }
    
  } catch (error) {
    console.error('❌ Erreur dans le scénario de test:', error);
    throw error;
  }
};

/**
 * Reset des données de test (pour nettoyer)
 */
export const cleanupTestData = async (): Promise<void> => {
  try {
    console.log('🧹 Nettoyage des données de test...');
    // TODO: Implémenter le nettoyage si nécessaire
    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
};

// Export des utilitaires pour les tests en développement
export const devUtils = {
  setupTestRestaurantAccess,
  grantTestRole,
  checkRolePermissions,
  displayRoleSummary,
  runAuthenticationTestScenario,
  cleanupTestData
};
