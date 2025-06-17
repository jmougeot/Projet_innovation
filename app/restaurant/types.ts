/**
 * Type definitions for restaurant selection context
 */

export interface UserRestaurantAccess {
  restaurantId: string;
  role: 'owner' | 'manager' | 'staff' | 'admin';
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  type: string;
  status: 'active' | 'inactive';
  createdAt: any;
  managerId?: string;
  staffIds?: UserRestaurantAccess[];
}

export interface RestaurantSelectionContextType {
  // État utilisateur
  user: any;
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

export interface RestaurantNavigationHooks {
  isLoading: boolean;
  isRestaurantSelected: boolean;
  shouldRedirect: boolean;
  redirectTarget: string | null;
}

export interface RestaurantSelectionProviderProps {
  children: React.ReactNode;
}

export default {};
