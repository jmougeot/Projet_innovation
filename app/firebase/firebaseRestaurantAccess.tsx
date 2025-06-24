import { httpsCallable, getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  collectionGroup
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// =============== CONFIGURATION ===============

// Initialiser Firebase Functions
const functions: Functions = getFunctions();

// Pour le développement local (émulateur)
if (__DEV__) {
  // Connexion à l'émulateur Functions pour éviter les erreurs CORS
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('�� Mode développement : Fonctions connectées à l\'émulateur local (localhost:5001)');
}

// =============== INTERFACES V2 (ARCHITECTURE SANS DUPLICATION) ===============

interface RestaurantUserAccessV2 {
  role: 'manager' | 'waiter' | 'chef' | 'cleaner';
  grantedAt: number;
  grantedBy: string;
  expiresAt: number;
  isActive: boolean;
  permissions: string[];
  lastActivity: number;
  loginCount: number;
  metadata?: {
    ip?: string;
    userAgent?: string;
    geoLocation?: string;
  };
}

interface RestaurantAccessDataV2 {
  restaurantId: string;
  role: 'manager' | 'waiter' | 'chef' | 'cleaner';
  expiresAt?: number;
  targetUserId?: string; // UID Firebase
  targetUserEmail?: string; // Email utilisateur (sera résolu en UID côté serveur)
}

interface RestaurantAccessResult {
  success: boolean;
  message: string;
  expiresAt?: number;
  restaurantAccess?: { [key: string]: any };
  totalRestaurants?: number;
  details?: any;
  architecture?: string; // Indique la version utilisée (v2-robust)
}

// =============== FONCTIONS PRINCIPALES V2 (FIRESTORE DIRECT) ===============

/**
 * 🎯 V2 : Accorder l'accès restaurant à un utilisateur (sous-collection directe)
 */
export const grantRestaurantAccessV2 = async (
  restaurantId: string, 
  role: 'manager' | 'waiter' | 'chef' | 'cleaner',
  expiresAt?: number,
  targetUserId?: string
): Promise<RestaurantAccessResult> => {
  try {
    console.log(`🎯 V2: Attribution accès ${role} pour restaurant ${restaurantId}`);
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const currentTime = Date.now();
    const expirationTime = expiresAt || (currentTime + (7 * 24 * 60 * 60 * 1000));

    // ✅ UNIQUEMENT la Firebase Function V2 qui gère tout (Firestore + Custom Claims)
    const setRestaurantAccessV2Func = httpsCallable<RestaurantAccessDataV2, RestaurantAccessResult>(
      functions, 
      'setRestaurantAccessV2'
    );
    
    // ⚠️ IMPORTANT: Utiliser l'UID Firebase Auth pour les custom claims, pas l'email converti
    const firebaseUid = targetUserId || auth.currentUser.uid;
    
    const result = await setRestaurantAccessV2Func({
      restaurantId,
      role,
      expiresAt: expirationTime,
      targetUserId: firebaseUid  // Passer l'UID Firebase, pas l'email converti
    });

    console.log('✅ V2: Accès accordé et Custom Claims mis à jour via Functions');
    return {
      success: true,
      message: 'Accès accordé avec succès',
      expiresAt: expirationTime,
      architecture: 'v2-functions-only',
      details: result.data
    };
    
  } catch (error: any) {
    console.error('❌ V2: Erreur attribution accès:', error);
    throw new Error(`Erreur attribution accès V2: ${error.message}`);
  }
};

/**
 * 🚫 V2 : Supprimer l'accès restaurant (sous-collection directe)
 */
export const revokeRestaurantAccessV2 = async (
  restaurantId: string,
  targetUserId?: string
): Promise<RestaurantAccessResult> => {
  try {
    console.log(`🚫 V2: Suppression accès restaurant ${restaurantId}`);
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    // ✅ UNIQUEMENT la Firebase Function V2 qui gère tout (Firestore + Custom Claims)
    const removeRestaurantAccessV2Func = httpsCallable<{ restaurantId: string; targetUserId?: string }, RestaurantAccessResult>(
      functions, 
      'removeRestaurantAccessV2'
    );
    
    const result = await removeRestaurantAccessV2Func({ 
      restaurantId, 
      targetUserId 
    });

    console.log('✅ V2: Accès supprimé et Custom Claims mis à jour via Functions');
    return {
      success: true,
      message: 'Accès supprimé avec succès',
      architecture: 'v2-functions-only',
      details: result.data
    };
    
  } catch (error: any) {
    console.error('❌ V2: Erreur suppression accès:', error);
    throw new Error(`Erreur suppression accès V2: ${error.message}`);
  }
};

/**
 * 📋 V2 : Obtenir tous les restaurants de l'utilisateur (Collection Group Query)
 */
export const getMyRestaurantAccessV2 = async (targetUserId?: string): Promise<RestaurantAccessResult> => {
  try {
    console.log('📋 V2: Récupération des restaurants via Collection Group');
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const userId = targetUserId || auth.currentUser.uid;
    const currentTime = Date.now();

    // Collection Group Query : chercher dans toutes les sous-collections userAccess
    const userAccessQuery = query(collectionGroup(db, 'userAccess'),where('__name__', '==', userId));

    const querySnapshot = await getDocs(userAccessQuery);
    const restaurantAccess: { [key: string]: any } = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Extraire l'ID du restaurant du chemin du document
      const restaurantId = doc.ref.parent.parent?.id;
      
      if (restaurantId && data.isActive && (!data.expiresAt || data.expiresAt > currentTime)) {
        restaurantAccess[restaurantId] = data;
      }
    });

    console.log('✅ V2: Restaurants récupérés via Collection Group');
    return {
      success: true,
      message: 'Restaurants récupérés avec succès',
      restaurantAccess,
      totalRestaurants: Object.keys(restaurantAccess).length,
      architecture: 'v2-collectiongroup'
    };
    
  } catch (error: any) {
    console.error('❌ V2: Erreur récupération restaurants:', error);
    throw new Error(`Erreur récupération restaurants V2: ${error.message}`);
  }
};

