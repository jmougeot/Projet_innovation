import { 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { CommandeData } from "./firebaseCommandeOptimized";
import { DEFAULT_RESTAURANT_ID } from "./firebaseRestaurant";

// ---- CACHE CONFIGURATION ----
const ANALYTICS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes en millisecondes

// Variables de cache - now organized by restaurant
let revenueCache: { [restaurantKey: string]: { [filterKey: string]: number } } = {};
let revenueAnalyticsCache: { [restaurantKey: string]: { [filterKey: string]: RevenueData } } = {};
let dailyRevenueCache: { [restaurantKey: string]: { [dateKey: string]: {date: string, revenue: number}[] } } = {};
let topMenuItemsCache: { [restaurantKey: string]: { [limitKey: string]: {platName: string, totalRevenue: number, quantity: number}[] } } = {};
let lastAnalyticsCacheUpdate = 0;

// Collections - using restaurant-based structure
const RESTAURANTS_COLLECTION = 'restaurants';

// Helper functions to get collection references
const getRestaurantRefForAnalytics = (restaurantId: string = DEFAULT_RESTAURANT_ID) => {
  return `${RESTAURANTS_COLLECTION}/${restaurantId}`;
};

const getCommandesCollectionRef = (restaurantId: string = DEFAULT_RESTAURANT_ID, collectionName: string) => {
  return collection(db, `${getRestaurantRefForAnalytics(restaurantId)}/${collectionName}`);
};

// ---- HELPER FUNCTIONS ----
/**
 * Helper function to fetch orders from both active and completed collections
 */
async function fetchAllOrders(restaurantId: string = DEFAULT_RESTAURANT_ID, filter?: AnalyticsFilter) {
  const allOrders: CommandeData[] = [];
  
  // Fetch from both collections
  const collections = ['commandes_en_cours', 'commandes_terminees'];
  
  for (const collectionName of collections) {
    let ordersQuery = getCommandesCollectionRef(restaurantId, collectionName);
    
    // Apply filters if provided
    if (filter) {
      const constraints = [];
      
      if (filter.status) {
        constraints.push(where("status", "==", filter.status));
      }
      
      if (filter.employeeId) {
        constraints.push(where("employeeId", "==", filter.employeeId));
      }
      
      if (filter.startDate) {
        const startTimestamp = Timestamp.fromDate(filter.startDate);
        constraints.push(where("timestamp", ">=", startTimestamp));
      }
      
      if (filter.endDate) {
        const endTimestamp = Timestamp.fromDate(filter.endDate);
        constraints.push(where("timestamp", "<=", endTimestamp));
      }
      
      if (constraints.length > 0) {
        ordersQuery = query(getCommandesCollectionRef(restaurantId, collectionName), ...constraints) as any;
      }
    }
    
    const ordersSnapshot = await getDocs(ordersQuery);
    ordersSnapshot.forEach((doc) => {
      allOrders.push(doc.data() as CommandeData);
    });
  }
  
  return allOrders;
}

/**
 * Helper function to convert Firestore timestamp to Date
 */
function timestampToDate(timestamp: Date | Timestamp): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
}

// ---- CACHE UTILITIES ----
export const clearAnalyticsCache = (restaurantId?: string) => {
  if (restaurantId) {
    delete revenueCache[restaurantId];
    delete revenueAnalyticsCache[restaurantId];
    delete dailyRevenueCache[restaurantId];
    delete topMenuItemsCache[restaurantId];
    console.log(`🧹 Cache d'analytics nettoyé pour le restaurant ${restaurantId}`);
  } else {
    revenueCache = {};
    revenueAnalyticsCache = {};
    dailyRevenueCache = {};
    topMenuItemsCache = {};
    console.log('🧹 Cache d\'analytics nettoyé pour tous les restaurants');
  }
  lastAnalyticsCacheUpdate = 0;
};

