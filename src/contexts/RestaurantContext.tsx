import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import RestaurantStorage from '../../app/asyncstorage/restaurantStorage';

// ====== CONTEXT POUR RESTAURANT ID ======
interface RestaurantContextType {
  restaurantId: string | null;
  setRestaurantId: (id: string | null) => void;
  isLoading: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRestaurantId = async () => {
      try {
        const savedId = await RestaurantStorage.GetSelectedRestaurantId();
        setRestaurantId(savedId);
      } catch (error) {
        console.error('Erreur chargement restaurant ID dans context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurantId();
  }, []);

  const updateRestaurantId = async (id: string | null) => {
    setRestaurantId(id);
    if (id) {
      try {
        await RestaurantStorage.SetSelectedRestaurantiD(id);
      } catch (error) {
        console.error('Erreur sauvegarde restaurant ID:', error);
      }
    }
  };

  return (
    <RestaurantContext.Provider value={{ restaurantId, setRestaurantId: updateRestaurantId, isLoading }}>
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