/**
 * 👥 V2 : Obtenir tous les utilisateurs d'un restaurant (sous-collection directe)
 */
export const getRestaurantUsersV2 = async (
  restaurantId: string,
  includeInactive = false
): Promise<RestaurantAccessResult> => {
  try {
    console.log(`👥 V2: Récupération utilisateurs restaurant ${restaurantId}`);
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    // Récupérer tous les documents de la sous-collection userAccess
    const userAccessRef = collection(db, 'restaurants', restaurantId, 'userAccess');
    const querySnapshot = await getDocs(userAccessRef);
    
    const users: { [key: string]: any } = {};
    const currentTime = Date.now();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const userId = doc.id;
      
      // Filtrer selon les critères
      const isExpired = data.expiresAt && data.expiresAt < currentTime;
      const shouldInclude = includeInactive || (data.isActive && !isExpired);
      
      if (shouldInclude) {
        users[userId] = {
          ...data,
          userId
        };
      }
    });

    console.log('✅ V2: Utilisateurs récupérés de la sous-collection');
    return {
      success: true,
      message: 'Utilisateurs récupérés avec succès',
      details: users,
      totalRestaurants: Object.keys(users).length,
      architecture: 'v2-subcollection'
    };
    
  } catch (error: any) {
    console.error('❌ V2: Erreur récupération utilisateurs:', error);
    throw new Error(`Erreur récupération utilisateurs V2: ${error.message}`);
  }
};

/**
 * 🎯 V2 : Créer le premier manager d'un restaurant (bootstrap)
 */
export const bootstrapRestaurantManagerV2 = async (restaurantId: string, ownerEmail?: string
): Promise<RestaurantAccessResult> => {
  try {
    console.log(`🎯 V2: Création premier manager pour restaurant ${restaurantId}`);
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    // ✅ Appeler la Firebase Function V2 pour créer le premier manager
    const bootstrapFunc = httpsCallable<{ restaurantId: string; ownerEmail?: string }, RestaurantAccessResult>(
      functions, 
      'bootstrapRestaurantManagerV2'
    );
    
    const result = await bootstrapFunc({
      restaurantId, 
      ownerEmail
    });

    console.log('✅ V2: Premier manager créé via Functions');
    return {
      success: true,
      message: 'Premier manager créé avec succès',
      architecture: 'v2-bootstrap',
      details: result.data
    };
    
  } catch (error: any) {
    console.error('❌ V2: Erreur création premier manager:', error);
    throw new Error(`Erreur création premier manager V2: ${error.message}`);
  }
};

/**
 * 📧 V2 : Accorder l'accès restaurant par email utilisateur
 */
