/**
 * Restaurant module exports
 * Centralized exports for restaurant functionality
 */

// Context and hooks
export { 
  RestaurantProvider, 
  useRestaurant
} from './SelectionContext';

// Components
export { default as AutoRedirect } from './AutoRedirect';
export { default as RestaurantProtectedRoute } from './components/RestaurantProtectedRoute';
