/**
 * 🔐 Firebase Functions pour l'Application Restaurant
 * 
 * Ce fichier contient toutes les fonctions Firebase Admin
 * pour gérer l'authentification et les permissions restaurant.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

// ✅ Initialiser Firebase Admin (automatique dans Cloud Functions)
initializeApp();

// =============== INTERFACES ===============

interface RestaurantAccessData {
  restaurantId: string;
  role: 'manager' | 'waiter' | 'chef' | 'cleaner';
  expiresAt?: number;
}

interface EmergencyLockdownData {
  restaurantId: string;
}

// ✅ NOUVEAU: Interface pour la structure restaurant
interface RestaurantUserAccess {
  role: 'manager' | 'waiter' | 'chef' | 'cleaner';
  grantedAt: number;
  grantedBy: string;
  expiresAt?: number;
  isActive: boolean;
  permissions?: string[];
}

// =============== FONCTIONS UTILITAIRES ===============

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

// =============== FONCTIONS PRINCIPALES ===============

/**
 * 🎯 Définir les permissions restaurant pour un utilisateur
 * Usage: grantRestaurantAccess({ restaurantId: 'rest123', role: 'manager' })
 */
export const setRestaurantAccess = onCall({
  minInstances: 1,       // 1 serveur toujours prêt (fonction critique)
  maxInstances: 15,      // Max 15 requêtes simultanées  
  memory: '512MiB',      // Plus de RAM pour les performances
  timeoutSeconds: 30     // Timeout de 30 secondes
}, async (request) => {
  // Vérification sécurité de base
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { restaurantId, role, expiresAt }: RestaurantAccessData = request.data;
  const userId = request.auth.uid;

  // Validation des paramètres
  if (!restaurantId || !role) {
    throw new HttpsError('invalid-argument', 'restaurantId et role sont requis');
  }

  if (!['manager', 'waiter', 'chef', 'cleaner'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Rôle invalide');
  }

  try {
    console.log(`🔐 Attribution accès restaurant: ${userId} → ${restaurantId} (${role})`);

    // 1. Vérifier que le restaurant existe
    const restaurantDoc = await getFirestore()
      .collection('restaurants')
      .doc(restaurantId)
      .get();

    if (!restaurantDoc.exists) {
      throw new HttpsError('not-found', `Restaurant ${restaurantId} introuvable`);
    }

    // 2. Récupérer les claims existants
    const userRecord = await getAuth().getUser(userId);
    const existingClaims = userRecord.customClaims || {};

    // 3. Créer/mettre à jour les custom claims
    const updatedClaims = {
      ...existingClaims,
      restaurantAccess: {
        ...existingClaims.restaurantAccess,
        [restaurantId]: {
          role: role,
          grantedAt: Date.now(),
          expiresAt: expiresAt || Date.now() + (24 * 60 * 60 * 1000) // 24h par défaut
        }
      }
    };

    await getAuth().setCustomUserClaims(userId, updatedClaims);

    // 4. Logger l'action pour audit
    await getFirestore().collection('audit-logs').add({
      action: 'restaurant_access_granted',
      userId: userId,
      restaurantId: restaurantId,
      role: role,
      grantedBy: userId, // Peut être différent si admin accorde à quelqu'un d'autre
      timestamp: new Date(),
      userAgent: request.rawRequest.headers['user-agent'] || 'unknown'
    });

    // 5. ✅ NOUVEAU: Mettre à jour la collection restaurants avec l'accès utilisateur
    const restaurantRef = getFirestore().collection('restaurants').doc(restaurantId);
    const currentTimestamp = Date.now();
    const expirationTime = expiresAt || currentTimestamp + (24 * 60 * 60 * 1000);

    await restaurantRef.update({
      [`userAccess.${userId}`]: {
        role: role,
        grantedAt: currentTimestamp,
        grantedBy: userId, // TODO: Permettre à un manager de donner accès à quelqu'un d'autre
        expiresAt: expirationTime,
        isActive: true,
        permissions: getPermissionsForRole(role)
      },
      updatedAt: currentTimestamp
    });

    // 6. Aussi ajouter à la collection users pour compatibilité règles Firestore
    await getFirestore()
      .collection('users')
      .doc(userId)
      .update({
        [`restaurantAccess.${restaurantId}`]: {
          role: role,
          grantedAt: new Date(),
          expiresAt: new Date(expiresAt || Date.now() + (24 * 60 * 60 * 1000))
        },
        Restaurant: FieldValue.arrayUnion(restaurantId)
      });

    console.log(`✅ Accès accordé avec succès: ${userId} → ${restaurantId}`);

    return { 
      success: true, 
      message: `Accès ${role} accordé pour le restaurant ${restaurantId}`,
      expiresAt: expiresAt || Date.now() + (24 * 60 * 60 * 1000)
    };

  } catch (error) {
    console.error('❌ Erreur setRestaurantAccess:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Erreur lors de l\'attribution des permissions');
  }
});

/**
 * 🚫 Supprimer l'accès restaurant pour un utilisateur
 * Usage: removeRestaurantAccess({ restaurantId: 'rest123' })
 */
export const removeRestaurantAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { restaurantId }: { restaurantId: string } = request.data;
  const userId = request.auth.uid;

  if (!restaurantId) {
    throw new HttpsError('invalid-argument', 'restaurantId requis');
  }

  try {
    console.log(`🚫 Suppression accès restaurant: ${userId} → ${restaurantId}`);

    // 1. Récupérer et modifier les claims
    const userRecord = await getAuth().getUser(userId);
    const existingClaims = userRecord.customClaims || {};

    if (existingClaims.restaurantAccess) {
      delete existingClaims.restaurantAccess[restaurantId];
      
      // Si plus aucun restaurant, supprimer la propriété entière
      if (Object.keys(existingClaims.restaurantAccess).length === 0) {
        delete existingClaims.restaurantAccess;
      }
    }

    await getAuth().setCustomUserClaims(userId, existingClaims);

    // 2. ✅ NOUVEAU: Supprimer aussi de la collection restaurants
    await getFirestore()
      .collection('restaurants')
      .doc(restaurantId)
      .update({
        [`userAccess.${userId}`]: FieldValue.delete(),
        updatedAt: Date.now()
      });

    // 3. Supprimer aussi de la collection users
    await getFirestore()
      .collection('users')
      .doc(userId)
      .update({
        [`restaurantAccess.${restaurantId}`]: FieldValue.delete(),
        Restaurant: FieldValue.arrayRemove(restaurantId)
      });

    // 4. Logger la suppression
    await getFirestore().collection('audit-logs').add({
      action: 'restaurant_access_revoked',
      userId: userId,
      restaurantId: restaurantId,
      revokedBy: userId,
      timestamp: new Date()
    });

    console.log(`✅ Accès supprimé: ${userId} → ${restaurantId}`);

    return { 
      success: true, 
      message: `Accès restaurant ${restaurantId} supprimé` 
    };

  } catch (error) {
    console.error('❌ Erreur removeRestaurantAccess:', error);
    throw new HttpsError('internal', 'Erreur lors de la suppression');
  }
});

