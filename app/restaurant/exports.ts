/**
 * Restaurant module exports
 * Centralized exports for restaurant functionality
 */

// Context and hooks
export { 
  RestaurantSelectionProvider, 
  useRestaurantSelection, 
  useRestaurantNavigation 
} from './RestaurantSelectionContext';

// Components
export { default as AutoRedirect } from './AutoRedirect';
export { default as RestaurantProtectedRoute } from './components/RestaurantProtectedRoute';
export { default as RestaurantChangeNotification } from './components/RestaurantChangeNotification';

// Utilities
export { debugRestaurantPersistence } from './restaurantPersistenceDebug';

// Access management
export * from './restaurantAccess';