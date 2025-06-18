import { db } from './firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

// ====== SESSION INTERFACES ======
export interface RestaurantSession {
  sessionToken: string;
  restaurantId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  lastActivity: Timestamp;
  deviceInfo?: {
    platform?: string;
    deviceId?: string;
    appVersion?: string;
    userAgent?: string;
  };
  permissions?: string[];
  isActive: boolean;
}

export interface SessionCreateRequest {
  restaurantId: string;
  expirationHours?: number;
  deviceInfo?: RestaurantSession['deviceInfo'];
  permissions?: string[];
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: RestaurantSession;
  reason?: string;
}

// ====== COLLECTION CONSTANTS ======
const SESSIONS_COLLECTION = 'restaurant_sessions';

// ====== SESSION MANAGEMENT ======

/**
 * Generate a secure session token
 */
const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Create a new restaurant session
 */
export const createRestaurantSession = async (
  sessionRequest: SessionCreateRequest
): Promise<string> => {
  try {
    const sessionToken = generateSessionToken();
    const now = new Date();
    const expirationHours = sessionRequest.expirationHours || 24; // Default 24 hours
    const expiresAt = new Date(now.getTime() + (expirationHours * 60 * 60 * 1000));

    const sessionData: RestaurantSession = {
      sessionToken,
      restaurantId: sessionRequest.restaurantId,
      createdAt: serverTimestamp() as Timestamp,
      expiresAt: Timestamp.fromDate(expiresAt),
      lastActivity: serverTimestamp() as Timestamp,
      deviceInfo: sessionRequest.deviceInfo || {},
      permissions: sessionRequest.permissions || ['view_orders', 'manage_tables', 'access_kitchen'],
      isActive: true
    };

    // Save session to Firestore
    await setDoc(doc(db, SESSIONS_COLLECTION, sessionToken), sessionData);

    console.log(`✅ Session créée pour restaurant: ${sessionRequest.restaurantId}, Token: ${sessionToken.substring(0, 8)}...`);
    return sessionToken;

  } catch (error) {
    console.error('❌ Erreur création session:', error);
    throw error;
  }
};

/**
 * Validate a session token
 */
export const validateRestaurantSession = async (
  sessionToken: string
): Promise<SessionValidationResult> => {
  try {
    const sessionDoc = await getDoc(doc(db, SESSIONS_COLLECTION, sessionToken));

    if (!sessionDoc.exists()) {
      return {
        isValid: false,
        reason: 'Session non trouvée'
      };
    }

    const sessionData = sessionDoc.data() as RestaurantSession;

    // Check if session is active
    if (!sessionData.isActive) {
      return {
        isValid: false,
        reason: 'Session désactivée'
      };
    }

    // Check if session has expired
    const now = new Date();
    const expiresAt = sessionData.expiresAt.toDate();

    if (now > expiresAt) {
      // Auto-cleanup expired session
      await deleteRestaurantSession(sessionToken);
      return {
        isValid: false,
        reason: 'Session expirée'
      };
    }

    // Update last activity
    await updateSessionActivity(sessionToken);

    return {
      isValid: true,
      session: sessionData
    };

  } catch (error) {
    console.error('❌ Erreur validation session:', error);
    return {
      isValid: false,
      reason: 'Erreur de validation'
    };
  }
};

/**
 * Update session last activity
 */
export const updateSessionActivity = async (sessionToken: string): Promise<void> => {
  try {
    await updateDoc(doc(db, SESSIONS_COLLECTION, sessionToken), {
      lastActivity: serverTimestamp()
    });

    console.log(`📱 Activité mise à jour pour session: ${sessionToken.substring(0, 8)}...`);

  } catch (error) {
    console.error('❌ Erreur mise à jour activité session:', error);
    // Don't throw error, this is not critical
  }
};

/**
 * Delete a specific session
 */
export const deleteRestaurantSession = async (sessionToken: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionToken));
    console.log(`🗑️ Session supprimée: ${sessionToken.substring(0, 8)}...`);

  } catch (error) {
    console.error('❌ Erreur suppression session:', error);
    throw error;
  }
};

/**
 * Get all active sessions for a restaurant
 */
export const getRestaurantActiveSessions = async (
  restaurantId: string
): Promise<RestaurantSession[]> => {
  try {
    const now = new Date();
    const sessionsQuery = query(
      collection(db, SESSIONS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      where('isActive', '==', true),
      where('expiresAt', '>', Timestamp.fromDate(now))
    );

    const querySnapshot = await getDocs(sessionsQuery);
    const sessions: RestaurantSession[] = [];

    querySnapshot.forEach((doc) => {
      sessions.push({ ...doc.data(), sessionToken: doc.id } as RestaurantSession);
    });

    console.log(`📊 ${sessions.length} sessions actives trouvées pour restaurant: ${restaurantId}`);
    return sessions;

  } catch (error) {
    console.error('❌ Erreur récupération sessions actives:', error);
    return [];
  }
};

/**
 * Invalidate all sessions for a restaurant (emergency logout)
 */
export const invalidateAllRestaurantSessions = async (
  restaurantId: string
): Promise<number> => {
  try {
    const activeSessions = await getRestaurantActiveSessions(restaurantId);
    
    if (activeSessions.length === 0) {
      console.log(`ℹ️ Aucune session active à invalider pour: ${restaurantId}`);
      return 0;
    }

    // Batch delete for performance
    const batch = writeBatch(db);
    
    activeSessions.forEach((session) => {
      const sessionRef = doc(db, SESSIONS_COLLECTION, session.sessionToken);
      batch.delete(sessionRef);
    });

    await batch.commit();
    
    console.log(`🚨 ${activeSessions.length} sessions invalidées pour restaurant: ${restaurantId}`);
    return activeSessions.length;

  } catch (error) {
    console.error('❌ Erreur invalidation sessions:', error);
    throw error;
  }
};

/**
 * Cleanup expired sessions (maintenance function)
 */
export const cleanupExpiredSessions = async (): Promise<number> => {
  try {
    const now = new Date();
    const expiredSessionsQuery = query(
      collection(db, SESSIONS_COLLECTION),
      where('expiresAt', '<', Timestamp.fromDate(now))
    );

    const querySnapshot = await getDocs(expiredSessionsQuery);
    
    if (querySnapshot.empty) {
      console.log('🧹 Aucune session expirée à nettoyer');
      return 0;
    }

    // Batch delete expired sessions
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    console.log(`🧹 ${querySnapshot.size} sessions expirées nettoyées`);
    return querySnapshot.size;

  } catch (error) {
    console.error('❌ Erreur nettoyage sessions expirées:', error);
    throw error;
  }
};

/**
 * Extend session expiration
 */
export const extendSessionExpiration = async (
  sessionToken: string,
  additionalHours: number = 24
): Promise<boolean> => {
  try {
    const validation = await validateRestaurantSession(sessionToken);
    
    if (!validation.isValid || !validation.session) {
      return false;
    }

    const newExpirationTime = new Date();
    newExpirationTime.setHours(newExpirationTime.getHours() + additionalHours);

    await updateDoc(doc(db, SESSIONS_COLLECTION, sessionToken), {
      expiresAt: Timestamp.fromDate(newExpirationTime),
      lastActivity: serverTimestamp()
    });

    console.log(`⏰ Session étendue de ${additionalHours}h: ${sessionToken.substring(0, 8)}...`);
    return true;

  } catch (error) {
    console.error('❌ Erreur extension session:', error);
    return false;
  }
};