import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { DEFAULT_RESTAURANT_ID } from './firebaseRestaurant';

export interface Plat {
    id?: string;
    name: string;
    category: string;
    price: number;
    description?: string;
    mission?: boolean;
}

// Collections - using restaurant sub-collections
const RESTAURANTS_COLLECTION = 'restaurants';

// Helper functions to get collection references
const getMenuRestaurantRef = (restaurantId: string = DEFAULT_RESTAURANT_ID) => {
  return doc(db, RESTAURANTS_COLLECTION, restaurantId);
};

const getMenuCollectionRef = (restaurantId: string = DEFAULT_RESTAURANT_ID) => {
  return collection(getMenuRestaurantRef(restaurantId), 'menu');
};

// Cache local pour le menu - Durée longue car le menu change peu
let menuCache: Plat[] | null = null;
let lastMenuCacheUpdate = 0;
const MENU_CACHE_DURATION = 600000; // 10 minutes - Le menu change rarement

// Fonctions utilitaires de cache pour le menu
export const clearMenuCache = () => {
  menuCache = null;
  lastMenuCacheUpdate = 0;
  console.log('🗑️ Cache du menu vidé');
};

export const getMenuCacheInfo = () => {
  const now = Date.now();
  const timeLeft = menuCache ? Math.max(0, MENU_CACHE_DURATION - (now - lastMenuCacheUpdate)) : 0;
  return {
    isActive: !!menuCache,
    itemsCount: menuCache?.length || 0,
    timeLeftMs: timeLeft,
    timeLeftFormatted: `${Math.ceil(timeLeft / 1000)}s`,
    durationMs: MENU_CACHE_DURATION,
    durationFormatted: `${MENU_CACHE_DURATION / 60000}min`
  };
};
export async function ajout_plat(plat: Plat, restaurantId: string = DEFAULT_RESTAURANT_ID) {
  try {
    // Filter out undefined values
    const filteredPlat = Object.fromEntries(
      Object.entries({
        name: plat.name,
        category: plat.category,
        price: plat.price,
        description: plat.description,
        mission: plat.mission
      }).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(getMenuCollectionRef(restaurantId), filteredPlat);
    
    // Invalider le cache après ajout
    clearMenuCache();
    console.log("✅ Plat ajouté avec succès dans la structure restaurant :", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du plat :", error);
    throw error;
  }
}

export async function get_plats(useCache = true, restaurantId: string = DEFAULT_RESTAURANT_ID) {
  try {
    const now = Date.now();
    
    // Utiliser le cache si disponible et récent
    if (useCache && menuCache && (now - lastMenuCacheUpdate) < MENU_CACHE_DURATION) {
      console.log('📱 Menu chargé depuis le cache local');
      return menuCache;
    }

    console.log('🔄 Chargement du menu depuis Firebase - structure restaurant...');
    const menuSnapshot = await getDocs(getMenuCollectionRef(restaurantId));
    const menuItems: Plat[] = [];
    menuSnapshot.forEach((doc) => {
      menuItems.push({ id: doc.id, ...(doc.data() as Omit<Plat, 'id'>) });
    });
    
    // Mettre à jour le cache
    menuCache = menuItems;
    lastMenuCacheUpdate = now;
    
    console.log(`✅ ${menuItems.length} plats chargés et mis en cache`);
    
    if (menuItems.length === 0) {
      return [];
    }
    return menuItems;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du menu :", error);
    
    // En cas d'erreur, retourner le cache si disponible
    if (menuCache) {
      console.log('🔄 Utilisation du cache de secours pour le menu');
      return menuCache;
    }
    
    throw error; 
  }
}

export async function updatePlat(platId: string, updates: Partial<Plat>, restaurantId: string = DEFAULT_RESTAURANT_ID) {
  try {
    const platRef = doc(getMenuCollectionRef(restaurantId), platId);
    
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(platRef, filteredUpdates);
    
    // Invalider le cache après mise à jour
    clearMenuCache();
    console.log(`✅ Plat ${platId} mis à jour avec succès`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du plat :", error);
    throw error;
  }
}

export async function deletePlat(platId: string, restaurantId: string = DEFAULT_RESTAURANT_ID) {
  try {
    const platRef = doc(getMenuCollectionRef(restaurantId), platId);
    await deleteDoc(platRef);
    
    // Invalider le cache après suppression
    clearMenuCache();
    console.log(`✅ Plat ${platId} supprimé avec succès`);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du plat :", error);
    throw error;
  }
}

export async function getPlatById(platId: string, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<Plat | null> {
  try {
    const platRef = doc(getMenuCollectionRef(restaurantId), platId);
    const snapshot = await getDoc(platRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Plat;
    }
    
    return null;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du plat :", error);
    throw error;
  }
}

export default {
  ajout_plat,
  get_plats,
  updatePlat,
  deletePlat,
  getPlatById,
  clearMenuCache,
  getMenuCacheInfo
};