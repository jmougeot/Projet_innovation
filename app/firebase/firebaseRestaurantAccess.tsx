import { httpsCallable, getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { auth } from './firebaseConfig';
import { Platform } from 'react-native';

// =============== CONFIGURATION ===============

// Initialiser Firebase Functions
const functions: Functions = getFunctions();

// Pour le développement local (émulateur)
if (__DEV__) {
  // Connexion à l'émulateur Functions pour éviter les erreurs CORS
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('🔧 Mode développement : Fonctions connectées à l\'émulateur local (localhost:5001)');
}

// =============== INTERFACES ===============

interface RestaurantAccessData {
  restaurantId: string;
  role: 'manager' | 'waiter' | 'chef' | 'cleaner';
  expiresAt?: number;
}

interface RestaurantAccessResult {
  success: boolean;
  message: string;
  expiresAt?: number;
  restaurantAccess?: { [key: string]: any };
  totalRestaurants?: number;
  details?: any;
}

// =============== FONCTIONS PRINCIPALES ===============

/**
 * 🎯 Accorder l'accès restaurant à un utilisateur
 * @param restaurantId ID du restaurant
 * @param role Rôle à attribuer (manager, waiter, chef, cleaner)
 * @param expiresAt Timestamp d'expiration (optionnel, 7 jours par défaut)
 */
export const grantRestaurantAccess = async (
  restaurantId: string, 
  role: 'manager' | 'waiter' | 'chef' | 'cleaner',
  expiresAt?: number
): Promise<RestaurantAccessResult> => {
  try {
    console.log(`🎯 Attribution accès ${role} pour restaurant ${restaurantId}`);
    
    // Vérifier que l'utilisateur est connecté
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    // Appeler la Firebase Function
    const setRestaurantAccess = httpsCallable<RestaurantAccessData, RestaurantAccessResult>(
      functions, 
      'setRestaurantAccess'
    );
    
    const result = await setRestaurantAccess({
      restaurantId,
      role,
      expiresAt: expiresAt || Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 jours par défaut
    });

    console.log('✅ Accès accordé:', result.data);
    return result.data;
    
  } catch (error: any) {
    console.error('❌ Erreur attribution accès:', error);
    throw new Error(`Erreur attribution accès: ${error.message}`);
  }
};

/**
 * 🚫 Supprimer l'accès restaurant pour l'utilisateur connecté
 * @param restaurantId ID du restaurant
 */
export const revokeRestaurantAccess = async (restaurantId: string): Promise<RestaurantAccessResult> => {
  try {
    console.log(`🚫 Suppression accès restaurant ${restaurantId}`);
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const removeRestaurantAccess = httpsCallable<{ restaurantId: string }, RestaurantAccessResult>(
      functions, 
      'removeRestaurantAccess'
    );
    
    const result = await removeRestaurantAccess({ restaurantId });

    console.log('✅ Accès supprimé:', result.data);
    return result.data;
    
  } catch (error: any) {
    console.error('❌ Erreur suppression accès:', error);
    throw new Error(`Erreur suppression accès: ${error.message}`);
  }
};

/**
 * 📋 Obtenir tous les accès restaurant de l'utilisateur connecté
 */
export const getMyRestaurantAccess = async (): Promise<RestaurantAccessResult> => {
  try {
    console.log('📋 Récupération des accès restaurant');
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const getUserRestaurantAccess = httpsCallable<{}, RestaurantAccessResult>(
      functions, 
      'getUserRestaurantAccess'
    );
    
    const result = await getUserRestaurantAccess();

    console.log('✅ Accès récupérés:', result.data);
    return result.data;
    
  } catch (error: any) {
    console.error('❌ Erreur récupération accès:', error);
    throw new Error(`Erreur récupération accès: ${error.message}`);
  }
};

/**
 * 🚨 Verrouillage d'urgence d'un restaurant
 * @param restaurantId ID du restaurant à verrouiller
 */
export const lockdownRestaurant = async (restaurantId: string): Promise<RestaurantAccessResult> => {
  try {
    console.log(`🚨 Lockdown d'urgence restaurant ${restaurantId}`);
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const emergencyLockdown = httpsCallable<{ restaurantId: string }, RestaurantAccessResult>(
      functions, 
      'emergencyLockdown'
    );
    
    const result = await emergencyLockdown({ restaurantId });

    console.log('🚨 Lockdown effectué:', result.data);
    return result.data;
    
  } catch (error: any) {
    console.error('❌ Erreur lockdown:', error);
    throw new Error(`Erreur lockdown: ${error.message}`);
  }
};

/**
 * 🔓 Lever le verrouillage d'urgence d'un restaurant
 * @param restaurantId ID du restaurant à débloquer
 */
export const unlockRestaurant = async (restaurantId: string): Promise<RestaurantAccessResult> => {
  try {
    console.log(`🔓 Levée lockdown restaurant ${restaurantId}`);
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const liftEmergencyLockdown = httpsCallable<{ restaurantId: string }, RestaurantAccessResult>(
      functions, 
      'liftEmergencyLockdown'
    );
    
    const result = await liftEmergencyLockdown({ restaurantId });

    console.log('🔓 Lockdown levé:', result.data);
    return result.data;
    
  } catch (error: any) {
    console.error('❌ Erreur levée lockdown:', error);
    throw new Error(`Erreur levée lockdown: ${error.message}`);
  }
};

/**
 * 🔍 Debug des permissions utilisateur (développement)
 * @param targetUserId ID utilisateur à déboguer (optionnel)
 */
export const debugUserPermissions = async (targetUserId?: string): Promise<RestaurantAccessResult> => {
  try {
    console.log('🔍 Debug permissions utilisateur');
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const debugUserClaims = httpsCallable<{ targetUserId?: string }, RestaurantAccessResult>(
      functions, 
      'debugUserClaims'
    );
    
    const result = await debugUserClaims({ targetUserId });

    console.log('🔍 Debug info:', result.data);
    return result.data;
    
  } catch (error: any) {
    console.error('❌ Erreur debug:', error);
    throw new Error(`Erreur debug: ${error.message}`);
  }
};

// =============== FONCTIONS HELPER ===============

/**
 * ⚡ RAPIDE : Lire les Custom Claims depuis le token (0-50ms)
 * Alternative ultra-rapide aux Firebase Functions
 */
const getCustomClaimsFromToken = async (): Promise<any> => {
  try {
    if (!auth.currentUser) {
      return null;
    }

    // Récupérer le token JWT (cache local si récent)
    const token = await auth.currentUser.getIdToken();
    
    // Décoder la partie payload du JWT (opération locale)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return payload;
  } catch (error) {
    console.error('❌ Erreur lecture Custom Claims:', error);
    return null;
  }
};

/**
 * ⚡ RAPIDE : Vérifier si l'utilisateur a un rôle spécifique (0-50ms au lieu de 500-8000ms)
 * @param restaurantId ID du restaurant
 * @param requiredRole Rôle requis
 */
export const hasRestaurantRole = async (
  restaurantId: string, 
  requiredRole: 'manager' | 'waiter' | 'chef' | 'cleaner'
): Promise<boolean> => {
  try {
    // ✅ RAPIDE : Lire Custom Claims au lieu d'appeler Firebase Functions
    const claims = await getCustomClaimsFromToken();
    const restaurantAccess = claims?.restaurantAccess?.[restaurantId];
    
    if (!restaurantAccess) {
      return false;
    }

    // Vérifier l'expiration
    const now = Date.now();
    if (restaurantAccess.expiresAt && restaurantAccess.expiresAt < now) {
      console.log('⏰ Accès expiré pour', restaurantId);
      return false;
    }

    const hasRole = restaurantAccess.role === requiredRole;
    console.log(`⚡ Custom Claims check: ${restaurantId} → ${requiredRole} = ${hasRole}`);
    return hasRole;
    
  } catch (error) {
    console.error('❌ Erreur vérification rôle (Custom Claims):', error);
    return false;
  }
};

/**
 * ⚡ RAPIDE : Obtenir la liste des restaurants accessibles depuis Custom Claims
 */
export const getAccessibleRestaurants = async (): Promise<string[]> => {
  try {
    // ✅ RAPIDE : Lire Custom Claims au lieu d'appeler Firebase Functions
    const claims = await getCustomClaimsFromToken();
    const restaurantAccess = claims?.restaurantAccess || {};
    
    // Filtrer les restaurants non expirés
    const now = Date.now();
    const restaurants = Object.keys(restaurantAccess).filter(restaurantId => {
      const access = restaurantAccess[restaurantId];
      return !access.expiresAt || access.expiresAt > now;
    });
    
    console.log(`⚡ Custom Claims: ${restaurants.length} restaurants accessibles:`, restaurants);
    return restaurants;
    
  } catch (error) {
    console.error('❌ Erreur liste restaurants (Custom Claims):', error);
    return [];
  }
};

/**
 * ⚡ RAPIDE : Vérifier si l'utilisateur est manager d'un restaurant
 * @param restaurantId ID du restaurant
 */
export const isRestaurantManager = async (restaurantId: string): Promise<boolean> => {
  return await hasRestaurantRole(restaurantId, 'manager');
};

/**
 * ⚡ RAPIDE : Obtenir le rôle de l'utilisateur dans un restaurant
 * @param restaurantId ID du restaurant
 */
export const getRestaurantRole = async (restaurantId: string): Promise<string | null> => {
  try {
    const claims = await getCustomClaimsFromToken();
    const restaurantAccess = claims?.restaurantAccess?.[restaurantId];
    
    if (!restaurantAccess) {
      return null;
    }

    // Vérifier l'expiration
    const now = Date.now();
    if (restaurantAccess.expiresAt && restaurantAccess.expiresAt < now) {
      return null;
    }

    return restaurantAccess.role;
  } catch (error) {
    console.error('❌ Erreur récupération rôle:', error);
    return null;
  }
};

/**
 * ⚡ RAPIDE : Vérifier l'accès simple à un restaurant (lecture seule)
 * @param restaurantId ID du restaurant
 */
export const canAccessRestaurant = async (restaurantId: string): Promise<boolean> => {
  try {
    const claims = await getCustomClaimsFromToken();
    const restaurantAccess = claims?.restaurantAccess?.[restaurantId];
    
    if (!restaurantAccess) {
      return false;
    }

    // Vérifier l'expiration
    const now = Date.now();
    if (restaurantAccess.expiresAt && restaurantAccess.expiresAt < now) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur vérification accès:', error);
    return false;
  }
};

/**
 * 📊 HYBRIDE : Obtenir tous les accès avec fallback Firebase Functions
 * Utilise Custom Claims d'abord (rapide), puis Functions si nécessaire (sécurisé)
 */
export const getMyRestaurantAccessOptimized = async (): Promise<{
  source: 'customClaims' | 'functions';
  data: RestaurantAccessResult;
}> => {
  try {
    // 1. ⚡ Essayer Custom Claims d'abord (rapide)
    const claims = await getCustomClaimsFromToken();
    if (claims?.restaurantAccess) {
      console.log('⚡ Utilisation Custom Claims (rapide)');
      return {
        source: 'customClaims',
        data: {
          success: true,
          message: 'Accès récupérés via Custom Claims',
          restaurantAccess: claims.restaurantAccess,
          totalRestaurants: Object.keys(claims.restaurantAccess).length
        }
      };
    }

    // 2. 🐌 Fallback vers Firebase Functions (lent mais sûr)
    console.log('🐌 Fallback vers Firebase Functions (lent)');
    const functionResult = await getMyRestaurantAccess();
    return {
      source: 'functions',
      data: functionResult
    };

  } catch (error) {
    console.error('❌ Erreur récupération accès optimisée:', error);
    throw error;
  }
};

// =============== EXPORT DEFAULT ===============

export default {
  // 🐌 ACTIONS CRITIQUES : Firebase Functions (sécurisées mais lentes)
  grantRestaurantAccess,
  revokeRestaurantAccess,
  getMyRestaurantAccess, // Original - utilise Functions
  lockdownRestaurant,
  unlockRestaurant,
  debugUserPermissions,
  
  // ⚡ VÉRIFICATIONS RAPIDES : Custom Claims (rapides)
  hasRestaurantRole,           // ⚡ 0-50ms au lieu de 500-8000ms
  getAccessibleRestaurants,    // ⚡ 0-50ms au lieu de 500-8000ms
  isRestaurantManager,         // ⚡ 0-50ms au lieu de 500-8000ms
  getRestaurantRole,           // ⚡ 0-50ms - nouveau
  canAccessRestaurant,         // ⚡ 0-50ms - nouveau
  
  // 🚀 HYBRIDE : Optimisé avec fallback
  getMyRestaurantAccessOptimized, // ⚡ Custom Claims + fallback Functions
};
