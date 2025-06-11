import { db } from './firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  getDoc, 
  addDoc, 
  writeBatch, 
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';

// Import types from other modules
import type { Room } from './firebaseTables';
import type { CommandeData, CommandeTerminee } from './firebaseCommandeOptimized';
import type { StockData } from './firebaseStock';
import type { Plat } from './firebaseMenu';

// ====== RESTAURANT INTERFACES ======

export interface RestaurantSettings {
  business_hours: {
    open_time: string;
    close_time: string;
    days_of_week: string[];
  };
  table_service_time: number; // minutes
  kitchen_capacity: number;
  currency: string;
  tax_rate: number;
  service_charge: number;
  default_room_name: string;
}

export interface Restaurant {
  id: string;
  name: string;
  manager_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  settings: RestaurantSettings;

  
  // Sub-collections references (data will be stored in sub-collections)
  rooms: Room[];
  active_orders: CommandeData[];
  completed_orders: CommandeTerminee[];
  stock: StockData[];
  menu: Plat[];
  
  // Status
  is_active: boolean;
  last_sync: Timestamp;
}

// ====== COLLECTION CONSTANTS ======
const RESTAURANTS_COLLECTION = 'restaurants';
export const DEFAULT_RESTAURANT_ID = 'main-restaurant';

// ====== CACHE MANAGEMENT ======
let restaurantCache: Restaurant | null = null;
let lastRestaurantCacheUpdate = 0;
const RESTAURANT_CACHE_DURATION = 300000; // 5 minutes

export const clearRestaurantCache = () => {
  restaurantCache = null;
  lastRestaurantCacheUpdate = 0;
  console.log('🗑️ Cache du restaurant vidé');
};

// ====== HELPER FUNCTIONS ======

const getDefaultRestaurantSettings = (): RestaurantSettings => ({
  business_hours: {
    open_time: "08:00",
    close_time: "22:00",
    days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  },
  table_service_time: 90, // 1h30 par défaut
  kitchen_capacity: 50,
  currency: "EUR",
  tax_rate: 0.20, // 20% TVA
  service_charge: 0.0, // Pas de service par défaut
  default_room_name: "Salle principale"
});


// ====== MAIN RESTAURANT FUNCTIONS ======

/**
 * 🏪 CREATE OR INITIALIZE RESTAURANT
 */
export const initializeRestaurant = async (
  restaurantData: Partial<Restaurant> = {}
): Promise<string> => {
  try {
    // Generate unique restaurant ID if not provided
    let restaurantId: string;
    let restaurantRef: any;
    
    if (restaurantData.id) {
      // Use provided ID
      restaurantId = restaurantData.id;
      restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    } else {
      // Generate new unique ID
      const tempRef = doc(collection(db, RESTAURANTS_COLLECTION));
      restaurantId = tempRef.id;
      restaurantRef = tempRef;
    }
    
    // Check if restaurant already exists
    const existingDoc = await getDoc(restaurantRef);
    if (existingDoc.exists()) {
      console.log(`✅ Restaurant déjà initialisé avec l'ID: ${restaurantId}`);
      return restaurantId;
    }

    console.log(`🏗️ Création du restaurant avec l'ID: ${restaurantId}`);

    const defaultRestaurant: Omit<Restaurant, 'id'> = {
      name: restaurantData.name || "Mon Restaurant",
      ...(restaurantData.manager_id && { manager_id: restaurantData.manager_id }),
      address: restaurantData.address || "",
      phone: restaurantData.phone || "",
      email: restaurantData.email || "",
      created_at: serverTimestamp() as Timestamp,
      updated_at: serverTimestamp() as Timestamp,
      settings: { ...getDefaultRestaurantSettings(), ...restaurantData.settings },
      rooms: [],
      active_orders: [],
      completed_orders: [],
      stock: [],
      menu: [],
      is_active: true,
      last_sync: serverTimestamp() as Timestamp
    };

    await setDoc(restaurantRef, defaultRestaurant);
    
    // Initialize sub-collections
    await initializeRestaurantSubCollections(restaurantId);
    
    clearRestaurantCache();
    console.log(`✅ Restaurant initialisé avec l'ID: ${restaurantId}`);
    return restaurantId;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du restaurant:', error);
    throw error;
  }
};

/**
 * 🏗️ INITIALIZE SUB-COLLECTIONS
 */
