import { db } from './firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  orderBy,
  getDoc
} from 'firebase/firestore';

export interface Table {
  id: number;
  numero: string;
  places: number;
  status: 'libre' | 'occupee' | 'reservee';
  position: { x: number; y: number };
}

const TABLES_COLLECTION = 'tables';

// Get all tables
export const getTables = async (): Promise<Table[]> => {
  try {
    const tableQuery = query(collection(db, TABLES_COLLECTION), orderBy('id'));
    const snapshot = await getDocs(tableQuery);
    return snapshot.docs.map(doc => doc.data() as Table);
  } catch (error) {
    console.error("Error getting tables:", error);
    throw error;
  }
};

// Add or update a table
export const saveTable = async (table: Table): Promise<void> => {
  try {
    const tableRef = doc(db, TABLES_COLLECTION, table.id.toString());
    await setDoc(tableRef, table);
  } catch (error) {
    console.error("Error saving table:", error);
    throw error;
  }
};

// Update multiple tables (for batch position updates)
export const updateTables = async (tables: Table[]): Promise<void> => {
  try {
    // Using Promise.all to perform multiple updates in parallel
    await Promise.all(tables.map(async table => {
      const tableRef = doc(db, TABLES_COLLECTION, table.id.toString());
      
      try {
        // Check if document exists
        const docSnapshot = await getDoc(tableRef);
        
        if (docSnapshot.exists()) {
          // Document exists, update it
          await updateDoc(tableRef, { ...table });
        } else {
          // Document doesn't exist, create it
          await setDoc(tableRef, table);
        }
      } catch (docError) {
        console.error(`Error processing table ${table.id}:`, docError);
        // Always use setDoc as fallback if there's an issue
        await setDoc(tableRef, table);
      }
    }));
  } catch (error) {
    console.error("Error updating tables:", error);
    throw error;
  }
};

// Update table position
export const updateTablePosition = async (tableId: number, position: { x: number, y: number }): Promise<void> => {
  try {
    const tableRef = doc(db, TABLES_COLLECTION, tableId.toString());
    await updateDoc(tableRef, { position });
  } catch (error) {
    console.error("Error updating table position:", error);
    throw error;
  }
};

// Update table status
export const updateTableStatus = async (tableId: number, status: Table['status']): Promise<void> => {
  try {
    const tableRef = doc(db, TABLES_COLLECTION, tableId.toString());
    await updateDoc(tableRef, { status });
  } catch (error) {
    console.error("Error updating table status:", error);
    throw error;
  }
};

// Delete a table
export const deleteTable = async (tableId: number): Promise<void> => {
  try {
    const tableRef = doc(db, TABLES_COLLECTION, tableId.toString());
    await deleteDoc(tableRef);
  } catch (error) {
    console.error("Error deleting table:", error);
    throw error;
  }
};

// Initialize default tables if none exist
export const initializeDefaultTables = async (): Promise<void> => {
  try {
    const existingTables = await getTables();
    
    if (existingTables.length === 0) {
      const defaultTables: Table[] = [
        { id: 1, numero: "T1", places: 4, status: 'libre', position: { x: 10, y: 0 } },
        { id: 2, numero: "T2", places: 2, status: 'occupee', position: { x: 1, y: 0 } },
        { id: 3, numero: "T3", places: 6, status: 'reservee', position: { x: 2, y: 0 } },
        { id: 4, numero: "T4", places: 4, status: 'libre', position: { x: 0, y: 1 } },
        { id: 5, numero: "T5", places: 8, status: 'libre', position: { x: 1, y: 1 } },
        { id: 6, numero: "T6", places: 2, status: 'occupee', position: { x: 2, y: 1 } },
      ];
      
      await Promise.all(defaultTables.map(table => saveTable(table)));
    }
  } catch (error) {
    console.error("Error initializing default tables:", error);
    throw error;
  }
};

// Ajouter un export par défaut pour Expo Router
export default {
  getTables,
  saveTable,
  updateTables,
  updateTablePosition,
  updateTableStatus,
  deleteTable,
  initializeDefaultTables
};