export const getAnalyticsCacheInfo = (restaurantId: string = DEFAULT_RESTAURANT_ID) => {
  const now = Date.now();
  const cacheAge = now - lastAnalyticsCacheUpdate;
  const isValid = cacheAge < ANALYTICS_CACHE_DURATION;
  
  return {
    restaurantId,
    revenueCacheSize: Object.keys(revenueCache[restaurantId] || {}).length,
    revenueAnalyticsCacheSize: Object.keys(revenueAnalyticsCache[restaurantId] || {}).length,
    dailyRevenueCacheSize: Object.keys(dailyRevenueCache[restaurantId] || {}).length,
    topMenuItemsCacheSize: Object.keys(topMenuItemsCache[restaurantId] || {}).length,
    cacheAge: Math.round(cacheAge / 1000), // en secondes
    isValid,
    duration: ANALYTICS_CACHE_DURATION / 1000 // en secondes
  };
};

// Helper function to create cache key from filter
const createFilterKey = (filter?: AnalyticsFilter): string => {
  if (!filter) return 'all';
  
  const parts = [];
  if (filter.status) parts.push(`status:${filter.status}`);
  if (filter.employeeId) parts.push(`emp:${filter.employeeId}`);
  if (filter.startDate) parts.push(`start:${filter.startDate.toISOString()}`);
  if (filter.endDate) parts.push(`end:${filter.endDate.toISOString()}`);
  
  return parts.join('|') || 'all';
};

// Interface for revenue analytics
export interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  period: string;
}

// Interface for analytics filters
export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  employeeId?: string;
}

/**
 * Calculate total revenue from all orders
 * @param restaurantId - Restaurant ID to analyze (defaults to DEFAULT_RESTAURANT_ID)
 * @param filter - Optional filter for specific time period or status
 * @returns Promise<number>
 */
export async function calculateRevenue(restaurantId: string = DEFAULT_RESTAURANT_ID, filter?: AnalyticsFilter): Promise<number> {
  try {
    const now = Date.now();
    const filterKey = createFilterKey(filter);
    
    // Initialize restaurant cache if it doesn't exist
    if (!revenueCache[restaurantId]) {
      revenueCache[restaurantId] = {};
    }
    
    // Vérifier le cache d'abord
    if (revenueCache[restaurantId][filterKey] !== undefined && (now - lastAnalyticsCacheUpdate) < ANALYTICS_CACHE_DURATION) {
      console.log(`📦 Chiffre d'affaires récupéré depuis le cache (restaurant: ${restaurantId}, clé: ${filterKey})`);
      return revenueCache[restaurantId][filterKey];
    }
    
    // Fetch orders from both collections
    const allOrders = await fetchAllOrders(restaurantId, filter);
    let totalRevenue = 0;

    allOrders.forEach((orderData) => {
      totalRevenue += orderData.totalPrice || 0;
    });

    // Mettre en cache
    revenueCache[restaurantId][filterKey] = totalRevenue;
    lastAnalyticsCacheUpdate = now;
    console.log(`💾 Chiffre d'affaires mis en cache (${totalRevenue}€, restaurant: ${restaurantId}, clé: ${filterKey})`);

    return totalRevenue;
  } catch (error) {
    console.error("❌ Erreur lors du calcul du chiffre d'affaires:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    const filterKey = createFilterKey(filter);
    if (revenueCache[restaurantId] && revenueCache[restaurantId][filterKey] !== undefined) {
      console.log(`🔄 Utilisation du cache de secours pour le chiffre d'affaires (restaurant: ${restaurantId}, clé: ${filterKey})`);
      return revenueCache[restaurantId][filterKey];
    }
    
    throw error;
  }
}

/**
 * Get comprehensive revenue analytics
 * @param restaurantId - Restaurant ID to analyze (defaults to DEFAULT_RESTAURANT_ID)
 * @param filter - Optional filter for specific time period or status
 * @returns Promise<RevenueData>
 */
export async function getRevenueAnalytics(restaurantId: string = DEFAULT_RESTAURANT_ID, filter?: AnalyticsFilter): Promise<RevenueData> {
  try {
    const now = Date.now();
    const filterKey = createFilterKey(filter);
    
    // Initialize restaurant cache if it doesn't exist
    if (!revenueAnalyticsCache[restaurantId]) {
      revenueAnalyticsCache[restaurantId] = {};
    }
    
    // Vérifier le cache d'abord
    if (revenueAnalyticsCache[restaurantId][filterKey] && (now - lastAnalyticsCacheUpdate) < ANALYTICS_CACHE_DURATION) {
      console.log(`📦 Analytics de revenus récupérées depuis le cache (restaurant: ${restaurantId}, clé: ${filterKey})`);
      return revenueAnalyticsCache[restaurantId][filterKey];
    }
    
    // Fetch orders from both collections
    const allOrders = await fetchAllOrders(restaurantId, filter);
    let totalRevenue = 0;
    let totalOrders = 0;

    allOrders.forEach((orderData) => {
      totalRevenue += orderData.totalPrice || 0;
      totalOrders++;
    });

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const analytics = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      period: filter ? "filtered" : "all-time"
    };
    
    // Mettre en cache
    revenueAnalyticsCache[restaurantId][filterKey] = analytics;
    lastAnalyticsCacheUpdate = now;
    console.log(`💾 Analytics de revenus mises en cache (${totalOrders} commandes, ${totalRevenue}€, restaurant: ${restaurantId}, clé: ${filterKey})`);

    return analytics;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des analytics:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    const filterKey = createFilterKey(filter);
    if (revenueAnalyticsCache[restaurantId] && revenueAnalyticsCache[restaurantId][filterKey]) {
      console.log(`🔄 Utilisation du cache de secours pour les analytics de revenus (restaurant: ${restaurantId}, clé: ${filterKey})`);
      return revenueAnalyticsCache[restaurantId][filterKey];
    }
    
    throw error;
  }
}

