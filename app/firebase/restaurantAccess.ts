import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  addDoc 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Types pour les accès restaurant
export interface RestaurantAccess {
  id?: string;
  userId: string;
  restaurantId: string;
  role: 'owner' | 'manager' | 'staff' | 'admin';
  permissions: string[];
  grantedBy: string; // userId de qui a accordé l'accès
  grantedAt: any; // timestamp
  isActive: boolean;
}

export interface UserRestaurantSummary {
  userId: string;
  userName: string;
  userEmail: string;
  restaurantAccess: RestaurantAccess[];
}

// Permissions prédéfinies par rôle
export const ROLE_PERMISSIONS = {
  owner: ['all'],
  admin: ['all'],
  manager: [
    'manage_menu',
    'manage_orders',
    'manage_staff',
    'view_reports',
    'manage_tables',
    'manage_stock'
  ],
  staff: [
    'view_orders',
    'update_order_status',
    'view_menu',
    'view_tables'
  ]
};

/**
 * Accorder l'accès à un restaurant pour un utilisateur
 */
export const grantRestaurantAccess = async (
  userId: string,
  restaurantId: string,
  role: RestaurantAccess['role'],
  grantedByUserId: string,
  customPermissions?: string[]
): Promise<void> => {
  try {
    const permissions = customPermissions || ROLE_PERMISSIONS[role] || [];
    
    const accessData: Omit<RestaurantAccess, 'id'> = {
      userId,
      restaurantId,
      role,
      permissions,
      grantedBy: grantedByUserId,
      grantedAt: new Date(),
      isActive: true
    };

    // Vérifier si l'accès existe déjà
    const existingAccess = await getRestaurantAccess(userId, restaurantId);
    
    if (existingAccess) {
      // Mettre à jour l'accès existant
      await setDoc(doc(db, 'restaurantAccess', existingAccess.id!), {
        ...accessData,
        grantedAt: existingAccess.grantedAt, // Garder la date originale
        updatedAt: new Date(),
        updatedBy: grantedByUserId
      });
      console.log(`✅ Accès restaurant mis à jour pour l'utilisateur ${userId}`);
    } else {
      // Créer un nouvel accès
      await addDoc(collection(db, 'restaurantAccess'), accessData);
      console.log(`✅ Accès restaurant accordé à l'utilisateur ${userId}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'attribution de l\'accès restaurant:', error);
    throw error;
  }
};

/**
 * Révoquer l'accès à un restaurant pour un utilisateur
 */
export const revokeRestaurantAccess = async (
  userId: string,
  restaurantId: string
): Promise<void> => {
  try {
    const access = await getRestaurantAccess(userId, restaurantId);
    
    if (access && access.id) {
      await deleteDoc(doc(db, 'restaurantAccess', access.id));
      console.log(`✅ Accès restaurant révoqué pour l'utilisateur ${userId}`);
    } else {
      console.log(`⚠️ Aucun accès trouvé pour l'utilisateur ${userId} au restaurant ${restaurantId}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la révocation de l\'accès restaurant:', error);
    throw error;
  }
};

/**
 * Obtenir l'accès d'un utilisateur à un restaurant spécifique
 */
export const getRestaurantAccess = async (
  userId: string,
  restaurantId: string
): Promise<RestaurantAccess | null> => {
  try {
    const q = query(
      collection(db, 'restaurantAccess'),
      where('userId', '==', userId),
      where('restaurantId', '==', restaurantId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as RestaurantAccess;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'accès restaurant:', error);
    throw error;
  }
};

/**
 * Obtenir tous les accès d'un utilisateur
 */
export const getUserRestaurantAccess = async (userId: string): Promise<RestaurantAccess[]> => {
  try {
    const q = query(
      collection(db, 'restaurantAccess'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const accesses: RestaurantAccess[] = [];
    
    querySnapshot.forEach(doc => {
      accesses.push({
        id: doc.id,
        ...doc.data()
      } as RestaurantAccess);
    });
    
    return accesses;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des accès utilisateur:', error);
    throw error;
  }
};

/**
 * Obtenir tous les utilisateurs ayant accès à un restaurant
 */
export const getRestaurantUsers = async (restaurantId: string): Promise<RestaurantAccess[]> => {
  try {
    const q = query(
      collection(db, 'restaurantAccess'),
      where('restaurantId', '==', restaurantId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const accesses: RestaurantAccess[] = [];
    
    querySnapshot.forEach(doc => {
      accesses.push({
        id: doc.id,
        ...doc.data()
      } as RestaurantAccess);
    });
    
    return accesses;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs du restaurant:', error);
    throw error;
  }
};

/**
 * Vérifier si un utilisateur a une permission spécifique pour un restaurant
 */
export const hasRestaurantPermission = async (
  userId: string,
  restaurantId: string,
  permission: string
): Promise<boolean> => {
  try {
    const access = await getRestaurantAccess(userId, restaurantId);
    
    if (!access) {
      return false;
    }
    
    // Les admins et propriétaires ont toutes les permissions
    if (access.role === 'admin' || access.role === 'owner') {
      return true;
    }
    
    // Vérifier les permissions spécifiques
    return access.permissions.includes('all') || access.permissions.includes(permission);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des permissions:', error);
    return false;
  }
};

/**
 * Créer l'accès initial pour le propriétaire d'un restaurant
 */
export const createInitialRestaurantAccess = async (
  ownerId: string,
  restaurantId: string
): Promise<void> => {
  try {
    await grantRestaurantAccess(
      ownerId,
      restaurantId,
      'owner',
      ownerId // Le propriétaire s'accorde l'accès à lui-même
    );
    console.log(`✅ Accès propriétaire créé pour le restaurant ${restaurantId}`);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'accès initial:', error);
    throw error;
  }
};

/**
 * Utilitaire pour créer un accès rapide (pour les tests ou la démo)
 */
export const createQuickAccess = async (
  userEmail: string,
  restaurantId: string,
  role: RestaurantAccess['role'] = 'manager'
): Promise<void> => {
  try {
    // Dans un vrai cas, on rechercherait l'utilisateur par email
    // Ici, on utilise l'email comme userId pour simplifier
    await grantRestaurantAccess(
      userEmail, // En réalité, ce serait l'UID Firebase
      restaurantId,
      role,
      'system' // Accès accordé par le système
    );
    console.log(`✅ Accès rapide créé pour ${userEmail} avec le rôle ${role}`);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'accès rapide:', error);
    throw error;
  }
};
