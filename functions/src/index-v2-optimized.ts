/**
 * 🔄 VERSION FINALE : Firebase Functions avec Architecture Ultra-Robuste
 * 
 * ARCHITECTURE SANS DUPLICATION :
 * - Source UNIQUE de vérité : restaurants/{id}/userAccess/{userId}
 * - Cache performance : Custom Claims (sync automatique)
 * - Navigation : Query directe des sous-collections (pas d'index fragile)
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

// ✅ Initialiser Firebase Admin
initializeApp();

// =============== INTERFACES OPTIMISÉES ===============

interface RestaurantAccessData {
  restaurantId: string;
  role: 'manager' | 'waiter' | 'chef' | 'cleaner';
  expiresAt?: number;
  targetUserId?: string; // Peut être un UID Firebase ou un email
  targetUserEmail?: string; // NOUVEAU: email utilisateur (sera résolu en UID)
}

interface UserAccessRecord {
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

// =============== FONCTIONS UTILITAIRES ===============

/**
 * 🔍 Détecter si une chaîne est un email et la résoudre en UID
 */
async function resolveUserIdentifier(identifier: string): Promise<string> {
  // Si c'est déjà un UID (format Firebase), le retourner tel quel
  if (!identifier.includes('@')) {
    return identifier;
  }
  
  // Si c'est un email, résoudre vers UID
  try {
    const userRecord = await getAuth().getUserByEmail(identifier);
    console.log(`✅ Email ${identifier} résolu vers UID ${userRecord.uid}`);
    return userRecord.uid;
  } catch (error) {
    console.error(`❌ Impossible de résoudre l'email ${identifier}:`, error);
    throw new HttpsError('not-found', `Aucun utilisateur trouvé pour l'email: ${identifier}`);
  }
}

/**
 * 🎯 Obtenir les permissions selon le rôle
 */
function getPermissionsForRole(role: string): string[] {
  switch (role) {
    case 'manager':
      return ['read', 'write', 'delete', 'manage_users', 'view_analytics', 'emergency_lockdown'];
    case 'waiter':
      return ['read', 'write_orders', 'view_tables', 'process_payments'];
    case 'chef':
      return ['read', 'write_kitchen', 'view_orders', 'manage_stock'];
    case 'cleaner':
      return ['read', 'view_missions', 'update_missions'];
    default:
      return ['read'];
  }
}

/**
 * 🔍 Vérifier si un utilisateur a accès à un restaurant (lecture optimisée)
 */
async function checkUserRestaurantAccess(userId: string, restaurantId: string): Promise<UserAccessRecord | null> {
  try {
    const accessDoc = await getFirestore()
      .collection('restaurants').doc(restaurantId).collection('userAccess').doc(userId).get();
    
    if (!accessDoc.exists) {
      return null;
    }
    
    const data = accessDoc.data() as UserAccessRecord;
    
    // Vérifier si l'accès est valide
    if (!data.isActive || data.expiresAt < Date.now()) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erreur vérification accès:', error);
    return null;
  }
}

/**
 * 🔍 Obtenir tous les restaurants d'un utilisateur (SANS index fragile)
 * Utilise une query Collection Group pour éviter la duplication
 */
async function getUserRestaurantsDirect(userId: string): Promise<Array<{ restaurantId: string; access: UserAccessRecord }>> {
  try {
    const userAccessQuery = getFirestore()
      .collectionGroup('userAccess').where('__name__', '==', userId)
      .where('isActive', '==', true).where('expiresAt', '>', Date.now());
    
    const snapshot = await userAccessQuery.get();
    
    const results = snapshot.docs.map(doc => {
      const pathParts = doc.ref.path.split('/');
      const restaurantId = pathParts[1]; // restaurants/[REST_ID]/userAccess/user
      
      return {
        restaurantId,
        access: doc.data() as UserAccessRecord
      };
    });
    
    return results;
    
  } catch (error) {
    console.error('Erreur getUserRestaurantsDirect:', error);
    return [];
  }
}

