import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query,
  DocumentData,
  Unsubscribe,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Real-time cache with automatic updates and error handling
class RealtimeCache<T> {
  private cache: T[] | null = null;
  private listeners: Set<(data: T[]) => void> = new Set();
  private unsubscribe: Unsubscribe | null = null;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private hasConnectionError = false;
  
  constructor(
    private collectionName: string,
    private transform: (doc: DocumentData) => T
  ) {}

  // Check if collection exists and has data
  private async checkCollectionExists(): Promise<boolean> {
    try {
      const testQuery = query(collection(db, this.collectionName), limit(1));
      const snapshot = await getDocs(testQuery);
      console.log(`Collection '${this.collectionName}' check:`, snapshot.size, 'documents');
      return true; // Collection exists (even if empty)
    } catch (error: any) {
      console.warn(`⚠️ Collection '${this.collectionName}' might not exist or is inaccessible:`, error.message);
      return false;
    }
  }

  // Subscribe to real-time updates with error handling
  subscribe(callback: (data: T[]) => void) {
    this.listeners.add(callback);
    
    // Start listening if this is the first subscriber and not already connecting
    if (this.listeners.size === 1 && !this.isConnecting && !this.unsubscribe) {
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

  private async startListening() {
    if (this.isConnecting || this.unsubscribe) return;
    
    this.isConnecting = true;
    console.log(`🔄 Starting real-time listener for ${this.collectionName}`);
    
    try {
      // Check if collection exists before creating listener
      const exists = await this.checkCollectionExists();
      if (!exists) {
        console.warn(`⚠️ Skipping real-time listener for ${this.collectionName} - collection not accessible`);
        this.isConnecting = false;
        // Return empty array to subscribers
        this.cache = [];
        this.listeners.forEach(callback => callback([]));
        return;
      }

      this.unsubscribe = onSnapshot(
        collection(db, this.collectionName),
        (snapshot) => {
          console.log(`📡 Real-time update received for ${this.collectionName}`);
          
          const data: T[] = [];
          snapshot.forEach(doc => {
            try {
              data.push(this.transform({ id: doc.id, ...doc.data() }));
            } catch (transformError) {
              console.warn(`⚠️ Error transforming document ${doc.id} in ${this.collectionName}:`, transformError);
            }
          });
          
          // Update cache
          this.cache = data;
          this.hasConnectionError = false;
          
          // Notify all subscribers
          this.listeners.forEach(callback => callback(data));
          
          console.log(`✅ ${data.length} items updated in real-time cache for ${this.collectionName}`);
        },
        (error) => {
          console.error(`❌ Real-time listener error for ${this.collectionName}:`, error);
          this.hasConnectionError = true;
          this.handleConnectionError(error);
        }
      );

      this.isConnecting = false;
      console.log(`✅ Real-time listener started for ${this.collectionName}`);

    } catch (error) {
      console.error(`❌ Failed to start real-time listener for ${this.collectionName}:`, error);
      this.isConnecting = false;
      this.hasConnectionError = true;
      this.handleConnectionError(error);
    }
  }

  private handleConnectionError(error: any) {
    // Stop current listener if exists
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Don't retry for permission errors
    if (error?.code === 'permission-denied') {
      console.error(`🚫 Permission denied for ${this.collectionName} - stopping retries`);
      return;
    }

    // Don't retry if no listeners
    if (this.listeners.size === 0) {
      console.log(`🛑 No listeners for ${this.collectionName} - stopping retries`);
      return;
    }

    // Exponential backoff retry
    const retryDelay = Math.min(30000, 1000 * Math.pow(2, Math.random() * 3)); // 1-8 seconds, max 30s
    console.log(`🔄 Retrying real-time listener for ${this.collectionName} in ${retryDelay}ms`);
    
    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      this.isConnecting = false;
      if (this.listeners.size > 0) {
        this.startListening();
      }
    }, retryDelay);
  }