/**
 * 📋 Lister tous les accès restaurant d'un utilisateur
 * Usage: getUserRestaurantAccess()
 */
export const getUserRestaurantAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  try {
    const userRecord = await getAuth().getUser(request.auth.uid);
    const claims = userRecord.customClaims || {};
    const restaurantAccess = claims.restaurantAccess || {};

    // Vérifier les expirations et nettoyer automatiquement
    const now = Date.now();
    const validAccess: { [key: string]: any } = {};
    let hasExpiredAccess = false;

    for (const [restaurantId, access] of Object.entries(restaurantAccess)) {
      if ((access as any).expiresAt > now) {
        validAccess[restaurantId] = access;
      } else {
        hasExpiredAccess = true;
        console.log(`⏰ Accès expiré détecté: ${request.auth.uid} → ${restaurantId}`);
      }
    }

    // Si des accès ont expiré, nettoyer les claims
    if (hasExpiredAccess) {
      const updatedClaims = { ...claims };
      if (Object.keys(validAccess).length === 0) {
        delete updatedClaims.restaurantAccess;
      } else {
        updatedClaims.restaurantAccess = validAccess;
      }
      
      await getAuth().setCustomUserClaims(request.auth.uid, updatedClaims);
    }

    return {
      success: true,
      restaurantAccess: validAccess,
      totalRestaurants: Object.keys(validAccess).length,
      cleanedExpiredAccess: hasExpiredAccess
    };

  } catch (error) {
    console.error('❌ Erreur getUserRestaurantAccess:', error);
    throw new HttpsError('internal', 'Erreur lors de la récupération');
  }
});

