import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// For now, keep the original signature with 3 parameters
export const addStock = async (name: string, quantity: number, price: number) => {
  try {
    const docRef = await addDoc(collection(db, 'stock'), {
      name,
      quantity,
      price,
      unit: 'unité', // Default unit
      date: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding stock item: ", error);
    throw error;
  }
};

/* 
// Future implementation with unit parameter:
export const addStock = async (name: string, quantity: number, price: number, unit: string = 'unité') => {
  try {
    const docRef = await addDoc(collection(db, 'stock'), {
      name,
      quantity,
      price,
      unit,
      date: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding stock item: ", error);
    throw error;
  }
};
*/