  private stopListening() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    if (this.unsubscribe) {
      console.log(`🛑 Stopping real-time listener for ${this.collectionName}`);
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    this.isConnecting = false;
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

  // Get cache status info
  getStatus() {
    return {
      hasCache: !!this.cache,
      itemCount: this.cache?.length || 0,
      isConnected: !!this.unsubscribe && !this.hasConnectionError,
      isConnecting: this.isConnecting,
      hasError: this.hasConnectionError,
      listenerCount: this.listeners.size
    };
  }

  // Force reconnect (useful for debugging)
  forceReconnect() {
    console.log(`🔄 Force reconnecting ${this.collectionName}`);
    this.stopListening();
    this.hasConnectionError = false;
    if (this.listeners.size > 0) {
      this.startListening();
    }
  }
}

// Lazy cache initialization to prevent automatic GRPC connections
let _realtimeMenuCache: RealtimeCache<Plat> | null = null;
let _realtimeStockCache: RealtimeCache<Stock> | null = null;
let _realtimeOrdersCache: RealtimeCache<Commande> | null = null;
let _realtimeTablesCache: RealtimeCache<Table> | null = null;

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

export const getRealtimeMenuCache = (): RealtimeCache<Plat> => {
  if (!_realtimeMenuCache) {
    console.log('🚀 Initializing real-time menu cache');
    _realtimeMenuCache = new RealtimeCache<Plat>(
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
  }
  return _realtimeMenuCache;
};

// Backward compatibility
export const realtimeMenuCache = getRealtimeMenuCache();

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

export const getRealtimeStockCache = (): RealtimeCache<Stock> => {
  if (!_realtimeStockCache) {
    console.log('🚀 Initializing real-time stock cache');
    _realtimeStockCache = new RealtimeCache<Stock>(
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
  }
  return _realtimeStockCache;
};

// Backward compatibility
export const realtimeStockCache = getRealtimeStockCache();

// Real-time Orders Cache
interface Commande {
  id: string;
  tableId: string;
  status: string;
  plats: {
    plat: Plat;
    quantite: number;
  }[];
  timestamp: string;
  total: number;
}

export const getRealtimeOrdersCache = (): RealtimeCache<Commande> => {
  if (!_realtimeOrdersCache) {
    console.log('🚀 Initializing real-time orders cache');
    _realtimeOrdersCache = new RealtimeCache<Commande>(
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
  }
  return _realtimeOrdersCache;
};

// Backward compatibility
export const realtimeOrdersCache = getRealtimeOrdersCache();

// Real-time Tables Cache
interface Table {
  id: number;
  numero: number;
  status: 'libre' | 'occupée' | 'reservée' | 'sale';
  places: number;
  position?: { x: number; y: number };
}

export const getRealtimeTablesCache = (): RealtimeCache<Table> => {
  if (!_realtimeTablesCache) {
    console.log('🚀 Initializing real-time tables cache');
    _realtimeTablesCache = new RealtimeCache<Table>(
      'tables',
      (doc) => ({
        id: doc.id,
        numero: doc.numero,
        status: doc.status,
        places: doc.places,
        position: doc.position
      })
    );
  }
  return _realtimeTablesCache;
};

// Backward compatibility
export const realtimeTablesCache = getRealtimeTablesCache();

// Enhanced React hooks with better error handling
export const useRealtimeMenu = () => {
  const [menuItems, setMenuItems] = useState<Plat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cache = getRealtimeMenuCache();
      const unsubscribe = cache.subscribe((items) => {
        setMenuItems(items);
        setIsLoading(false);
        setError(null);
      });

      // Check cache status periodically
      const statusCheck = setInterval(() => {
        const status = cache.getStatus();
        if (status.hasError && !error) {
          setError('Connection lost - showing cached data');
        } else if (!status.hasError && error) {
          setError(null);
        }
      }, 5000);

      return () => {
        unsubscribe();
        clearInterval(statusCheck);
      };
    } catch (err) {
      console.error('Error initializing menu cache:', err);
      setError('Failed to initialize menu cache');
      setIsLoading(false);
    }
  }, [error]);

  return { menuItems, isLoading, error };
};

// Hook for real-time stock monitoring
export const useRealtimeStock = () => {
  const [stockItems, setStockItems] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<Stock[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cache = getRealtimeStockCache();
      const unsubscribe = cache.subscribe((items) => {
        setStockItems(items);
        setIsLoading(false);
        setError(null);
        
        // Calculate low stock items
        const lowStock = items.filter(item => 
          item.minLevel && item.quantity <= item.minLevel
        );
        setLowStockItems(lowStock);
      });

      // Check cache status periodically
      const statusCheck = setInterval(() => {
        const status = cache.getStatus();
        if (status.hasError && !error) {
          setError('Connection lost - showing cached data');
        } else if (!status.hasError && error) {
          setError(null);
        }
      }, 5000);

      return () => {
        unsubscribe();
        clearInterval(statusCheck);
      };
    } catch (err) {
      console.error('Error initializing stock cache:', err);
      setError('Failed to initialize stock cache');
      setIsLoading(false);
    }
  }, [error]);

  return { stockItems, lowStockItems, isLoading, error };
};