/**
 * 🔍 Alternative : Query par batch si Collection Group pas disponible
 */

/**
 * 🧹 Nettoyer les accès expirés automatiquement
 */
async function cleanupExpiredAccess(restaurantId: string): Promise<number> {
  const now = Date.now();
  const batch = getFirestore().batch();
  let cleanedCount = 0;
  
  try {
    const expiredSnapshot = await getFirestore()
      .collection('restaurants')
      .doc(restaurantId)
      .collection('userAccess')
      .where('expiresAt', '<', now)
      .limit(50) // Traiter par petits lots
      .get();
    
    expiredSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false, deactivatedAt: now });
      cleanedCount++;
    });
    
    if (cleanedCount > 0) {
      await batch.commit();
      console.log(`🧹 Nettoyage: ${cleanedCount} accès expirés désactivés`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('Erreur nettoyage accès expirés:', error);
    return 0;
  }
}

/**
 * 🔍 Version avec cache pour réduire les coûts Firestore
 * Utilise les Custom Claims comme cache de première ligne
 */

/**
 * 🔍 Version avec pagination pour limiter les coûts
 */

// =============== FONCTIONS PRINCIPALES OPTIMISÉES ===============

/**
 * 🎯 NOUVELLE VERSION : Attribution d'accès restaurant avec architecture optimisée
 */
