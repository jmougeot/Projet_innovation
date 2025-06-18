/**
 * 🏪 RestaurantSelectionContext - Version Simple avec Mémoire
 * 
 * FONCTIONNALITÉS SIMPLES:
 * - Sélection de restaurant avec mémoire persistante
 * - Restauration automatique au redémarrage
 * - Intégration Custom Claims pour validation
 * 
 * UTILISATION:
 * const { currentRestaurant, setCurrentRestaurant } = useRestaurant();
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase/firebaseConfig';
import { getRestaurant } from '../firebase/firebaseRestaurant';

// ====== TYPES ======
interface Restaurant {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface RestaurantContextType {
  user: User | null;
  isUserConnected: boolean;
  currentRestaurant: Restaurant | null;
  isConnectedToRestaurant: boolean;
  isLoading: boolean;
  setCurrentRestaurant: (restaurantId: string | null) => Promise<void>;
}

interface RestaurantProviderProps {
  children: ReactNode;
}

// ====== CONSTANTS ======
const STORAGE_KEY = '@selected_restaurant';

// ====== CONTEXT ======
const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: RestaurantProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRestaurant, setCurrentRestaurantState] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ====== STOCKAGE SIMPLE ======
  
  /**
   * 💾 Sauvegarder le restaurant sélectionné
   */
  const saveRestaurant = async (restaurantId: string | null) => {
    try {
      if (restaurantId && user) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          restaurantId,
          userId: user.uid,
          timestamp: Date.now()
        }));
        console.log('💾 Restaurant sauvegardé:', restaurantId);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Restaurant effacé du stockage');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
    }
  };

  /**
   * 📖 Charger le restaurant sauvegardé
   */
  const loadSavedRestaurant = async (): Promise<string | null> => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (!saved || !user) return null;

      const data = JSON.parse(saved);
      
      // Vérifier que c'est pour le bon utilisateur
      if (data.userId !== user.uid) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return data.restaurantId;
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      return null;
    }
  };

  // ====== FONCTION PRINCIPALE ======

  /**
   * 🏪 Définir le restaurant actuel
   */
  const setRestaurant = async (restaurantId: string | null) => {
    try {
      if (!restaurantId) {
        // Effacer la sélection
        setCurrentRestaurantState(null);
        await saveRestaurant(null);
        return;
      }

      console.log(`🏪 Sélection du restaurant: ${restaurantId}`);

      // Charger les données du restaurant
      const restaurant = await getRestaurant(restaurantId);
      if (!restaurant) {
        console.log('❌ Restaurant non trouvé:', restaurantId);
        return;
      }

      // Mettre à jour l'état et sauvegarder
      setCurrentRestaurantState(restaurant);
      await saveRestaurant(restaurantId);
      
      console.log(`✅ Restaurant sélectionné: ${restaurant.name}`);

    } catch (error) {
      console.error('❌ Erreur sélection restaurant:', error);
    }
  };

  // ====== EFFECT PRINCIPAL ======

  /**
   * 👤 Gestion de l'authentification et restauration
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('👤 Auth state changed:', user ? user.uid : 'null');
      setUser(user);
      
      if (!user) {
        // Déconnexion - tout effacer
        setCurrentRestaurantState(null);
        await AsyncStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      // Connexion - essayer de restaurer la sélection
      try {
        const savedRestaurantId = await loadSavedRestaurant();
        if (savedRestaurantId) {
          console.log('🔄 Restauration restaurant:', savedRestaurantId);
          await setRestaurant(savedRestaurantId);
        }
      } catch (error) {
        console.error('❌ Erreur restauration:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // ====== CONTEXT VALUE ======
  const value: RestaurantContextType = {
    user,
    isUserConnected: !!user,
    currentRestaurant,
    isConnectedToRestaurant: !!user && !!currentRestaurant,
    isLoading,
    setCurrentRestaurant: setRestaurant,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

// ====== HOOK ======

/**
 * 🪝 Hook pour utiliser le contexte restaurant
 */
export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};

export default RestaurantContext;