import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export interface Plat {
    id?: string;
    name: string;
    category: string;
    price: number;
    description?: string;
    mission?:boolean;
}

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
export async function ajout_plat(plat: Plat) {
  try {
    const docRef = await addDoc(collection(db, "menu"), {
      name: plat.name,
      category: plat.category,
      price: plat.price
    });
    
    // Invalider le cache après ajout
    clearMenuCache();
    console.log("✅ Plat ajouté avec succès :", docRef.id);
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du plat :", error);
  }
}

export async function get_plats(useCache = true) {
  try {
    const now = Date.now();
    
    // Utiliser le cache si disponible et récent
    if (useCache && menuCache && (now - lastMenuCacheUpdate) < MENU_CACHE_DURATION) {
      console.log('📱 Menu chargé depuis le cache local');
      return menuCache;
    }

    console.log('🔄 Chargement du menu depuis Firebase...');
    const menuSnapshot = await getDocs(collection(db, "menu"));
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

export default {
  ajout_plat,
  get_plats
};