/**
 * Get daily revenue for a specific period
 * @param startDate - Start date for the period
 * @param endDate - End date for the period
 * @param restaurantId - Restaurant ID to analyze (defaults to DEFAULT_RESTAURANT_ID)
 * @returns Promise<Array<{date: string, revenue: number}>>
 */
export async function getDailyRevenue(startDate: Date, endDate: Date, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<{date: string, revenue: number}[]> {
  try {
    const now = Date.now();
    const dateKey = `${startDate.toISOString()}_${endDate.toISOString()}`;
    
    // Initialize restaurant cache if it doesn't exist
    if (!dailyRevenueCache[restaurantId]) {
      dailyRevenueCache[restaurantId] = {};
    }
    
    // Vérifier le cache d'abord
    if (dailyRevenueCache[restaurantId][dateKey] && (now - lastAnalyticsCacheUpdate) < ANALYTICS_CACHE_DURATION) {
      console.log(`📦 Revenus quotidiens récupérés depuis le cache (${dailyRevenueCache[restaurantId][dateKey].length} jours, restaurant: ${restaurantId})`);
      return dailyRevenueCache[restaurantId][dateKey];
    }
    
    // Create filter for date range and status
    const filter: AnalyticsFilter = {
      startDate,
      endDate,
      status: "encaissée"
    };
    
    const allOrders = await fetchAllOrders(restaurantId, filter);
    const dailyRevenue: { [key: string]: number } = {};

    allOrders.forEach((orderData) => {
      const orderDate = timestampToDate(orderData.timestamp).toDateString();
      
      if (!dailyRevenue[orderDate]) {
        dailyRevenue[orderDate] = 0;
      }
      
      dailyRevenue[orderDate] += orderData.totalPrice || 0;
    });

    const result = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue
    }));
    
    // Mettre en cache
    dailyRevenueCache[restaurantId][dateKey] = result;
    lastAnalyticsCacheUpdate = now;
    console.log(`💾 Revenus quotidiens mis en cache (${result.length} jours, restaurant: ${restaurantId}, clé: ${dateKey})`);

    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du chiffre d'affaires quotidien:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    const dateKey = `${startDate.toISOString()}_${endDate.toISOString()}`;
    if (dailyRevenueCache[restaurantId] && dailyRevenueCache[restaurantId][dateKey]) {
      console.log(`🔄 Utilisation du cache de secours pour les revenus quotidiens (${dailyRevenueCache[restaurantId][dateKey].length} jours, restaurant: ${restaurantId})`);
      return dailyRevenueCache[restaurantId][dateKey];
    }
    
    throw error;
  }
}

