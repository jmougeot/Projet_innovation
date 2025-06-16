import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

// Types simples pour le contexte
interface Restaurant {
  id: string;
  name: string;
}

interface RestaurantContextType {
  user: User | null;
  isUserConnected: boolean;
  currentRestaurant: Restaurant | null;
  isConnectedToRestaurant: boolean;
  isLoading: boolean;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
}

interface RestaurantProviderProps {
  children: ReactNode;
}

// Création du contexte
const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// Provider du contexte
export function RestaurantProvider({ children }: RestaurantProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour définir le restaurant actuel
  const handleSetCurrentRestaurant = (restaurant: Restaurant | null) => {
    setCurrentRestaurant(restaurant);
  };

  // Effet pour surveiller l'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      
      if (!user) {
        // Réinitialiser si l'utilisateur se déconnecte
        setCurrentRestaurant(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: RestaurantContextType = {
    user,
    isUserConnected: !!user,
    currentRestaurant,
    isConnectedToRestaurant: !!user && !!currentRestaurant,
    isLoading,
    setCurrentRestaurant: handleSetCurrentRestaurant,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

// Hook pour utiliser le contexte
export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};

export default RestaurantContext;