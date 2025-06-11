// Utility functions for Restaurant management and migration
import { 
  Restaurant, 
  initializeRestaurant, 
  getRestaurant, 
  migrateExistingDataToRestaurant,
  DEFAULT_RESTAURANT_ID 
} from './firebaseRestaurant';

/**
 * 🚀 SETUP RESTAURANT - Initialize or get existing restaurant
 */
export const setupRestaurant = async (restaurantName?: string): Promise<Restaurant> => {
  try {
    console.log('🏪 Configuration du restaurant...');
    
    // Try to get existing restaurant first
    let restaurant = await getRestaurant(DEFAULT_RESTAURANT_ID, false);
    
    if (!restaurant) {
      // Initialize new restaurant if none exists
      console.log('🏗️ Création d\'un nouveau restaurant...');
      await initializeRestaurant({
        name: restaurantName || "Mon Restaurant"
      });
      
      restaurant = await getRestaurant(DEFAULT_RESTAURANT_ID, false);
    }
    
    if (!restaurant) {
      throw new Error('Impossible de créer ou récupérer le restaurant');
    }
    
    console.log(`✅ Restaurant "${restaurant.name}" configuré avec succès`);
    return restaurant;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du restaurant:', error);
    throw error;
  }
};

/**
 * 🔄 MIGRATE AND SETUP - Complete migration from old structure to new
 */
export const migrateAndSetupRestaurant = async (restaurantName?: string): Promise<Restaurant> => {
  try {
    console.log('🔄 Migration complète vers la structure Restaurant...');
    
    // Step 1: Setup restaurant
    const restaurant = await setupRestaurant(restaurantName);
    
    // Step 2: Migrate existing data
    console.log('📦 Migration des données existantes...');
    await migrateExistingDataToRestaurant(restaurant.id);
    
    // Step 3: Get updated restaurant with migrated data
    const updatedRestaurant = await getRestaurant(restaurant.id, false);
    
    if (!updatedRestaurant) {
      throw new Error('Erreur lors de la récupération des données migrées');
    }
    
    console.log('✅ Migration terminée avec succès');
    console.log(`📊 Restaurant "${updatedRestaurant.name}" avec:`);
    console.log(`   - ${updatedRestaurant.rooms.length} salles`);
    console.log(`   - ${updatedRestaurant.active_orders.length} commandes actives`);
    console.log(`   - ${updatedRestaurant.menu.length} plats au menu`);
    console.log(`   - ${updatedRestaurant.stock.length} articles en stock`);
    
    return updatedRestaurant;
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
};

/**
 * 📊 GET RESTAURANT STATUS - Get current restaurant information
 */
export const getRestaurantStatus = async (): Promise<{
  exists: boolean;
  restaurant?: Restaurant;
  summary: {
    name: string;
    totalRooms: number;
    totalActiveOrders: number;
    totalMenuItems: number;
    totalStockItems: number;
    dailyRevenue: number;
    isActive: boolean;
  };
}> => {
  try {
    const restaurant = await getRestaurant(DEFAULT_RESTAURANT_ID, false);
    
    if (!restaurant) {
      return {
        exists: false,
        summary: {
          name: "Aucun restaurant",
          totalRooms: 0,
          totalActiveOrders: 0,
          totalMenuItems: 0,
          totalStockItems: 0,
          dailyRevenue: 0,
          isActive: false
        }
      };
    }
    
    return {
      exists: true,
      restaurant,
      summary: {
        name: restaurant.name,
        totalRooms: restaurant.rooms.length,
        totalActiveOrders: restaurant.active_orders.length,
        totalMenuItems: restaurant.menu.length,
        totalStockItems: restaurant.stock.length,
        dailyRevenue: restaurant.analytics.daily_revenue,
        isActive: restaurant.is_active
      }
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du statut:', error);
    throw error;
  }
};

/**
 * 🛠️ QUICK SETUP - One-command setup for development
 */
export const quickSetup = async (options?: {
  restaurantName?: string;
  migrate?: boolean;
  force?: boolean;
}): Promise<Restaurant> => {
  try {
    const { restaurantName = "Restaurant de Test", migrate = true, force = false } = options || {};
    
    console.log('⚡ Configuration rapide du restaurant...');
    
    if (force || migrate) {
      return await migrateAndSetupRestaurant(restaurantName);
    } else {
      return await setupRestaurant(restaurantName);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la configuration rapide:', error);
    throw error;
  }
};

/**
 * 🧪 VALIDATE RESTAURANT DATA - Check data integrity
 */
export const validateRestaurantData = async (): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  try {
    const restaurant = await getRestaurant(DEFAULT_RESTAURANT_ID, false);
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!restaurant) {
      errors.push('Restaurant non trouvé');
      return { isValid: false, errors, warnings };
    }
    
    // Validate required fields
    if (!restaurant.name || restaurant.name.trim() === '') {
      errors.push('Nom du restaurant manquant');
    }
    
    if (!restaurant.settings) {
      errors.push('Paramètres du restaurant manquants');
    }
    
    if (!restaurant.analytics) {
      errors.push('Analytics du restaurant manquantes');
    }
    
    // Validate sub-collections
    if (!Array.isArray(restaurant.rooms)) {
      warnings.push('Liste des salles invalide');
    }
    
    if (!Array.isArray(restaurant.menu)) {
      warnings.push('Menu invalide');
    }
    
    if (!Array.isArray(restaurant.stock)) {
      warnings.push('Stock invalide');
    }
    
    if (!Array.isArray(restaurant.active_orders)) {
      warnings.push('Commandes actives invalides');
    }
    
    // Check if restaurant is active
    if (!restaurant.is_active) {
      warnings.push('Restaurant marqué comme inactif');
    }
    
    const isValid = errors.length === 0;
    
    console.log(`🔍 Validation du restaurant: ${isValid ? '✅ Valide' : '❌ Invalide'}`);
    if (errors.length > 0) {
      console.log('❌ Erreurs:', errors);
    }
    if (warnings.length > 0) {
      console.log('⚠️ Avertissements:', warnings);
    }
    
    return { isValid, errors, warnings };
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      isValid: false,
      errors: [`Erreur de validation: ${errorMessage}`],
      warnings: []
    };
  }
};

export default {
  setupRestaurant,
  migrateAndSetupRestaurant,
  getRestaurantStatus,
  quickSetup,
  validateRestaurantData
};