/**
 * Get top performing menu items by revenue
 * @param limitCount - Number of top items to return (default: 10)
 * @param restaurantId - Restaurant ID to analyze (defaults to DEFAULT_RESTAURANT_ID)
 * @returns Promise<Array<{platName: string, totalRevenue: number, quantity: number}>>
 */
export async function getTopMenuItems(limitCount: number = 10, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<{platName: string, totalRevenue: number, quantity: number}[]> {
  try {
    const now = Date.now();
    const cacheKey = `limit_${limitCount}`;
    
    // Initialize restaurant cache if it doesn't exist
    if (!topMenuItemsCache[restaurantId]) {
      topMenuItemsCache[restaurantId] = {};
    }
    
    // Vérifier le cache d'abord
    if (topMenuItemsCache[restaurantId][cacheKey] && (now - lastAnalyticsCacheUpdate) < ANALYTICS_CACHE_DURATION) {
      console.log(`📦 Top plats récupérés depuis le cache (${topMenuItemsCache[restaurantId][cacheKey].length} plats, limite: ${limitCount}, restaurant: ${restaurantId})`);
      return topMenuItemsCache[restaurantId][cacheKey];
    }
    
    // Fetch all encaissée orders from both collections
    const filter: AnalyticsFilter = { status: "encaissée" };
    const allOrders = await fetchAllOrders(restaurantId, filter);

    const itemStats: { [key: string]: { revenue: number; quantity: number } } = {};

    allOrders.forEach((orderData) => {
      orderData.plats?.forEach((platQuantite) => {
        const platName = platQuantite.plat.name;
        const itemRevenue = platQuantite.plat.price * platQuantite.quantite;
        
        if (!itemStats[platName]) {
          itemStats[platName] = { revenue: 0, quantity: 0 };
        }
        
        itemStats[platName].revenue += itemRevenue;
        itemStats[platName].quantity += platQuantite.quantite;
      });
    });

    const result = Object.entries(itemStats)
      .map(([platName, stats]) => ({
        platName,
        totalRevenue: stats.revenue,
        quantity: stats.quantity
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limitCount);
    
    // Mettre en cache
    topMenuItemsCache[restaurantId][cacheKey] = result;
    lastAnalyticsCacheUpdate = now;
    console.log(`💾 Top plats mis en cache (${result.length} plats, limite: ${limitCount}, restaurant: ${restaurantId})`);

    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des plats les plus vendus:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    const cacheKey = `limit_${limitCount}`;
    if (topMenuItemsCache[restaurantId] && topMenuItemsCache[restaurantId][cacheKey]) {
      console.log(`🔄 Utilisation du cache de secours pour les top plats (${topMenuItemsCache[restaurantId][cacheKey].length} plats, limite: ${limitCount}, restaurant: ${restaurantId})`);
      return topMenuItemsCache[restaurantId][cacheKey];
    }
    
    throw error;
  }
}

// Export all functions
export default {
  calculateRevenue,
  getRevenueAnalytics,
  getDailyRevenue,
  getTopMenuItems,
  // Cache utilities
  clearAnalyticsCache,
  getAnalyticsCacheInfo,
};
