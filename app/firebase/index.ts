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

// Order/Command management
export {
  addCommande,
  getCommandeByTableId,
  CommandeEncaisse,
  updateCommande,
  getCommandesByStatus,
  updateStatusPlat,
  changeStatusCommande,
  addOrder,
  deleteOrder,
  getArchivedOrders
} from './firebaseCommande';
export type { 
  PlatQuantite, 
  CommandeData, 
  ArchivedOrderData, 
  CreateOrderData 
} from './firebaseCommande';

// Stock management
export { 
  addStock, 
  getStock, 
  getAllStock, 
  updateStock, 
  deleteStock 
} from './firebaseStock';
export type { StockData, AddStockData } from './firebaseStock';

// Table management
export { 
  getTables, 
  saveTable, 
  updateTables, 
  updateTablePosition, 
  updateTableStatus, 
  deleteTable, 
  initializeDefaultTables 
} from './firebaseTables';
export type { Table } from './firebaseTables';

// Analytics and reporting
export { 
  calculateRevenue, 
  getRevenueAnalytics, 
  getDailyRevenue, 
  getTopMenuItems 
} from './firebaseAnalytics';
export type { RevenueData, AnalyticsFilter } from './firebaseAnalytics';

// Mission management (re-export from existing module)
export * from './firebaseMission';

// Default exports for backward compatibility
export { default as firebaseAuth } from './firebaseAuth';
export { default as firebaseMenu } from './firebaseMenu';
export { default as firebaseCommande } from './firebaseCommande';
export { default as firebaseStock } from './firebaseStock';
export { default as firebaseTables } from './firebaseTables';
export { default as firebaseUser } from './firebaseUser';
export { default as firebaseAnalytics } from './firebaseAnalytics';