/**
 * 🚨 Fonction d'urgence : déconnexion massive d'un restaurant
 * Usage: emergencyLockdown({ restaurantId: 'rest123' })
 */
export const emergencyLockdown = onCall({
  minInstances: 0,       // Fonction d'urgence - pas de coût permanent
  maxInstances: 5,       // Suffisant pour les urgences
  memory: '256MiB',      // RAM standard
  timeoutSeconds: 60     // Plus de temps pour traiter le lockdown
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { restaurantId }: EmergencyLockdownData = request.data;

  if (!restaurantId) {
    throw new HttpsError('invalid-argument', 'restaurantId requis');
  }

  try {
    console.log(`🚨 LOCKDOWN D'URGENCE INITIÉ: ${restaurantId} par ${request.auth.uid}`);

    // 1. Révoquer tous les tokens des utilisateurs ayant accès à ce restaurant
    const listUsersResult = await getAuth().listUsers(1000);
    let revokedCount = 0;
    
    for (const userRecord of listUsersResult.users) {
      const claims = userRecord.customClaims;
      if (claims?.restaurantAccess?.[restaurantId]) {
        await getAuth().revokeRefreshTokens(userRecord.uid);
        revokedCount++;
        console.log(`🔒 Token révoqué pour: ${userRecord.uid}`);
      }
    }

    // 2. Supprimer toutes les sessions restaurant actives
    const sessions = await getFirestore()
      .collection('restaurant_sessions')
      .where('restaurantId', '==', restaurantId)
      .get();

    const batch = getFirestore().batch();
    sessions.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // 3. ✅ NOUVEAU: Désactiver tous les accès utilisateurs dans la collection restaurants
    const restaurantDoc = await getFirestore()
      .collection('restaurants')
      .doc(restaurantId)
      .get();

    if (restaurantDoc.exists) {
      const restaurantData = restaurantDoc.data();
      const userAccess = restaurantData?.userAccess || {};
      
      // Désactiver tous les accès utilisateurs
      const updatedUserAccess: any = {};
      Object.keys(userAccess).forEach(userId => {
        updatedUserAccess[`userAccess.${userId}.isActive`] = false;
      });

      // Marquer le restaurant en lockdown
      await getFirestore()
        .collection('restaurants')
        .doc(restaurantId)
        .update({
          ...updatedUserAccess,
          emergencyLockdown: true,
          lockdownTimestamp: new Date(),
          lockdownBy: request.auth.uid,
          updatedAt: Date.now()
        });
    }

    // 4. Logger l'événement de sécurité
    await getFirestore().collection('security-events').add({
      type: 'emergency_lockdown',
      restaurantId: restaurantId,
      revokedTokens: revokedCount,
      deletedSessions: sessions.size,
      timestamp: new Date(),
      triggeredBy: request.auth.uid,
      userAgent: request.rawRequest.headers['user-agent'] || 'unknown',
      severity: 'CRITICAL'
    });

    console.log(`✅ Lockdown terminé: ${revokedCount} tokens révoqués, ${sessions.size} sessions supprimées`);

    return { 
      success: true, 
      message: `Lockdown d'urgence effectué pour ${restaurantId}`,
      details: {
        revokedTokens: revokedCount,
        deletedSessions: sessions.size,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ Erreur emergencyLockdown:', error);
    throw new HttpsError('internal', 'Erreur lors du lockdown d\'urgence');
  }
});

/**
 * 🔓 Lever le lockdown d'urgence
 * Usage: liftEmergencyLockdown({ restaurantId: 'rest123' })
 */
export const liftEmergencyLockdown = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { restaurantId }: EmergencyLockdownData = request.data;

  try {
    // Vérifier que l'utilisateur a les permissions admin pour ce restaurant
    const userRecord = await getAuth().getUser(request.auth.uid);
    const claims = userRecord.customClaims;
    
    if (claims?.restaurantAccess?.[restaurantId]?.role !== 'manager') {
      throw new HttpsError('permission-denied', 'Seuls les managers peuvent lever le lockdown');
    }

    // ✅ NOUVEAU: Réactiver tous les accès utilisateurs dans la collection restaurants
    const restaurantDoc = await getFirestore()
      .collection('restaurants')
      .doc(restaurantId)
      .get();

    if (restaurantDoc.exists) {
      const restaurantData = restaurantDoc.data();
      const userAccess = restaurantData?.userAccess || {};
      
      // Réactiver tous les accès utilisateurs (sauf ceux expirés)
      const updatedUserAccess: any = {};
      const currentTime = Date.now();
      
      Object.keys(userAccess).forEach(userId => {
        const access = userAccess[userId];
        // Réactiver seulement si pas expiré
        if (!access.expiresAt || access.expiresAt > currentTime) {
          updatedUserAccess[`userAccess.${userId}.isActive`] = true;
        }
      });

      // Lever le lockdown
      await getFirestore()
        .collection('restaurants')
        .doc(restaurantId)
        .update({
          ...updatedUserAccess,
          emergencyLockdown: false,
          lockdownLiftedTimestamp: new Date(),
          lockdownLiftedBy: request.auth.uid,
          updatedAt: Date.now()
        });
    }

    // Logger
    await getFirestore().collection('security-events').add({
      type: 'lockdown_lifted',
      restaurantId: restaurantId,
      timestamp: new Date(),
      liftedBy: request.auth.uid
    });

    return { 
      success: true, 
      message: `Lockdown levé pour ${restaurantId}` 
    };

  } catch (error) {
    console.error('❌ Erreur liftEmergencyLockdown:', error);
    throw new HttpsError('internal', 'Erreur lors de la levée du lockdown');
  }
});