export const setRestaurantAccessV2 = onCall({
  minInstances: 0,  // ✅ 0 pour éviter les coûts permanents
  maxInstances: 10, // Réduit aussi pour optimiser
  memory: '256MiB', // ✅ Réduit la mémoire pour économiser
  timeoutSeconds: 30
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { restaurantId, role, expiresAt, targetUserId, targetUserEmail }: RestaurantAccessData = request.data;
  const requesterId = request.auth.uid;
  
  // 🔍 Résoudre l'identifiant utilisateur (priorité: targetUserEmail > targetUserId > requesterId)
  let userId: string;
  if (targetUserEmail) {
    console.log(`🔍 Résolution de l'email: ${targetUserEmail}`);
    userId = await resolveUserIdentifier(targetUserEmail);
  } else if (targetUserId) {
    console.log(`🔍 Résolution de l'identifiant: ${targetUserId}`);
    userId = await resolveUserIdentifier(targetUserId);
  } else {
    userId = requesterId;
  }

  // Validation des paramètres
  if (!restaurantId || !role) {
    throw new HttpsError('invalid-argument', 'restaurantId et role sont requis');
  }

  if (!['manager', 'waiter', 'chef', 'cleaner'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Rôle invalide');
  }

  // 🔐 Vérifications de sécurité
  if ((targetUserId || targetUserEmail) && userId !== requesterId) {
    const requesterAccess = await checkUserRestaurantAccess(requesterId, restaurantId);
    if (!requesterAccess || requesterAccess.role !== 'manager') {
      throw new HttpsError('permission-denied', 'Seuls les managers peuvent accorder l\'accès à d\'autres utilisateurs');
    }
    
    if (role === 'manager') {
      const requesterRecord = await getAuth().getUser(requesterId);
      if (!requesterRecord.customClaims?.superAdmin) {
        throw new HttpsError('permission-denied', 'Seuls les super-admins peuvent créer des managers');
      }
    }
  } else if (role === 'manager') {
    throw new HttpsError('permission-denied', 'Impossible de s\'auto-attribuer le rôle manager');
  }

  try {
    console.log(`🔐 Attribution accès V2: ${userId} → ${restaurantId} (${role})`);

    // Nettoyage automatique des accès expirés
    await cleanupExpiredAccess(restaurantId);

    const currentTimestamp = Date.now();
    const expirationTime = expiresAt || currentTimestamp + (24 * 60 * 60 * 1000);

    // Transaction pour garantir la cohérence
    await getFirestore().runTransaction(async (transaction) => {
      // 1. ✅ Source de vérité : Document dédié dans sous-collection
      const userAccessRef = getFirestore()
        .collection('restaurants').doc(restaurantId)
        .collection('userAccess')
        .doc(userId);

      const userAccessData: UserAccessRecord = {
        role: role,
        grantedAt: currentTimestamp,
        grantedBy: requesterId,
        expiresAt: expirationTime,
        isActive: true,
        permissions: getPermissionsForRole(role),
        lastActivity: currentTimestamp,
        loginCount: 0,
        metadata: {
          ip: request.rawRequest.headers['x-forwarded-for'] as string || 'unknown',
          userAgent: request.rawRequest.headers['user-agent'] || 'unknown'
        }
      };

      transaction.set(userAccessRef, userAccessData);

      // 2. ✅ Statistiques restaurant (SANS duplication dans users)
      const restaurantRef = getFirestore().collection('restaurants').doc(restaurantId);
      transaction.update(restaurantRef, {
        [`stats.usersByRole.${role}`]: FieldValue.increment(1),
        'stats.totalActiveUsers': FieldValue.increment(1),
        updatedAt: currentTimestamp
      });
    });

    // 4. ✅ Cache performance : Custom Claims minimaux (hors transaction)
    const userRecord = await getAuth().getUser(userId);
    const existingClaims = userRecord.customClaims || {};
    
    const updatedClaims = {
      ...existingClaims,
      restaurantAccess: {
        ...existingClaims.restaurantAccess,
        [restaurantId]: {
          role: role,
          expiresAt: expirationTime
        }
      }
    };

    await getAuth().setCustomUserClaims(userId, updatedClaims);

    // 5. Audit log
    await getFirestore().collection('audit-logs').add({
      action: 'restaurant_access_granted_v2',
      userId: userId,
      restaurantId: restaurantId,
      role: role,
      grantedBy: requesterId,
      timestamp: new Date(),
      architecture: 'v2_subcollections'
    });

    console.log(`✅ Accès V2 accordé: ${userId} → ${restaurantId} (${role})`);

    return {
      success: true,
      message: `Accès ${role} accordé pour le restaurant ${restaurantId}`,
      expiresAt: expirationTime,
      architecture: 'v2'
    };

  } catch (error) {
    console.error('❌ Erreur setRestaurantAccessV2:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Erreur lors de l\'attribution des permissions V2');
  }
});

/**
 * 🚫 NOUVELLE VERSION : Suppression d'accès optimisée
 */
export const removeRestaurantAccessV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { restaurantId, targetUserId, targetUserEmail }: { 
    restaurantId: string; 
    targetUserId?: string; 
    targetUserEmail?: string 
  } = request.data;
  const requesterId = request.auth.uid;
  
  // 🔍 Résoudre l'identifiant utilisateur (priorité: targetUserEmail > targetUserId > requesterId)
  let userId: string;
  if (targetUserEmail) {
    console.log(`🔍 Résolution de l'email pour suppression: ${targetUserEmail}`);
    userId = await resolveUserIdentifier(targetUserEmail);
  } else if (targetUserId) {
    console.log(`🔍 Résolution de l'identifiant pour suppression: ${targetUserId}`);
    userId = await resolveUserIdentifier(targetUserId);
  } else {
    userId = requesterId;
  }

  if (!restaurantId) {
    throw new HttpsError('invalid-argument', 'restaurantId requis');
  }

  // Vérifications de sécurité
  if ((targetUserId || targetUserEmail) && userId !== requesterId) {
    const requesterAccess = await checkUserRestaurantAccess(requesterId, restaurantId);
    if (!requesterAccess || requesterAccess.role !== 'manager') {
      throw new HttpsError('permission-denied', 'Seuls les managers peuvent supprimer l\'accès d\'autres utilisateurs');
    }
  }

  try {
    console.log(`🚫 Suppression accès V2: ${userId} → ${restaurantId}`);

    // Transaction pour cohérence
    await getFirestore().runTransaction(async (transaction) => {
      // 1. Récupérer l'accès actuel pour les stats
      const userAccessRef = getFirestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('userAccess')
        .doc(userId);
      
      const accessDoc = await transaction.get(userAccessRef);
      
      if (!accessDoc.exists) {
        throw new HttpsError('not-found', 'Accès utilisateur introuvable');
      }
      
      const accessData = accessDoc.data() as UserAccessRecord;

      // 2. Désactiver l'accès (soft delete)
      transaction.update(userAccessRef, {
        isActive: false,
        revokedAt: Date.now(),
        revokedBy: requesterId
      });

      // 3. Mettre à jour les statistiques restaurant (SANS modification users)
      const restaurantRef = getFirestore().collection('restaurants').doc(restaurantId);
      transaction.update(restaurantRef, {
        [`stats.usersByRole.${accessData.role}`]: FieldValue.increment(-1),
        'stats.totalActiveUsers': FieldValue.increment(-1),
        updatedAt: Date.now()
      });
    });

    // 5. Nettoyer les Custom Claims
    const userRecord = await getAuth().getUser(userId);
    const existingClaims = userRecord.customClaims || {};
    
    if (existingClaims.restaurantAccess) {
      delete existingClaims.restaurantAccess[restaurantId];
      
      if (Object.keys(existingClaims.restaurantAccess).length === 0) {
        delete existingClaims.restaurantAccess;
      }
    }

    await getAuth().setCustomUserClaims(userId, existingClaims);

    // 6. Audit log
    await getFirestore().collection('audit-logs').add({
      action: 'restaurant_access_revoked_v2',
      userId: userId,
      restaurantId: restaurantId,
      revokedBy: requesterId,
      timestamp: new Date(),
      architecture: 'v2_subcollections'
    });

    console.log(`✅ Accès V2 supprimé: ${userId} → ${restaurantId}`);

    return {
      success: true,
      message: `Accès restaurant ${restaurantId} supprimé`,
      architecture: 'v2'
    };

  } catch (error) {
    console.error('❌ Erreur removeRestaurantAccessV2:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Erreur lors de la suppression V2');
  }
});

