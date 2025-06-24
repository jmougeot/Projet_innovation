import { collection, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Collections - Une seule collection de tickets
const RESTAURANTS_COLLECTION = 'restaurants';

/**
 * helper function to get the reference to the restaurant's tickets collection
 * @param restaurantId 
 * @returns 
 */
export const getTicketRestaurantRef = (restaurantId: string) => {
  if (!restaurantId || restaurantId.trim() === '') {
    throw new Error('Restaurant ID is required and cannot be empty');
  }
  return doc(db, RESTAURANTS_COLLECTION, restaurantId);
};

export const getTicketsCollectionRef = (restaurantId: string) => {
  return collection(getTicketRestaurantRef(restaurantId), 'tickets');
};
