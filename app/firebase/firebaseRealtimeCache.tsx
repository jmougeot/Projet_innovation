import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query,
  where,
  DocumentData,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Real-time cache with automatic updates
class RealtimeCache<T> {
  private cache: T[] | null = null;
  private listeners: Set<(data: T[]) => void> = new Set();
  private unsubscribe: Unsubscribe | null = null;
  
  constructor(
    private collectionName: string,
    private transform: (doc: DocumentData) => T
  ) {}

  // Subscribe to real-time updates
  subscribe(callback: (data: T[]) => void) {
    this.listeners.add(callback);
    
    // Start listening if this is the first subscriber
    if (this.listeners.size === 1) {
      this.startListening();
    }
    
    // Return current cache if available
    if (this.cache) {
      callback(this.cache);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stopListening();
      }
    };
  }

  private startListening() {
    console.log(`🔄 Starting real-time listener for ${this.collectionName}`);
    
    this.unsubscribe = onSnapshot(
      collection(db, this.collectionName),
      (snapshot) => {
        console.log(`📡 Real-time update received for ${this.collectionName}`);
        
        const data: T[] = [];
        snapshot.forEach(doc => {
          data.push(this.transform({ id: doc.id, ...doc.data() }));
        });
        
        // Update cache
        this.cache = data;
        
        // Notify all subscribers
        this.listeners.forEach(callback => callback(data));
        
        console.log(`✅ ${data.length} items updated in real-time cache`);
      },
      (error) => {
        console.error(`❌ Real-time listener error for ${this.collectionName}:`, error);
      }
    );
  }

  private stopListening() {
    if (this.unsubscribe) {
      console.log(`🛑 Stopping real-time listener for ${this.collectionName}`);
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // Get current cache (sync)
  getCurrentCache(): T[] | null {
    return this.cache;
  }

  // Manual cache clear
  clearCache() {
    this.cache = null;
    console.log(`🧹 Cache cleared for ${this.collectionName}`);
  }
}

// Example: Real-time Menu Cache
interface Plat {
  id: string;
  name: string;
  category: string;
  price: number;
  disponible?: boolean;
  description?: string;
  tempspreparation?: number;
  ingredients?: string[];
}

export const realtimeMenuCache = new RealtimeCache<Plat>(
  'menu',
  (doc) => ({
    id: doc.id,
    name: doc.name,
    category: doc.category,
    price: doc.price,
    disponible: doc.disponible,
    description: doc.description,
    tempspreparation: doc.tempspreparation,
    ingredients: doc.ingredients
  })
);

// Example: Real-time Stock Cache
interface Stock {
  id: string;
  name: string;
  quantity: number;
  type: string;
  minLevel?: number;
  unit?: string;
  lastUpdated?: Date;
}

export const realtimeStockCache = new RealtimeCache<Stock>(
  'stock',
  (doc) => ({
    id: doc.id,
    name: doc.name,
    quantity: doc.quantity,
    type: doc.type,
    minLevel: doc.minLevel,
    unit: doc.unit,
    lastUpdated: doc.lastUpdated?.toDate?.() || new Date()
  })
);

// Real-time Orders Cache
interface Commande {
  id: string;
  tableId: string;
  status: string;
  plats: Array<{
    plat: Plat;
    quantite: number;
  }>;
  timestamp: string;
  total: number;
}

export const realtimeOrdersCache = new RealtimeCache<Commande>(
  'commandes',
  (doc) => ({
    id: doc.id,
    tableId: doc.tableId,
    status: doc.status,
    plats: doc.plats || [],
    timestamp: doc.timestamp,
    total: doc.total
  })
);

// Real-time Tables Cache
interface Table {
  id: number;
  numero: number;
  status: 'libre' | 'occupée' | 'reservée' | 'sale';
  places: number;
  position?: { x: number; y: number };
}

export const realtimeTablesCache = new RealtimeCache<Table>(
  'tables',
  (doc) => ({
    id: doc.id,
    numero: doc.numero,
    status: doc.status,
    places: doc.places,
    position: doc.position
  })
);

// Usage in React Component
export const useRealtimeMenu = () => {
  const [menuItems, setMenuItems] = useState<Plat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = realtimeMenuCache.subscribe((items) => {
      setMenuItems(items);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return { menuItems, isLoading };
};

// Hook for real-time stock monitoring
export const useRealtimeStock = () => {
  const [stockItems, setStockItems] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<Stock[]>([]);

  useEffect(() => {
    const unsubscribe = realtimeStockCache.subscribe((items) => {
      setStockItems(items);
      setIsLoading(false);
      
      // Calculate low stock items
      const lowStock = items.filter(item => 
        item.minLevel && item.quantity <= item.minLevel
      );
      setLowStockItems(lowStock);
    });

    return unsubscribe;
  }, []);

  return { stockItems, lowStockItems, isLoading };
};

// Hook for real-time orders (kitchen/service)
export const useRealtimeOrders = (statusFilter?: string) => {
  const [orders, setOrders] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = realtimeOrdersCache.subscribe((allOrders) => {
      const filteredOrders = statusFilter 
        ? allOrders.filter(order => order.status === statusFilter)
        : allOrders;
      
      setOrders(filteredOrders);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [statusFilter]);

  return { orders, isLoading };
};

// Hook for real-time table status
export const useRealtimeTables = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);

  useEffect(() => {
    const unsubscribe = realtimeTablesCache.subscribe((allTables) => {
      setTables(allTables);
      setIsLoading(false);
      
      // Calculate available tables
      const available = allTables.filter(table => table.status === 'libre');
      setAvailableTables(available);
    });

    return unsubscribe;
  }, []);

  return { tables, availableTables, isLoading };
};

export default {
  // Cache instances
  realtimeMenuCache,
  realtimeStockCache,
  realtimeOrdersCache,
  realtimeTablesCache,
  
  // React hooks
  useRealtimeMenu,
  useRealtimeStock,
  useRealtimeOrders,
  useRealtimeTables
};