export const grantRestaurantAccessByEmail = async (
  restaurantId: string, 
  userEmail: string,
  role: 'manager' | 'waiter' | 'chef' | 'cleaner',
  expiresAt?: number
): Promise<RestaurantAccessResult> => {
  try {
    console.log(`📧 V2: Attribution accès ${role} par email ${userEmail} pour restaurant ${restaurantId}`);
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const currentTime = Date.now();
    const expirationTime = expiresAt || (currentTime + (7 * 24 * 60 * 60 * 1000));

    // ✅ Utiliser la Firebase Function V2 avec email
    const setRestaurantAccessV2Func = httpsCallable<RestaurantAccessDataV2, RestaurantAccessResult>(
      functions, 
      'setRestaurantAccessV2'
    );
    
    const result = await setRestaurantAccessV2Func({
      restaurantId,
      role,
      expiresAt: expirationTime,
      targetUserEmail: userEmail  // 📧 Passer l'email directement
    });

    console.log('✅ V2: Accès accordé par email et Custom Claims mis à jour via Functions');
    return {
      success: true,
      message: `Accès accordé avec succès à ${userEmail}`,
      expiresAt: expirationTime,
      architecture: 'v2-functions-email',
      details: result.data
    };
    
  } catch (error: any) {
    console.error('❌ V2: Erreur attribution accès par email:', error);
    throw new Error(`Erreur attribution accès V2 par email: ${error.message}`);
  }
};

// =============== FONCTIONS LEGACY (COMPATIBILITÉ) ===============

/**
 * 🎯 LEGACY : Accorder l'accès restaurant (garde la compatibilité V1)
 */
export const grantRestaurantAccess = async (
  restaurantId: string, 
  role: 'manager' | 'waiter' | 'chef' | 'cleaner',
  expiresAt?: number
): Promise<RestaurantAccessResult> => {
  return grantRestaurantAccessV2(restaurantId, role, expiresAt);
};

/**
 * 🚫 LEGACY : Supprimer l'accès restaurant (garde la compatibilité V1)
 */
export const revokeRestaurantAccess = async (restaurantId: string): Promise<RestaurantAccessResult> => {
  return revokeRestaurantAccessV2(restaurantId);
};

/**
 * 📋 LEGACY : Obtenir tous les accès restaurant (garde la compatibilité V1)
 */
export const getMyRestaurantAccess = async (): Promise<RestaurantAccessResult> => {
  return getMyRestaurantAccessV2();
};

// =============== FONCTIONS CRITIQUES (FIREBASE FUNCTIONS) ===============

/**
 * 🚨 Verrouillage d'urgence d'un restaurant
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
 */
const getCustomClaimsFromToken = async (): Promise<any> => {
  try {
    if (!auth.currentUser) {
      return null;
    }

    const token = await auth.currentUser.getIdToken();
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return payload;
  } catch (error) {
    console.error('❌ Erreur lecture Custom Claims:', error);
    return null;
  }
};

/**
 * ⚡ RAPIDE : Vérifier si l'utilisateur a un rôle spécifique
 */
