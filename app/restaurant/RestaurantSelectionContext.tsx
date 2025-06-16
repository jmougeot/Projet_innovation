import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase/firebaseConfig';
import { Restaurant } from '../firebase/firebaseRestaurant';

// Import debug utilities in development
if (__DEV__) {
  require('./restaurantPersistenceDebug');
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

// Clés pour AsyncStorage
const STORAGE_KEYS = {
  SELECTED_RESTAURANT_ID: '@selected_restaurant_id',
  SELECTED_RESTAURANT_DATA: '@selected_restaurant_data',
  SELECTED_RESTAURANT_ROLE: '@selected_restaurant_role',
};

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

  // Storage functions
  const saveSelectedRestaurantToStorage = async (restaurantId: string, restaurant: Restaurant, role: string) => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.SELECTED_RESTAURANT_ID, restaurantId],
        [STORAGE_KEYS.SELECTED_RESTAURANT_DATA, JSON.stringify(restaurant)],
        [STORAGE_KEYS.SELECTED_RESTAURANT_ROLE, role],
      ]);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du restaurant:', error);
    }
  };

  const loadSelectedRestaurantFromStorage = async () => {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.SELECTED_RESTAURANT_ID,
        STORAGE_KEYS.SELECTED_RESTAURANT_DATA,
        STORAGE_KEYS.SELECTED_RESTAURANT_ROLE,
      ]);
      
      const restaurantId = values[0][1];
      const restaurantData = values[1][1];
      const role = values[2][1];
      
      if (restaurantId && restaurantData && role) {
        const restaurant = JSON.parse(restaurantData) as Restaurant;
        return { restaurantId, restaurant, role };
      }
      
      return { restaurantId: null, restaurant: null, role: null };
    } catch (error) {
      console.error('Erreur lors du chargement du restaurant:', error);
      return { restaurantId: null, restaurant: null, role: null };
    }
  };

  const clearSelectedRestaurantFromStorage = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SELECTED_RESTAURANT_ID,
        STORAGE_KEYS.SELECTED_RESTAURANT_DATA,
        STORAGE_KEYS.SELECTED_RESTAURANT_ROLE,
      ]);
    } catch (error) {
      console.error('Erreur lors de la suppression du restaurant:', error);
    }
  };

  // Actions
  const selectRestaurant = async (restaurantId: string) => {
    try {
      setSelectionLoading(true);
      
      const restaurant = availableRestaurants.find(r => r.id === restaurantId);
      const access = userRestaurantAccess.find(a => a.restaurantId === restaurantId);
      
      if (restaurant && access) {
        setSelectedRestaurant(restaurant);
        setSelectedRestaurantRole(access.role);
        await saveSelectedRestaurantToStorage(restaurantId, restaurant, access.role);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du restaurant:', error);
    } finally {
      setSelectionLoading(false);
    }
  };

  const clearRestaurantSelection = async () => {
    setSelectedRestaurant(null);
    setSelectedRestaurantRole(null);
    await clearSelectedRestaurantFromStorage();
  };

  const refreshRestaurants = async () => {
    if (!user) return;
    
    try {
      setRestaurantsLoading(true);
      console.log('🔄 Chargement des restaurants pour l\'utilisateur:', user.uid);
      
      let restaurants: Restaurant[] = [];
      let userAccess: UserRestaurantAccess[] = [];
      
      // 1. D'abord, charger tous les restaurants existants depuis la collection restaurants
      try {
        const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
        console.log('📊 Restaurants trouvés dans la collection:', restaurantsSnapshot.size);
        
        restaurantsSnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          restaurants.push({
            id: docSnapshot.id,
            name: data.name || 'Restaurant Sans Nom',
            address: data.address || 'Adresse non renseignée',
            phone: data.phone || '',
            email: data.email || '',
            created_at: data.created_at,
            updated_at: data.updated_at,
            manager_id: data.manager_id,
            settings: data.settings || {
              business_hours: {
                open_time: "08:00",
                close_time: "22:00",
                days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
              },
              table_service_time: 90,
              kitchen_capacity: 50,
              currency: "EUR",
              tax_rate: 0.20,
              service_charge: 0.0,
              default_room_name: "Salle principale"
            },
            rooms: data.rooms || [],
            active_orders: data.active_orders || [],
            completed_orders: data.completed_orders || [],
            stock: data.stock || [],
            menu: data.menu || [],
            is_active: data.is_active !== false,
            last_sync: data.last_sync
          });
          
          // Pour chaque restaurant trouvé, donner un accès par défaut à l'utilisateur
          userAccess.push({
            restaurantId: docSnapshot.id,
            role: 'owner',
            permissions: ['all']
          });
        });
      } catch (error) {
        console.error('❌ Erreur lors du chargement de la collection restaurants:', error);
      }
      
      // 2. Si aucun restaurant trouvé dans la collection, essayer l'ancienne structure
      if (restaurants.length === 0) {
        console.log('⚠️ Aucun restaurant dans la collection restaurants, vérification des accès utilisateur...');
        
        const accessQuery = query(
          collection(db, 'restaurant_access'),
          where('userId', '==', user.uid)
        );
        const accessSnapshot = await getDocs(accessQuery);
        
        accessSnapshot.forEach((doc) => {
          const data = doc.data();
          userAccess.push({
            restaurantId: data.restaurantId,
            role: data.role,
            permissions: data.permissions || []
          });
        });
        
        console.log('👥 Accès utilisateur trouvés:', userAccess.length);
        
        // Charger les détails des restaurants auxquels l'utilisateur a accès
        for (const access of userAccess) {
          try {
            const restaurantRef = doc(db, 'restaurants', access.restaurantId);
            const restaurantSnap = await getDoc(restaurantRef);
            
            if (restaurantSnap.exists()) {
              const data = restaurantSnap.data();
              restaurants.push({
                id: access.restaurantId,
                name: data.name || 'Restaurant',
                address: data.address || '',
                phone: data.phone || '',
                email: data.email || '',
                created_at: data.created_at,
                updated_at: data.updated_at,
                manager_id: data.manager_id,
                settings: data.settings || {
                  business_hours: {
                    open_time: "08:00",
                    close_time: "22:00",
                    days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                  },
                  table_service_time: 90,
                  kitchen_capacity: 50,
                  currency: "EUR",
                  tax_rate: 0.20,
                  service_charge: 0.0,
                  default_room_name: "Salle principale"
                },
                rooms: data.rooms || [],
                active_orders: data.active_orders || [],
                completed_orders: data.completed_orders || [],
                stock: data.stock || [],
                menu: data.menu || [],
                is_active: data.is_active !== false,
                last_sync: data.last_sync
              });
            }
          } catch (error) {
            console.error(`Erreur lors du chargement du restaurant ${access.restaurantId}:`, error);
          }
        }
      }
      
      console.log('🏪 Restaurants chargés au total:', restaurants.length);
      console.log('📝 Restaurants détaillés:', restaurants.map(r => ({ id: r.id, name: r.name })));
      
      setAvailableRestaurants(restaurants);
      setUserRestaurantAccess(userAccess);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des restaurants:', error);
      setAvailableRestaurants([]);
      setUserRestaurantAccess([]);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setUserLoading(false);
      
      if (user) {
        await refreshRestaurants();
        const savedSelection = await loadSelectedRestaurantFromStorage();
        if (savedSelection.restaurantId && savedSelection.restaurant && savedSelection.role) {
          setSelectedRestaurant(savedSelection.restaurant);
          setSelectedRestaurantRole(savedSelection.role);
        }
      } else {
        await clearRestaurantSelection();
      }
    });

    return unsubscribe;
  }, []);

  const value: RestaurantSelectionContextType = {
    user,
    userLoading,
    availableRestaurants,
    userRestaurantAccess,
    selectedRestaurant,
    selectedRestaurantRole,
    selectRestaurant,
    clearRestaurantSelection,
    refreshRestaurants,
    restaurantsLoading,
    selectionLoading,
  };

  return (
    <RestaurantSelectionContext.Provider value={value}>
      {children}
    </RestaurantSelectionContext.Provider>
  );
}

export const useRestaurantSelection = () => {
  const context = useContext(RestaurantSelectionContext);
  if (context === undefined) {
    throw new Error('useRestaurantSelection must be used within RestaurantSelectionProvider');
  }
  return context;
};

// Navigation hooks
export const useRestaurantNavigation = () => {
  const context = useRestaurantSelection();
  
  const isRestaurantSelected = !!context.selectedRestaurant;
  const isLoading = context.userLoading || context.restaurantsLoading;
  
  let shouldRedirect = false;
  let redirectTarget = null;
  
  if (!isLoading && context.user) {
    if (context.availableRestaurants.length > 0 && !isRestaurantSelected) {
      shouldRedirect = true;
      redirectTarget = '/restaurant/select';
    }
  }
  
  return {
    isLoading,
    isRestaurantSelected,
    shouldRedirect,
    redirectTarget,
  };
};

export default RestaurantSelectionContext;