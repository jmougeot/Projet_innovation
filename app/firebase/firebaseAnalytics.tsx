import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { CommandeData } from "./firebaseCommande";

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

    console.log(`Chiffre d'affaires calculé: ${totalRevenue}€`);
    return totalRevenue;
  } catch (error) {
    console.error("Erreur lors du calcul du chiffre d'affaires:", error);
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

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      period: filter ? "filtered" : "all-time"
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des analytics:", error);
    throw error;
  }
}

/**
 * Get daily revenue for a specific period
 * @param startDate - Start date for the period
 * @param endDate - End date for the period
 * @returns Promise<Array<{date: string, revenue: number}>>
 */
export async function getDailyRevenue(startDate: Date, endDate: Date): Promise<Array<{date: string, revenue: number}>> {
  try {
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

    return Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération du chiffre d'affaires quotidien:", error);
    throw error;
  }
}

/**
 * Get top performing menu items by revenue
 * @param limit - Number of top items to return (default: 10)
 * @returns Promise<Array<{platName: string, totalRevenue: number, quantity: number}>>
 */
export async function getTopMenuItems(limitCount: number = 10): Promise<Array<{platName: string, totalRevenue: number, quantity: number}>> {
  try {
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

    return Object.entries(itemStats)
      .map(([platName, stats]) => ({
        platName,
        totalRevenue: stats.revenue,
        quantity: stats.quantity
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Erreur lors de la récupération des plats les plus vendus:", error);
    throw error;
  }
}

// Export all functions
export default {
  calculateRevenue,
  getRevenueAnalytics,
  getDailyRevenue,
  getTopMenuItems,
};