/**
 * 👥 NOUVELLE VERSION : Lister les utilisateurs d'un restaurant (optimisé)
 */
export const getRestaurantUsersV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { restaurantId, includeInactive = false }: { restaurantId: string; includeInactive?: boolean } = request.data;

  if (!restaurantId) {
    throw new HttpsError('invalid-argument', 'restaurantId requis');
  }

  // Vérifier l'accès au restaurant
  const access = await checkUserRestaurantAccess(request.auth.uid, restaurantId);
  if (!access) {
    throw new HttpsError('permission-denied', 'Accès non autorisé à ce restaurant');
  }

  try {
    // Nettoyage automatique
    await cleanupExpiredAccess(restaurantId);

    // Query optimisée avec pagination
    let query = getFirestore()
      .collection('restaurants')
      .doc(restaurantId)
      .collection('userAccess')
      .orderBy('grantedAt', 'desc');

    if (!includeInactive) {
      query = query.where('isActive', '==', true);
    }

    const usersSnapshot = await query.limit(100).get(); // Limite pour performance

    // Enrichir avec les informations utilisateur en parallèle
    const usersPromises = usersSnapshot.docs.map(async (doc) => {
      try {
        const accessData = doc.data() as UserAccessRecord;
        const userInfo = await getAuth().getUser(doc.id);
        
        return {
          uid: doc.id,
          email: userInfo.email,
          displayName: userInfo.displayName,
          ...accessData,
          isExpired: accessData.expiresAt < Date.now(),
          lastSignIn: userInfo.metadata.lastSignInTime || null
        };
      } catch (userError) {
        console.warn(`⚠️ Utilisateur ${doc.id} introuvable:`, userError);
        return null;
      }
    });

    const users = (await Promise.all(usersPromises)).filter(Boolean);

    return {
      success: true,
      restaurantId: restaurantId,
      totalUsers: users.length,
      activeUsers: users.filter(u => u !== null && u.isActive && !u.isExpired).length,
      users: users,
      architecture: 'v2'
    };

  } catch (error) {
    console.error('❌ Erreur getRestaurantUsersV2:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Erreur lors de la récupération des utilisateurs V2');
  }
});

