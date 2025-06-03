import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { CommandeData } from "./firebaseCommande";

// ---- CACHE CONFIGURATION ----
const ANALYTICS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes en millisecondes

// Variables de cache
let revenueCache: { [key: string]: number } = {};
let revenueAnalyticsCache: { [key: string]: RevenueData } = {};
let dailyRevenueCache: { [key: string]: {date: string, revenue: number}[] } = {};
let topMenuItemsCache: { [limitKey: string]: {platName: string, totalRevenue: number, quantity: number}[] } = {};
let lastAnalyticsCacheUpdate = 0;

// ---- CACHE UTILITIES ----
export const clearAnalyticsCache = () => {
  revenueCache = {};
  revenueAnalyticsCache = {};
  dailyRevenueCache = {};
  topMenuItemsCache = {};
  lastAnalyticsCacheUpdate = 0;
  console.log('🧹 Cache d\'analytics nettoyé');
};

export const getAnalyticsCacheInfo = () => {
  const now = Date.now();
  const cacheAge = now - lastAnalyticsCacheUpdate;
  const isValid = cacheAge < ANALYTICS_CACHE_DURATION;
  
  return {
    revenueCacheSize: Object.keys(revenueCache).length,
    revenueAnalyticsCacheSize: Object.keys(revenueAnalyticsCache).length,
    dailyRevenueCacheSize: Object.keys(dailyRevenueCache).length,
    topMenuItemsCacheSize: Object.keys(topMenuItemsCache).length,
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
 * @param filter - Optional filter for specific time period or status
 * @returns Promise<number>
 */
export async function calculateRevenue(filter?: AnalyticsFilter): Promise<number> {
  try {
    const now = Date.now();
    const cacheKey = createFilterKey(filter);
    
    // Vérifier le cache d'abord
    if (revenueCache[cacheKey] !== undefined && (now - lastAnalyticsCacheUpdate) < ANALYTICS_CACHE_DURATION) {
      console.log(`📦 Chiffre d'affaires récupéré depuis le cache (clé: ${cacheKey})`);
      return revenueCache[cacheKey];
    }
    
    let ordersQuery = collection(db, "commandes");
    
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
        constraints.push(where("timestamp", ">=", filter.startDate.toISOString()));
      }
      
      if (filter.endDate) {
        constraints.push(where("timestamp", "<=", filter.endDate.toISOString()));
      }
      
      if (constraints.length > 0) {
        ordersQuery = query(collection(db, "commandes"), ...constraints) as any;
      }
    }

    const ordersSnapshot = await getDocs(ordersQuery);
    let totalRevenue = 0;

    ordersSnapshot.forEach((doc) => {
      const orderData = doc.data() as CommandeData;
      totalRevenue += orderData.totalPrice || 0;
    });

    // Mettre en cache
    revenueCache[cacheKey] = totalRevenue;
    lastAnalyticsCacheUpdate = now;
    console.log(`💾 Chiffre d'affaires mis en cache (${totalRevenue}€, clé: ${cacheKey})`);

    return totalRevenue;
  } catch (error) {
    console.error("❌ Erreur lors du calcul du chiffre d'affaires:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    const cacheKey = createFilterKey(filter);
    if (revenueCache[cacheKey] !== undefined) {
      console.log(`🔄 Utilisation du cache de secours pour le chiffre d'affaires (clé: ${cacheKey})`);
      return revenueCache[cacheKey];
    }
    
    throw error;
  }
}

/**
 * Get comprehensive revenue analytics
 * @param filter - Optional filter for specific time period or status
 * @returns Promise<RevenueData>
 */
export async function getRevenueAnalytics(filter?: AnalyticsFilter): Promise<RevenueData> {
  try {
    const now = Date.now();
    const cacheKey = createFilterKey(filter);
    
    // Vérifier le cache d'abord
    if (revenueAnalyticsCache[cacheKey] && (now - lastAnalyticsCacheUpdate) < ANALYTICS_CACHE_DURATION) {
      console.log(`📦 Analytics de revenus récupérées depuis le cache (clé: ${cacheKey})`);
      return revenueAnalyticsCache[cacheKey];
    }
    
    let ordersQuery = collection(db, "commandes");
    
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
        constraints.push(where("timestamp", ">=", filter.startDate.toISOString()));
      }
      
      if (filter.endDate) {
        constraints.push(where("timestamp", "<=", filter.endDate.toISOString()));
      }
      
      if (constraints.length > 0) {
        ordersQuery = query(collection(db, "commandes"), ...constraints) as any;
      }
    }

    const ordersSnapshot = await getDocs(ordersQuery);
    let totalRevenue = 0;
    let totalOrders = 0;

    ordersSnapshot.forEach((doc) => {
      const orderData = doc.data() as CommandeData;
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
    revenueAnalyticsCache[cacheKey] = analytics;
    lastAnalyticsCacheUpdate = now;
    console.log(`💾 Analytics de revenus mises en cache (${totalOrders} commandes, ${totalRevenue}€, clé: ${cacheKey})`);

    return analytics;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des analytics:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    const cacheKey = createFilterKey(filter);
    if (revenueAnalyticsCache[cacheKey]) {
      console.log(`🔄 Utilisation du cache de secours pour les analytics de revenus (clé: ${cacheKey})`);
      return revenueAnalyticsCache[cacheKey];
    }
    
    throw error;
  }
}

/**
 * Get daily revenue for a specific period
 * @param startDate - Start date for the period
 * @param endDate - End date for the period
 * @returns Promise<Array<{date: string, revenue: number}>>
 */
export async function getDailyRevenue(startDate: Date, endDate: Date): Promise<{date: string, revenue: number}[]> {
  try {
    const now = Date.now();
    const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}`;
    
    // Vérifier le cache d'abord
    if (dailyRevenueCache[cacheKey] && (now - lastAnalyticsCacheUpdate) < ANALYTICS_CACHE_DURATION) {
      console.log(`📦 Revenus quotidiens récupérés depuis le cache (${dailyRevenueCache[cacheKey].length} jours)`);
      return dailyRevenueCache[cacheKey];
    }
    
    const ordersQuery = query(
      collection(db, "commandes"),
      where("timestamp", ">=", startDate.toISOString()),
      where("timestamp", "<=", endDate.toISOString()),
      where("status", "==", "encaissée"),
      orderBy("timestamp", "asc")
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    const dailyRevenue: { [key: string]: number } = {};

    ordersSnapshot.forEach((doc) => {
      const orderData = doc.data() as CommandeData;
      const orderDate = new Date(orderData.timestamp).toDateString();
      
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
    dailyRevenueCache[cacheKey] = result;
    lastAnalyticsCacheUpdate = now;
    console.log(`💾 Revenus quotidiens mis en cache (${result.length} jours, clé: ${cacheKey})`);

    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du chiffre d'affaires quotidien:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}`;
    if (dailyRevenueCache[cacheKey]) {
      console.log(`🔄 Utilisation du cache de secours pour les revenus quotidiens (${dailyRevenueCache[cacheKey].length} jours)`);
      return dailyRevenueCache[cacheKey];
    }
    
    throw error;
  }
}