// Hook for real-time orders (kitchen/service)
export const useRealtimeOrders = (statusFilter?: string) => {
  const [orders, setOrders] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cache = getRealtimeOrdersCache();
      const unsubscribe = cache.subscribe((allOrders) => {
        const filteredOrders = statusFilter 
          ? allOrders.filter(order => order.status === statusFilter)
          : allOrders;
        
        setOrders(filteredOrders);
        setIsLoading(false);
        setError(null);
      });

      // Check cache status periodically
      const statusCheck = setInterval(() => {
        const status = cache.getStatus();
        if (status.hasError && !error) {
          setError('Connection lost - showing cached data');
        } else if (!status.hasError && error) {
          setError(null);
        }
      }, 5000);

      return () => {
        unsubscribe();
        clearInterval(statusCheck);
      };
    } catch (err) {
      console.error('Error initializing orders cache:', err);
      setError('Failed to initialize orders cache');
      setIsLoading(false);
    }
  }, [statusFilter, error]);

  return { orders, isLoading, error };
};

// Hook for real-time table status
export const useRealtimeTables = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cache = getRealtimeTablesCache();
      const unsubscribe = cache.subscribe((allTables) => {
        setTables(allTables);
        setIsLoading(false);
        setError(null);
        
        // Calculate available tables
        const available = allTables.filter(table => table.status === 'libre');
        setAvailableTables(available);
      });

      // Check cache status periodically
      const statusCheck = setInterval(() => {
        const status = cache.getStatus();
        if (status.hasError && !error) {
          setError('Connection lost - showing cached data');
        } else if (!status.hasError && error) {
          setError(null);
        }
      }, 5000);

      return () => {
        unsubscribe();
        clearInterval(statusCheck);
      };
    } catch (err) {
      console.error('Error initializing tables cache:', err);
      setError('Failed to initialize tables cache');
      setIsLoading(false);
    }
  }, [error]);

  return { tables, availableTables, isLoading, error };
};

// Cache management utilities
export const clearAllCaches = () => {
  console.log('🧹 Clearing all real-time caches');
  if (_realtimeMenuCache) _realtimeMenuCache.clearCache();
  if (_realtimeStockCache) _realtimeStockCache.clearCache();
  if (_realtimeOrdersCache) _realtimeOrdersCache.clearCache();
  if (_realtimeTablesCache) _realtimeTablesCache.clearCache();
};

export const getAllCacheStatus = () => {
  return {
    menu: _realtimeMenuCache?.getStatus() || { initialized: false },
    stock: _realtimeStockCache?.getStatus() || { initialized: false },
    orders: _realtimeOrdersCache?.getStatus() || { initialized: false },
    tables: _realtimeTablesCache?.getStatus() || { initialized: false }
  };
};

export const forceReconnectAll = () => {
  console.log('🔄 Force reconnecting all real-time caches');
  if (_realtimeMenuCache) _realtimeMenuCache.forceReconnect();
  if (_realtimeStockCache) _realtimeStockCache.forceReconnect();
  if (_realtimeOrdersCache) _realtimeOrdersCache.forceReconnect();
  if (_realtimeTablesCache) _realtimeTablesCache.forceReconnect();
};

// Debug utility to check cache health
export const debugCacheHealth = () => {
  const status = getAllCacheStatus();
  console.log('🔍 Real-time Cache Health Report:');
  console.table(status);
  return status;
};

export default {
  // Cache getter functions (recommended)
  getRealtimeMenuCache,
  getRealtimeStockCache,
  getRealtimeOrdersCache,
  getRealtimeTablesCache,
  
  // Cache instances (backward compatibility)
  realtimeMenuCache,
  realtimeStockCache,
  realtimeOrdersCache,
  realtimeTablesCache,
  
  // React hooks
  useRealtimeMenu,
  useRealtimeStock,
  useRealtimeOrders,
  useRealtimeTables,
  
  // Utilities
  clearAllCaches,
  getAllCacheStatus,
  forceReconnectAll,
  debugCacheHealth
};
