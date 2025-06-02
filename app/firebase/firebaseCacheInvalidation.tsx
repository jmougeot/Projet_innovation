import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Cache invalidation system using Firebase signals
interface CacheInvalidationSignal {
  id?: string;
  collection: string;
  action: 'create' | 'update' | 'delete';
  documentId?: string;
  timestamp: any;
  userId: string;
}

class CacheInvalidationManager {
  private listeners: Map<string, Set<() => void>> = new Map();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.startListening();
  }

  // Listen for invalidation signals
  private startListening() {
    console.log('🔔 Starting cache invalidation listener');
    
    this.unsubscribe = onSnapshot(
      query(
        collection(db, 'cache_invalidation'),
        orderBy('timestamp', 'desc'),
        limit(50) // Keep recent signals only
      ),
      (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const signal = change.doc.data() as CacheInvalidationSignal;
            this.handleInvalidationSignal(signal);
          }
        });
      }
    );
  }

  // Handle received invalidation signal
  private handleInvalidationSignal(signal: CacheInvalidationSignal) {
    console.log(`🔔 Cache invalidation signal received for ${signal.collection}:${signal.action}`);
    
    const callbacks = this.listeners.get(signal.collection);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }

  // Subscribe to invalidation for specific collection
  subscribe(collectionName: string, callback: () => void): () => void {
    if (!this.listeners.has(collectionName)) {
      this.listeners.set(collectionName, new Set());
    }
    
    this.listeners.get(collectionName)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(collectionName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(collectionName);
        }
      }
    };
  }

  // Send invalidation signal (call this when modifying data)
  async sendInvalidationSignal(
    collectionName: string, 
    action: 'create' | 'update' | 'delete',
    userId: string,
    documentId?: string
  ) {
    try {
      await addDoc(collection(db, 'cache_invalidation'), {
        collection: collectionName,
        action,
        documentId,
        userId,
        timestamp: serverTimestamp()
      });
      
      console.log(`📡 Cache invalidation signal sent for ${collectionName}:${action}`);
    } catch (error) {
      console.error('❌ Error sending cache invalidation signal:', error);
    }
  }

  // Cleanup
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Global invalidation manager
export const cacheInvalidationManager = new CacheInvalidationManager();

// Enhanced cache with invalidation signals
class SignalAwareCache<T> {
  private cache: T[] | null = null;
  private lastCacheUpdate = 0;
  private cacheDuration: number;
  private unsubscribeInvalidation: (() => void) | null = null;

  constructor(
    private collectionName: string,
    private fetchFunction: () => Promise<T[]>,
    cacheDuration = 5 * 60 * 1000
  ) {
    this.cacheDuration = cacheDuration;
    
    // Subscribe to invalidation signals
    this.unsubscribeInvalidation = cacheInvalidationManager.subscribe(
      collectionName,
      () => this.invalidateCache()
    );
  }

  // Get data with cache
  async getData(): Promise<T[]> {
    const now = Date.now();
    
    // Return cache if valid
    if (this.cache && (now - this.lastCacheUpdate) < this.cacheDuration) {
      console.log(`📦 Data retrieved from cache for ${this.collectionName}`);
      return this.cache;
    }

    // Fetch fresh data
    return await this.refreshCache();
  }

  // Refresh cache
  private async refreshCache(): Promise<T[]> {
    console.log(`🔄 Refreshing cache for ${this.collectionName}`);
    
    this.cache = await this.fetchFunction();
    this.lastCacheUpdate = Date.now();
    
    console.log(`✅ Cache refreshed for ${this.collectionName} (${this.cache.length} items)`);
    return this.cache;
  }

  // Invalidate cache (called by signal)
  private invalidateCache() {
    console.log(`🔔 Cache invalidated for ${this.collectionName} by signal`);
    this.cache = null;
    this.lastCacheUpdate = 0;
  }

  // Manual cache clear
  clearCache() {
    this.invalidateCache();
  }

  // Get cache info
  getCacheInfo() {
    const now = Date.now();
    const age = now - this.lastCacheUpdate;
    
    return {
      hasCache: !!this.cache,
      itemCount: this.cache?.length || 0,
      ageMs: age,
      isValid: age < this.cacheDuration,
      hasInvalidationListener: !!this.unsubscribeInvalidation
    };
  }

  // Cleanup
  destroy() {
    if (this.unsubscribeInvalidation) {
      this.unsubscribeInvalidation();
    }
  }
}

// Modified Firebase functions with invalidation signals
export const addMenuItemWithSignal = async (plat: any, userId: string) => {
  try {
    // Add the menu item
    const docRef = await addDoc(collection(db, "menu"), plat);
    
    // Send invalidation signal
    await cacheInvalidationManager.sendInvalidationSignal('menu', 'create', userId, docRef.id);
    
    console.log("✅ Menu item added and cache invalidation sent");
    return docRef;
  } catch (error) {
    console.error("❌ Error adding menu item:", error);
    throw error;
  }
};

export default {
  CacheInvalidationManager,
  SignalAwareCache,
  cacheInvalidationManager,
  addMenuItemWithSignal
};