const initializeRestaurantSubCollections = async (restaurantId: string) => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    
    // Initialize rooms sub-collection
    const roomsRef = collection(restaurantRef, 'rooms');
    const defaultRoom = {
      name: "Salle principale",
      capacity: 50,
      is_active: true,
      created_at: serverTimestamp()
    };
    await addDoc(roomsRef, defaultRoom);
    
    // Initialize tables sub-collection
    // Tables will be added separately using existing table functions
    
    // Initialize menu sub-collection
    // Menu items will be migrated from existing menu collection
    
    // Initialize stock sub-collection  
    // Stock items will be migrated from existing stock collection
    
    // Initialize analytics sub-collection
    const analyticsRef = collection(restaurantRef, 'analytics');
    const defaultAnalyticsDoc = {
      type: 'daily',
      date: new Date().toISOString().split('T')[0],
      revenue: 0,
      orders_count: 0,
      created_at: serverTimestamp()
    };
    await addDoc(analyticsRef, defaultAnalyticsDoc);
    
    console.log('✅ Sous-collections du restaurant initialisées');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des sous-collections:', error);
    throw error;
  }
};

/**
 * 🔍 GET RESTAURANT
 */
export const getRestaurant = async (
  restaurantId: string = DEFAULT_RESTAURANT_ID,
  useCache: boolean = true
): Promise<Restaurant | null> => {
  try {
    const now = Date.now();
    
    // Use cache if available and recent
    if (useCache && restaurantCache && (now - lastRestaurantCacheUpdate) < RESTAURANT_CACHE_DURATION) {
      console.log('📱 Restaurant chargé depuis le cache local');
      return restaurantCache;
    }

    console.log('🔄 Chargement du restaurant depuis Firebase...');
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (!restaurantDoc.exists()) {
      console.log('❌ Restaurant non trouvé, initialisation...');
      await initializeRestaurant();
      return await getRestaurant(restaurantId, false); // Retry without cache
    }

    const restaurantData = { 
      id: restaurantDoc.id, 
      ...restaurantDoc.data() 
    } as Restaurant;
    
    // Load sub-collections data
    restaurantData.rooms = await getRestaurantRooms(restaurantId);
    restaurantData.active_orders = await getRestaurantActiveOrders(restaurantId);
    restaurantData.stock = await getRestaurantStock(restaurantId);
    restaurantData.menu = await getRestaurantMenu(restaurantId);
    
    // Update cache
    restaurantCache = restaurantData;
    lastRestaurantCacheUpdate = now;
    
    console.log(`✅ Restaurant chargé et mis en cache`);
    return restaurantData;
  } catch (error) {
    console.error('❌ Erreur lors du chargement du restaurant:', error);
    
    // Return cache if available on error
    if (restaurantCache) {
      console.log('🔄 Utilisation du cache de secours');
      return restaurantCache;
    }
    
    throw error;
  }
};

/**
 * ✏️ UPDATE RESTAURANT
 */
export const updateRestaurant = async (
  restaurantId: string = DEFAULT_RESTAURANT_ID,
  updateData: Partial<Restaurant>
): Promise<void> => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    
    // Filter out undefined values to avoid Firebase errors
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    const updatedData = {
      ...filteredUpdateData,
      updated_at: serverTimestamp(),
      last_sync: serverTimestamp()
    };
    
    await updateDoc(restaurantRef, updatedData);
    
    clearRestaurantCache();
    console.log('✅ Restaurant mis à jour');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du restaurant:', error);
    throw error;
  }
};

/**
 * ⚙️ UPDATE RESTAURANT SETTINGS
 */
export const updateRestaurantSettings = async (
  restaurantId: string = DEFAULT_RESTAURANT_ID,
  settingsData: Partial<RestaurantSettings>
): Promise<void> => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    
    const updatedSettings = {
      settings: settingsData,
      updated_at: serverTimestamp()
    };
    
    await updateDoc(restaurantRef, updatedSettings);
    
    clearRestaurantCache();
    console.log('✅ Paramètres du restaurant mis à jour');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des paramètres:', error);
    throw error;
  }
};

// ====== SUB-COLLECTIONS FUNCTIONS ======

/**
 * 🏠 GET RESTAURANT ROOMS
 */
export const getRestaurantRooms = async (restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<Room[]> => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    const roomsRef = collection(restaurantRef, 'rooms');
    const querySnapshot = await getDocs(roomsRef);
    
    const rooms: Room[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Create a proper Room object with required properties
      rooms.push({ 
        name: data.name || "Salle sans nom",
        listTable: data.listTable || []
      } as Room);
    });
    
    return rooms;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des salles:', error);
    return [];
  }
};

/**
 * 📋 GET RESTAURANT ACTIVE ORDERS
 */
export const getRestaurantActiveOrders = async (restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<CommandeData[]> => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    const ordersRef = collection(restaurantRef, 'active_orders');
    const querySnapshot = await getDocs(query(ordersRef, orderBy('timestamp', 'desc')));
    
    const orders: CommandeData[] = [];
    querySnapshot.forEach((doc) => {
      orders.push({ 
        id: doc.id, 
        ...doc.data() 
      } as CommandeData);
    });
    
    return orders;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des commandes actives:', error);
    return [];
  }
};

/**
 * 📦 GET RESTAURANT STOCK
 */
