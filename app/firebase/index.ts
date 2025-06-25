// Firebase modules index - Centralized exports for easy importing
// This file provides convenient access to all Firebase functionality

// Core Firebase configuration
export { db, auth, storage } from './firebaseConfig';
export type { UserData } from './firebaseConfig';

// Authentication
export { 
  signUpUser, 
  signInUser, 
  signOutUser, 
  getUserProfile 
} from './firebaseAuth';
export type { 
  UserRegistrationData, 
  UserLoginData, 
  UserProfile 
} from './firebaseAuth';

// User management
export { 
  updatePoints, 
  calculateLevel, 
  updatePointsAndLevel, 
  getUserById, 
  getAllUsers 
} from './firebaseUser';
export type { PointsUpdate } from './firebaseUser';

// Menu management
export { 
  ajout_plat, 
  get_plats
} from './firebaseMenu';
export type { Plat } from './firebaseMenu';

// Ticket management (new modular structure)
export type { 
  PlatQuantite, 
  TicketData, 
  CreateTicketData
} from './ticket';

// Stock management
export { 
  addStock, 
  getStock, 
  getAllStock, 
  updateStock, 
  deleteStock 
} from './firebaseStock';
export type { StockData, AddStockData } from './firebaseStock';

// Analytics and reporting
export { 
  calculateRevenue, 
  getRevenueAnalytics, 
  getDailyRevenue, 
  getTopMenuItems 
} from './firebaseAnalytics';
export type { RevenueData, AnalyticsFilter } from './firebaseAnalytics';

// Restaurant management
export { 
  getRestaurant,
  updateRestaurant,
  updateRestaurantSettings,
  clearRestaurantCache
} from './firebaseRestaurant';
export type { 
  Restaurant, 
  RestaurantSettings 
} from './firebaseRestaurant';

// Mission management (re-export from existing module)
export * from './firebaseMissionOptimized';

// Real-time cache system
export { 
  // Cache getter functions (recommended)
  getRealtimeMenuCache,
  getRealtimeStockCache,
  getRealtimeOrdersCache,
  getRealtimeTablesCache,
  
  // Cache instances (backward compatibility)
  realtimeMenuCache, 
  realtimeStockCache,
  realtimeOrdersCache,
  realtimeTablesCache,
  
  // React hooks
  useRealtimeMenu,
  useRealtimeStock,
  useRealtimeOrders,
  useRealtimeTables,
  
  // Utilities
  clearAllCaches,
  getAllCacheStatus,
  forceReconnectAll,
  debugCacheHealth
} from './firebaseRealtimeCache';

// Room & Table management (new modular structure)
export * from './room&table';

// Default exports for backward compatibility
export { default as firebaseAuth } from './firebaseAuth';
export { default as firebaseMenu } from './firebaseMenu';
export { default as firebaseticket } from './ticket/index';
export { default as firebaseStock } from './firebaseStock';
export { default as firebaseRoomTable } from './room&table/index';
export { default as firebaseUser } from './firebaseUser';
export { default as firebaseAnalytics } from './firebaseAnalytics';
export { default as firebaseRestaurant } from './firebaseRestaurant';

// Default export to prevent Expo Router warnings
export default function FirebaseIndex() {
  return null;
}