/**
 * Get top performing menu items by revenue
 * @param limit - Number of top items to return (default: 10)
 * @returns Promise<Array<{platName: string, totalRevenue: number, quantity: number}>>
 */
export async function getTopMenuItems(limitCount: number = 10): Promise<{platName: string, totalRevenue: number, quantity: number}[]> {
  try {
    const now = Date.now();
    const cacheKey = `limit_${limitCount}`;
    
    // Vérifier le cache d'abord
    if (topMenuItemsCache[cacheKey] && (now - lastAnalyticsCacheUpdate) < ANALYTICS_CACHE_DURATION) {
      console.log(`📦 Top plats récupérés depuis le cache (${topMenuItemsCache[cacheKey].length} plats, limite: ${limitCount})`);
      return topMenuItemsCache[cacheKey];
    }
    
    const ordersSnapshot = await getDocs(
      query(
        collection(db, "commandes"),
        where("status", "==", "encaissée")
      )
    );

    const itemStats: { [key: string]: { revenue: number; quantity: number } } = {};

    ordersSnapshot.forEach((doc) => {
      const orderData = doc.data() as CommandeData;
      
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
    topMenuItemsCache[cacheKey] = result;
    lastAnalyticsCacheUpdate = now;
    console.log(`💾 Top plats mis en cache (${result.length} plats, limite: ${limitCount})`);

    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des plats les plus vendus:", error);
    
    // En cas d'erreur, retourner le cache si disponible
    const cacheKey = `limit_${limitCount}`;
    if (topMenuItemsCache[cacheKey]) {
      console.log(`🔄 Utilisation du cache de secours pour les top plats (${topMenuItemsCache[cacheKey].length} plats, limite: ${limitCount})`);
      return topMenuItemsCache[cacheKey];
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