/**
 * 📋 VERSION ROBUSTE : Lister les restaurants d'un utilisateur (SANS duplication)
 * Utilise Collection Group Query pour éviter les index fragiles
 */
export const getUserRestaurantsV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { targetUserId }: { targetUserId?: string } = request.data;
  const userId = targetUserId || request.auth.uid;

  // Sécurité : vérifier les permissions pour consulter d'autres utilisateurs
  if (targetUserId && targetUserId !== request.auth.uid) {
    const requesterRecord = await getAuth().getUser(request.auth.uid);
    if (!requesterRecord.customClaims?.superAdmin) {
      throw new HttpsError('permission-denied', 'Seuls les super-admins peuvent consulter les restaurants d\'autres utilisateurs');
    }
  }

  try {
    // 🎯 MÉTHODE ROBUSTE : Collection Group Query (pas d'index fragile)
    const userRestaurants = await getUserRestaurantsDirect(userId);

    if (userRestaurants.length === 0) {
      return {
        success: true,
        restaurants: [],
        totalRestaurants: 0,
        architecture: 'v2-robust'
      };
    }

    // Enrichir avec les données des restaurants en parallèle
    const restaurantPromises = userRestaurants.map(async ({ restaurantId, access }) => {
      try {
        const restaurantDoc = await getFirestore()
          .collection('restaurants')
          .doc(restaurantId)
          .get();

        if (!restaurantDoc.exists) {
          return null;
        }

        const restaurantData = restaurantDoc.data();

        return {
          restaurantId,
          restaurantName: restaurantData?.name || 'Restaurant',
          ...access,
          isExpired: access.expiresAt < Date.now()
        };
      } catch (error) {
        console.warn(`⚠️ Erreur restaurant ${restaurantId}:`, error);
        return null;
      }
    });

    const restaurants = (await Promise.all(restaurantPromises)).filter(Boolean);

    return {
      success: true,
      restaurants: restaurants,
      totalRestaurants: restaurants.length,
      architecture: 'v2-robust',
      method: 'collection-group-query'
    };

  } catch (error) {
    console.error('❌ Erreur getUserRestaurantsV2:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Erreur lors de la récupération des restaurants V2');
  }
});

/**
 * 🎯 Créer le premier manager d'un restaurant (bootstrap V2)
 */