export const hasRestaurantRole = async (
  restaurantId: string, 
  requiredRole: 'manager' | 'waiter' | 'chef' | 'cleaner'
): Promise<boolean> => {
  try {
    const claims = await getCustomClaimsFromToken();
    const restaurantAccess = claims?.restaurantAccess?.[restaurantId];
    
    if (!restaurantAccess) {
      return false;
    }

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
 * ⚡ V2 : Obtenir la liste des restaurants accessibles depuis Custom Claims
 */
export const getAccessibleRestaurantsV2 = async (): Promise<string[]> => {
  try {
    const claims = await getCustomClaimsFromToken();
    const restaurantAccess = claims?.restaurantAccess || {};
    
    const now = Date.now();
    const restaurants = Object.keys(restaurantAccess).filter(restaurantId => {
      const access = restaurantAccess[restaurantId];
      return !access.expiresAt || access.expiresAt > now;
    });
    
    console.log(`⚡ V2: Custom Claims: ${restaurants.length} restaurants accessibles:`, restaurants);
    return restaurants;
    
  } catch (error) {
    console.error('❌ V2: Erreur liste restaurants (Custom Claims):', error);
    return [];
  }
};

/**
 * ⚡ LEGACY : Obtenir la liste des restaurants accessibles
 */
export const getAccessibleRestaurants = async (): Promise<string[]> => {
  return getAccessibleRestaurantsV2();
};

/**
 * ⚡ RAPIDE : Vérifier si l'utilisateur est manager d'un restaurant
 */
export const isRestaurantManager = async (restaurantId: string): Promise<boolean> => {
  return await hasRestaurantRole(restaurantId, 'manager');
};

/**
 * ⚡ RAPIDE : Obtenir le rôle de l'utilisateur dans un restaurant
 */
export const getRestaurantRole = async (restaurantId: string): Promise<string | null> => {
  try {
    const claims = await getCustomClaimsFromToken();
    const restaurantAccess = claims?.restaurantAccess?.[restaurantId];
    
    if (!restaurantAccess) {
      return null;
    }

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
 * ⚡ RAPIDE : Vérifier l'accès simple à un restaurant
 */
export const canAccessRestaurant = async (restaurantId: string): Promise<boolean> => {
  try {
    const claims = await getCustomClaimsFromToken();
    const restaurantAccess = claims?.restaurantAccess?.[restaurantId];
    
    if (!restaurantAccess) {
      return false;
    }

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
 * 📊 V2 : Obtenir tous les accès avec méthode optimisée
 */
export const getMyRestaurantAccessOptimizedV2 = async (): Promise<{
  source: 'v2-functions' | 'customClaims';
  data: RestaurantAccessResult;
}> => {
  try {
    // 1. ⚡ Essayer Custom Claims d'abord (rapide)
    const claims = await getCustomClaimsFromToken();
    if (claims?.restaurantAccess) {
      console.log('⚡ V2: Utilisation Custom Claims (rapide)');
      return {
        source: 'customClaims',
        data: {
          success: true,
          message: 'Accès récupérés via Custom Claims',
          restaurantAccess: claims.restaurantAccess,
          totalRestaurants: Object.keys(claims.restaurantAccess).length,
          architecture: 'v2-customclaims'
        }
      };
    }

    // 2. 📋 Utiliser les nouvelles Functions V2 (Collection Group Query)
    console.log('📋 V2: Utilisation Functions V2 (Collection Group)');
    const functionResult = await getMyRestaurantAccessV2();
    return {
      source: 'v2-functions',
      data: functionResult
    };

  } catch (error) {
    console.error('❌ V2: Erreur récupération accès optimisée:', error);
    throw error;
  }
};


/**
 * 🔄 Forcer le refresh des Custom Claims côté client
 */
export const refreshCustomClaims = async (): Promise<any> => {
  try {
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    console.log('🔄 Refresh des Custom Claims...');
    
    // Forcer le refresh du token
    await auth.currentUser.getIdToken(true);
    
    // Récupérer les nouveaux claims
    const tokenResult = await auth.currentUser.getIdTokenResult();
    
    console.log('✅ Custom Claims refreshés:', tokenResult.claims);
    return tokenResult.claims;
    
  } catch (error) {
    console.error('❌ Erreur refresh Custom Claims:', error);
    throw error;
  }
};

/**
 * 🔍 Vérifier les Custom Claims actuels
 */
export const getCurrentCustomClaims = async (): Promise<any> => {
  try {
    if (!auth.currentUser) {
      return null;
    }

    const tokenResult = await auth.currentUser.getIdTokenResult();
    return tokenResult.claims;
    
  } catch (error) {
    console.error('❌ Erreur récupération Custom Claims:', error);
    return null;
  }
};

// =============== EXPORT DEFAULT ===============

export default {
  // 🎯 V2 FUNCTIONS : Architecture robuste (recommandées)
  grantRestaurantAccessV2,
  revokeRestaurantAccessV2,
  getMyRestaurantAccessV2,
  getRestaurantUsersV2,
  getAccessibleRestaurantsV2,
  getMyRestaurantAccessOptimizedV2,

  // 🔄 LEGACY FUNCTIONS : Garde la compatibilité (délèguent vers V2)
  grantRestaurantAccess,
  revokeRestaurantAccess,
  getMyRestaurantAccess,
  getAccessibleRestaurants,
  
  // 🔥 ACTIONS CRITIQUES : Firebase Functions (sécurisées)
  lockdownRestaurant,
  unlockRestaurant,
  debugUserPermissions,
  
  // ⚡ VÉRIFICATIONS RAPIDES : Custom Claims (rapides)
  hasRestaurantRole,
  isRestaurantManager,
  getRestaurantRole,
  canAccessRestaurant,
};