/**
 * 🔍 Fonction de debugging pour les développeurs
 * Usage: debugUserClaims({ targetUserId: 'user123' })
 */
export const debugUserClaims = onCall({
  minInstances: 0,       // Fonction occasionnelle - pas de coût
  maxInstances: 2,       // Peu d'usage simultané
  memory: '256MiB',      // RAM basique
  timeoutSeconds: 15     // Debug rapide
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { targetUserId } = request.data;
  const userId = targetUserId || request.auth.uid;

  try {
    const userRecord = await getAuth().getUser(userId);
    
    return {
      success: true,
      debugInfo: {
        uid: userRecord.uid,
        email: userRecord.email,
        customClaims: userRecord.customClaims || {},
        tokensValidAfterTime: userRecord.tokensValidAfterTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        creationTime: userRecord.metadata.creationTime
      }
    };

  } catch (error) {
    console.error('❌ Erreur debugUserClaims:', error);
    throw new HttpsError('internal', 'Erreur lors du debug');
  }
});

/**
 * 👥 Obtenir tous les utilisateurs ayant accès à un restaurant
 * Usage: getRestaurantUsers({ restaurantId: 'rest123' })
 */
export const getRestaurantUsers = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non connecté');
  }

  const { restaurantId }: { restaurantId: string } = request.data;

  if (!restaurantId) {
    throw new HttpsError('invalid-argument', 'restaurantId requis');
  }

  try {
    // Vérifier que l'utilisateur a accès à ce restaurant
    const userRecord = await getAuth().getUser(request.auth.uid);
    const claims = userRecord.customClaims;
    
    if (!claims?.restaurantAccess?.[restaurantId]) {
      throw new HttpsError('permission-denied', 'Accès non autorisé à ce restaurant');
    }

    // Récupérer les données du restaurant
    const restaurantDoc = await getFirestore()
      .collection('restaurants')
      .doc(restaurantId)
      .get();

    if (!restaurantDoc.exists) {
      throw new HttpsError('not-found', 'Restaurant introuvable');
    }

    const restaurantData = restaurantDoc.data();
    const userAccess = restaurantData?.userAccess || {};

    // Enrichir avec les informations utilisateur
    const users = [];
    const currentTime = Date.now();

    for (const [userId, accessData] of Object.entries(userAccess)) {
      try {
        const access = accessData as RestaurantUserAccess;
        const userInfo = await getAuth().getUser(userId);
        const isExpired = access.expiresAt && access.expiresAt < currentTime;
        
        users.push({
          uid: userId,
          email: userInfo.email,
          displayName: userInfo.displayName,
          role: access.role,
          grantedAt: access.grantedAt,
          grantedBy: access.grantedBy,
          expiresAt: access.expiresAt,
          isActive: access.isActive && !isExpired,
          isExpired: isExpired,
          permissions: access.permissions || [],
          lastSignIn: userInfo.metadata.lastSignInTime || null
        });
      } catch (userError) {
        console.warn(`⚠️ Utilisateur ${userId} introuvable:`, userError);
        // Nettoyer l'entrée obsolète
        await getFirestore()
          .collection('restaurants')
          .doc(restaurantId)
          .update({
            [`userAccess.${userId}`]: FieldValue.delete()
          });
      }
    }

    return {
      success: true,
      restaurantId: restaurantId,
      restaurantName: restaurantData?.name || 'Restaurant',
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      users: users.sort((a, b) => b.grantedAt - a.grantedAt) // Plus récent en premier
    };

  } catch (error) {
    console.error('❌ Erreur getRestaurantUsers:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la récupération des utilisateurs');
  }
});