export const getRestaurantStock = async (restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<StockData[]> => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    const stockRef = collection(restaurantRef, 'stock');
    const querySnapshot = await getDocs(stockRef);
    
    const stock: StockData[] = [];
    querySnapshot.forEach((doc) => {
      stock.push({ 
        id: doc.id, 
        ...doc.data() 
      } as StockData);
    });
    
    return stock;
  } catch (error) {
    console.error('❌ Erreur lors du chargement du stock:', error);
    return [];
  }
};

/**
 * 🍽️ GET RESTAURANT MENU
 */
export const getRestaurantMenu = async (restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<Plat[]> => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    const menuRef = collection(restaurantRef, 'menu');
    const querySnapshot = await getDocs(menuRef);
    
    const menu: Plat[] = [];
    querySnapshot.forEach((doc) => {
      menu.push({ 
        id: doc.id, 
        ...doc.data() 
      } as Plat);
    });
    
    return menu;
  } catch (error) {
    console.error('❌ Erreur lors du chargement du menu:', error);
    return [];
  }
};

// ====== DATA MIGRATION FUNCTIONS ======

/**
 * 🔄 MIGRATE EXISTING DATA TO RESTAURANT STRUCTURE
 */
export const migrateExistingDataToRestaurant = async (
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<void> => {
  try {
    console.log('🔄 Début de la migration des données vers la structure Restaurant...');
    
    const batch = writeBatch(db);
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    
    // Ensure restaurant exists
    await initializeRestaurant();
    
    // Migrate tables
    console.log('🔄 Migration des tables...');
    const tablesSnapshot = await getDocs(collection(db, 'tables'));
    const tablesRef = collection(restaurantRef, 'tables');
    tablesSnapshot.forEach((docSnapshot) => {
      const newTableRef = doc(tablesRef);
      batch.set(newTableRef, docSnapshot.data());
    });
    
    // Migrate menu
    console.log('🔄 Migration du menu...');
    const menuSnapshot = await getDocs(collection(db, 'menu'));
    const menuRef = collection(restaurantRef, 'menu');
    menuSnapshot.forEach((docSnapshot) => {
      const newMenuItemRef = doc(menuRef);
      batch.set(newMenuItemRef, docSnapshot.data());
    });
    
    // Migrate stock
    console.log('🔄 Migration du stock...');
    const stockSnapshot = await getDocs(collection(db, 'stock'));
    const stockRef = collection(restaurantRef, 'stock');
    stockSnapshot.forEach((docSnapshot) => {
      const newStockItemRef = doc(stockRef);
      batch.set(newStockItemRef, docSnapshot.data());
    });
    
    // Migrate active orders
    console.log('🔄 Migration des commandes en cours...');
    const activeOrdersSnapshot = await getDocs(collection(db, 'commandes_en_cours'));
    const activeOrdersRef = collection(restaurantRef, 'active_orders');
    activeOrdersSnapshot.forEach((docSnapshot) => {
      const newOrderRef = doc(activeOrdersRef);
      batch.set(newOrderRef, docSnapshot.data());
    });
    
    // Migrate completed orders (limit to last 1000 for performance)
    console.log('🔄 Migration des commandes terminées...');
    const completedOrdersSnapshot = await getDocs(
      query(collection(db, 'commandes_terminees'), orderBy('dateTerminee', 'desc'), limit(1000))
    );
    const completedOrdersRef = collection(restaurantRef, 'completed_orders');
    completedOrdersSnapshot.forEach((docSnapshot) => {
      const newOrderRef = doc(completedOrdersRef);
      batch.set(newOrderRef, docSnapshot.data());
    });
    
    await batch.commit();
    
    // Update restaurant metadata
    await updateDoc(restaurantRef, {
      last_sync: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    clearRestaurantCache();
    console.log('✅ Migration des données terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la migration des données:', error);
    throw error;
  }
};

/**
 * 🔄 SYNC RESTAURANT DATA
 */
export const syncRestaurantData = async (
  restaurantId: string = DEFAULT_RESTAURANT_ID
): Promise<void> => {
  try {
    console.log('🔄 Synchronisation des données du restaurant...');
    
    // This function can be called periodically to sync data between
    // old collection structure and new restaurant structure
    await migrateExistingDataToRestaurant(restaurantId);
    
    console.log('✅ Synchronisation terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
};

// ====== EXPORTS ======

export default {
  // Core functions
  initializeRestaurant,
  getRestaurant,
  updateRestaurant,
  updateRestaurantSettings,
  
  // Sub-collections
  getRestaurantRooms,
  getRestaurantActiveOrders,
  getRestaurantStock,
  getRestaurantMenu,
  
  // Migration
  migrateExistingDataToRestaurant,
  syncRestaurantData,
  
  // Cache management
  clearRestaurantCache
};