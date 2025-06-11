import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// Types
interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  type: string;
  status: 'active' | 'inactive';
  createdAt: any;
  managerId?: string;
  staffIds?: string[];
}

interface UserRestaurantAccess {
  restaurantId: string;
  role: 'owner' | 'manager' | 'staff' | 'admin';
  permissions: string[];
}

interface RestaurantSelectionContextType {
  // État utilisateur
  user: User | null;
  userLoading: boolean;
  
  // Restaurants accessibles à l'utilisateur
  availableRestaurants: Restaurant[];
  userRestaurantAccess: UserRestaurantAccess[];
  
  // Restaurant actuellement sélectionné
  selectedRestaurant: Restaurant | null;
  selectedRestaurantRole: string | null;
  
  // Actions
  selectRestaurant: (restaurantId: string) => Promise<void>;
  clearRestaurantSelection: () => void;
  refreshRestaurants: () => Promise<void>;
  
  // États de chargement
  restaurantsLoading: boolean;
  selectionLoading: boolean;
}

const RestaurantSelectionContext = createContext<RestaurantSelectionContextType | undefined>(undefined);

interface RestaurantSelectionProviderProps {
  children: ReactNode;
}

export function RestaurantSelectionProvider({ children }: RestaurantSelectionProviderProps) {
  // États utilisateur
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  
  // États restaurants
  const [availableRestaurants, setAvailableRestaurants] = useState<Restaurant[]>([]);
  const [userRestaurantAccess, setUserRestaurantAccess] = useState<UserRestaurantAccess[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedRestaurantRole, setSelectedRestaurantRole] = useState<string | null>(null);
  
  // États de chargement
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectionLoading, setSelectionLoading] = useState(false);

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setUserLoading(false);
      
      if (user) {
        await refreshRestaurants();
      } else {
        // Reset tout si l'utilisateur se déconnecte
        setAvailableRestaurants([]);
        setUserRestaurantAccess([]);
        setSelectedRestaurant(null);
        setSelectedRestaurantRole(null);
      }
    });

    return unsubscribe;
  }, []);

  // Charger les restaurants accessibles à l'utilisateur
  const refreshRestaurants = async () => {
    if (!user) {
      console.log('Aucun utilisateur connecté');
      return;
    }

    try {
      setRestaurantsLoading(true);
      
      // 1. Récupérer le profil utilisateur pour connaître son rôle global
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData) {
        console.log('Profil utilisateur non trouvé');
        return;
      }

      // 2. Récupérer les accès restaurants de l'utilisateur
      const accessQuery = query(
        collection(db, 'restaurantAccess'),
        where('userId', '==', user.uid)
      );
      const accessSnapshot = await getDocs(accessQuery);
      const access: UserRestaurantAccess[] = [];
      
      accessSnapshot.forEach(doc => {
        access.push({
          restaurantId: doc.data().restaurantId,
          role: doc.data().role,
          permissions: doc.data().permissions || []
        });
      });

      // 3. Si l'utilisateur est admin global, donner accès à tous les restaurants
      if (userData.role === 'admin' || userData.role === 'manager') {
        const allRestaurantsQuery = query(collection(db, 'restaurants'));
        const allRestaurantsSnapshot = await getDocs(allRestaurantsQuery);
        
        allRestaurantsSnapshot.forEach(doc => {
          const existingAccess = access.find(a => a.restaurantId === doc.id);
          if (!existingAccess) {
            access.push({
              restaurantId: doc.id,
              role: 'admin',
              permissions: ['all']
            });
          }
        });
      }

      setUserRestaurantAccess(access);

      // 4. Récupérer les détails des restaurants accessibles
      const restaurants: Restaurant[] = [];
      for (const accessItem of access) {
        try {
          const restaurantDoc = await getDoc(doc(db, 'restaurants', accessItem.restaurantId));
          if (restaurantDoc.exists()) {
            restaurants.push({
              id: restaurantDoc.id,
              ...restaurantDoc.data()
            } as Restaurant);
          }
        } catch (error) {
          console.error(`Erreur lors du chargement du restaurant ${accessItem.restaurantId}:`, error);
        }
      }

      setAvailableRestaurants(restaurants);
      
    } catch (error) {
      console.error('Erreur lors du chargement des restaurants:', error);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  // Sélectionner un restaurant
  const selectRestaurant = async (restaurantId: string) => {
    try {
      setSelectionLoading(true);
      
      // Vérifier que l'utilisateur a accès à ce restaurant
      const access = userRestaurantAccess.find(a => a.restaurantId === restaurantId);
      if (!access) {
        throw new Error('Accès non autorisé à ce restaurant');
      }

      // Récupérer les détails du restaurant
      const restaurant = availableRestaurants.find(r => r.id === restaurantId);
      if (!restaurant) {
        throw new Error('Restaurant non trouvé');
      }

      setSelectedRestaurant(restaurant);
      setSelectedRestaurantRole(access.role);
      
      // Sauvegarder la sélection dans AsyncStorage pour la persistance
      // (optionnel - peut être ajouté plus tard)
      
    } catch (error) {
      console.error('Erreur lors de la sélection du restaurant:', error);
      throw error;
    } finally {
      setSelectionLoading(false);
    }
  };

  // Désélectionner le restaurant
  const clearRestaurantSelection = () => {
    setSelectedRestaurant(null);
    setSelectedRestaurantRole(null);
  };

  const contextValue: RestaurantSelectionContextType = {
    // État utilisateur
    user,
    userLoading,
    
    // Restaurants
    availableRestaurants,
    userRestaurantAccess,
    
    // Sélection actuelle
    selectedRestaurant,
    selectedRestaurantRole,
    
    // Actions
    selectRestaurant,
    clearRestaurantSelection,
    refreshRestaurants,
    
    // États de chargement
    restaurantsLoading,
    selectionLoading,
  };

  return (
    <RestaurantSelectionContext.Provider value={contextValue}>
      {children}
    </RestaurantSelectionContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useRestaurantSelection() {
  const context = useContext(RestaurantSelectionContext);
  if (context === undefined) {
    throw new Error('useRestaurantSelection must be used within a RestaurantSelectionProvider');
  }
  return context;
}

// Hook pour vérifier les permissions
export function useRestaurantPermissions() {
  const { selectedRestaurant, selectedRestaurantRole, userRestaurantAccess } = useRestaurantSelection();
  
  const hasPermission = (permission: string): boolean => {
    if (!selectedRestaurant || !selectedRestaurantRole) {
      return false;
    }

    const access = userRestaurantAccess.find(a => a.restaurantId === selectedRestaurant.id);
    if (!access) {
      return false;
    }

    // Les admins ont tous les droits
    if (access.role === 'admin' || access.permissions.includes('all')) {
      return true;
    }

    // Vérifier les permissions spécifiques
    return access.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    return selectedRestaurantRole === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return selectedRestaurantRole ? roles.includes(selectedRestaurantRole) : false;
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    currentRole: selectedRestaurantRole,
    isRestaurantSelected: !!selectedRestaurant
  };
}