// =============== EXPORTS ===============

// Toutes les fonctions sont automatiquement exportées par Firebase Functions
// Elles seront disponibles à ces URLs :
// - https://région-projet.cloudfunctions.net/setRestaurantAccess
// - https://région-projet.cloudfunctions.net/removeRestaurantAccess
// - https://région-projet.cloudfunctions.net/getUserRestaurantAccess
// - https://région-projet.cloudfunctions.net/getRestaurantUsers ✅ NOUVEAU
// - https://région-projet.cloudfunctions.net/emergencyLockdown
// - https://région-projet.cloudfunctions.net/liftEmergencyLockdown
// - https://région-projet.cloudfunctions.net/debugUserClaims

/**
 * 🎯 RÉSUMÉ DES MODIFICATIONS POUR LA COLLECTION RESTAURANTS:
 * 
 * 1. ✅ setRestaurantAccess() → Met à jour restaurants/{id}/userAccess/{userId}
 * 2. ✅ removeRestaurantAccess() → Supprime de restaurants/{id}/userAccess/{userId}
 * 3. ✅ emergencyLockdown() → Désactive tous les userAccess.isActive = false
 * 4. ✅ liftEmergencyLockdown() → Réactive tous les userAccess.isActive = true
 * 5. ✅ getRestaurantUsers() → Liste tous les utilisateurs du restaurant
 * 
 * STRUCTURE FINALE restaurants/{restaurantId}:
 * {
 *   "userAccess": {
 *     "userId123": {
 *       "role": "manager",
 *       "grantedAt": timestamp,
 *       "grantedBy": "adminUserId",
 *       "expiresAt": timestamp,
 *       "isActive": true,
 *       "permissions": ["read", "write", "manage_users"]
 *     }
 *   },
 *   "updatedAt": timestamp,
 *   "emergencyLockdown": false
 * }
 */