export const bootstrapRestaurantManagerV2 = onCall({
  minInstances: 0,
  maxInstances: 3,
  memory: '256MiB',
  timeoutSeconds: 20
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { restaurantId, ownerEmail }: { restaurantId: string; ownerEmail?: string } = request.data;

  if (!restaurantId) {
    throw new HttpsError('invalid-argument', 'restaurantId requis');
  }

  try {
    // 1. Vérifier que le restaurant existe et n'a pas encore de manager
    const restaurantDoc = await getFirestore().collection('restaurants').doc(restaurantId).get();

    if (!restaurantDoc.exists) {
      throw new HttpsError('not-found', 'Restaurant introuvable');
    }

    // 2. Vérifier qu'il n'y a pas déjà de manager via la sous-collection
    const userAccessRef = getFirestore()
      .collection('restaurants')
      .doc(restaurantId)
      .collection('userAccess');

    const managersQuery = await userAccessRef.where('role', '==', 'manager').get();
    
    if (!managersQuery.empty) {
      throw new HttpsError('already-exists', 'Ce restaurant a déjà un ou plusieurs managers');
    }

    // 3. Déterminer l'utilisateur à promouvoir
    let targetUserId = request.auth.uid;
    
    if (ownerEmail) {
      console.log(`🔍 Résolution de l'email propriétaire: ${ownerEmail}`);
      targetUserId = await resolveUserIdentifier(ownerEmail);
    }

    // 4. Créer le premier manager via setRestaurantAccessV2
    const currentTimestamp = Date.now();
    const expirationTime = currentTimestamp + (365 * 24 * 60 * 60 * 1000); // 1 an

    await getFirestore().runTransaction(async (transaction) => {
      const userAccessRef = getFirestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('userAccess')
        .doc(targetUserId);

      const userAccessData: UserAccessRecord = {
        role: 'manager',
        grantedAt: currentTimestamp,
        grantedBy: 'system_bootstrap',
        expiresAt: expirationTime,
        isActive: true,
        permissions: getPermissionsForRole('manager'),
        lastActivity: currentTimestamp,
        loginCount: 0,
        metadata: {
          ip: request.rawRequest.headers['x-forwarded-for'] as string || 'bootstrap',
          userAgent: 'system_bootstrap'
        }
      };

      transaction.set(userAccessRef, userAccessData);

      // Mettre à jour les stats restaurant
      const restaurantRef = getFirestore().collection('restaurants').doc(restaurantId);
      transaction.update(restaurantRef, {
        'stats.usersByRole.manager': FieldValue.increment(1),
        'stats.totalActiveUsers': FieldValue.increment(1),
        ownerId: targetUserId,
        updatedAt: currentTimestamp
      });
    });

    // 5. Mettre à jour Custom Claims
    const userRecord = await getAuth().getUser(targetUserId);
    const existingClaims = userRecord.customClaims || {};

    const updatedClaims = {
      ...existingClaims,
      restaurantAccess: {
        ...existingClaims.restaurantAccess,
        [restaurantId]: {
          role: 'manager',
          expiresAt: expirationTime
        }
      }
    };

    await getAuth().setCustomUserClaims(targetUserId, updatedClaims);

    // 6. Logger l'événement
    await getFirestore().collection('audit-logs').add({
      action: 'restaurant_manager_bootstrapped_v2',
      restaurantId: restaurantId,
      newManagerId: targetUserId,
      bootstrappedBy: request.auth.uid,
      timestamp: new Date(),
      architecture: 'v2_subcollections'
    });

    console.log(`✅ Premier manager V2 créé: ${targetUserId} → ${restaurantId}`);

    return {
      success: true,
      message: `Premier manager créé pour le restaurant ${restaurantId}`,
      managerId: targetUserId,
      managerEmail: userRecord.email,
      architecture: 'v2'
    };

  } catch (error) {
    console.error('❌ Erreur bootstrapRestaurantManagerV2:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la création du premier manager V2');
  }
});

// =============== EXPORT DES NOUVELLES FONCTIONS ===============

/**
 * 🎯 RÉSUMÉ ARCHITECTURE V2:
 * 
 * ✅ AVANTAGES:
 * - Source unique de vérité : restaurants/{id}/userAccess/{userId}
 * - Scalabilité : Pas de limite 1MB par restaurant
 * - Performance : Requêtes optimisées et parallèles
 * - Cohérence : Transactions pour atomicité
 * - Cache intelligent : Custom Claims minimaux
 * - Audit complet : Traçabilité de tous les changements
 * 
 * 📊 STRUCTURE FINALE:
 * restaurants/{id}/userAccess/{userId} → Source de vérité
 * users/{id}/restaurants[] → Index pour navigation
 * auth/customClaims → Cache performance
 * 
 * 🔄 MIGRATION:
 * Les fonctions V1 et V2 peuvent coexister
 * Migration progressive possible
 */
