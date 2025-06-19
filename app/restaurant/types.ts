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
