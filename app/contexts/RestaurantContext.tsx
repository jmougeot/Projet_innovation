import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import RestaurantStorage from '../asyncstorage/restaurantStorage';

// ====== CONTEXT POUR RESTAURANT ID ======
interface RestaurantContextType {
  restaurantId: string | null;
  setRestaurantId: (id: string | null) => void;
  isLoading: boolean;
  refreshRestaurant: () => Promise<void>; // 🔄 Nouvelle fonction refresh
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 Fonction pour charger/recharger le restaurant depuis AsyncStorage
  const loadRestaurantId = async () => {
    setIsLoading(true);
    try {
      const savedId = await RestaurantStorage.GetSelectedRestaurantId();
      setRestaurantId(savedId);
      console.log('🏪 Restaurant Context chargé:', savedId);
    } catch (error) {
      console.error('❌ Erreur chargement restaurant ID dans context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger au montage du provider
  useEffect(() => {
    loadRestaurantId();
  }, []);

  const updateRestaurantId = async (id: string | null) => {
    setRestaurantId(id);
    if (id) {
      try {
        await RestaurantStorage.SetSelectedRestaurantiD(id);
        console.log('💾 Restaurant ID sauvegardé:', id);
      } catch (error) {
        console.error('❌ Erreur sauvegarde restaurant ID:', error);
      }
    }
  };

  // 🔄 Fonction refresh publique
  const refreshRestaurant = async () => {
    console.log('🔄 Refresh manuel du restaurant...');
    await loadRestaurantId();
  };

  return (
    <RestaurantContext.Provider value={{ 
      restaurantId, 
      setRestaurantId: updateRestaurantId, 
      isLoading,
      refreshRestaurant 
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

// Default export to satisfy Expo Router scanning
export default RestaurantProvider;
