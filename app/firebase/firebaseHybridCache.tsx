import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Hybrid cache that checks for updates periodically
class HybridCache<T> {
  private cache: T[] | null = null;
  private lastCacheUpdate = 0;
  private lastModifiedCheck = 0;
  private cacheDuration: number;
  private heartbeatInterval: number;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private onUpdateCallback?: (data: T[]) => void;

  constructor(
    private collectionName: string,
    private transform: (doc: any) => T,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    heartbeatInterval = 30 * 1000   // Check every 30 seconds
  ) {
    this.cacheDuration = cacheDuration;
    this.heartbeatInterval = heartbeatInterval;
  }

  // Start automatic update checking
  startHeartbeat(callback?: (data: T[]) => void) {
    this.onUpdateCallback = callback;
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(async () => {
      await this.checkForUpdates();
    }, this.heartbeatInterval);

    console.log(`💓 Heartbeat started for ${this.collectionName} (every ${this.heartbeatInterval/1000}s)`);
  }

  // Stop automatic checking
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      console.log(`🛑 Heartbeat stopped for ${this.collectionName}`);
    }
  }

  // Check if data has been modified since last cache
  private async checkForUpdates(): Promise<boolean> {
    try {
      // Get the most recently modified document
      const recentQuery = query(
        collection(db, this.collectionName),
        orderBy('updatedAt', 'desc'), // Assumes documents have updatedAt field
        limit(1)
      );

      const snapshot = await getDocs(recentQuery);
      
      if (!snapshot.empty) {
        const latestDoc = snapshot.docs[0];
        const latestUpdate = latestDoc.data().updatedAt?.toMillis() || 0;
        
        // If data is newer than our cache, refresh
        if (latestUpdate > this.lastCacheUpdate) {
          console.log(`🔄 Data changes detected in ${this.collectionName}, refreshing cache`);
          await this.refreshCache();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Error checking updates for ${this.collectionName}:`, error);
      return false;
    }
  }

  // Force refresh cache
  private async refreshCache(): Promise<T[]> {
    const snapshot = await getDocs(collection(db, this.collectionName));
    const data: T[] = [];
    
    snapshot.forEach(doc => {
      data.push(this.transform({ id: doc.id, ...doc.data() }));
    });

    this.cache = data;
    this.lastCacheUpdate = Date.now();
    
    // Notify callback if registered
    if (this.onUpdateCallback) {
      this.onUpdateCallback(data);
    }

    console.log(`✅ Cache refreshed for ${this.collectionName} (${data.length} items)`);
    return data;
  }

  // Get data (with smart caching)
  async getData(): Promise<T[]> {
    const now = Date.now();
    
    // Return cache if still valid
    if (this.cache && (now - this.lastCacheUpdate) < this.cacheDuration) {
      console.log(`📦 Data retrieved from cache for ${this.collectionName}`);
      return this.cache;
    }

    // Cache expired or doesn't exist, refresh
    return await this.refreshCache();
  }

  // Manual methods
  clearCache() {
    this.cache = null;
    this.lastCacheUpdate = 0;
    console.log(`🧹 Cache cleared for ${this.collectionName}`);
  }

  getCurrentCache(): T[] | null {
    return this.cache;
  }

  getCacheInfo() {
    const now = Date.now();
    const age = now - this.lastCacheUpdate;
    
    return {
      hasCache: !!this.cache,
      itemCount: this.cache?.length || 0,
      ageMs: age,
      isValid: age < this.cacheDuration,
      isHeartbeatActive: !!this.heartbeatTimer,
      heartbeatInterval: this.heartbeatInterval
    };
  }
}

// Example usage
interface Plat {
  id: string;
  name: string;
  category: string;
  price: number;
  updatedAt?: any;
}

export const hybridMenuCache = new HybridCache<Plat>(
  'menu',
  (doc) => ({
    id: doc.id,
    name: doc.name,
    category: doc.category,
    price: doc.price,
    updatedAt: doc.updatedAt
  }),
  5 * 60 * 1000, // 5 minute cache
  30 * 1000      // Check every 30 seconds
);

// React hook for hybrid cache
export function useHybridCache<T>(cache: HybridCache<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Initial load
    cache.getData().then((items: T[]) => {
      setData(items);
      setIsLoading(false);
      setLastUpdate(new Date());
    });

    // Start heartbeat for automatic updates
    cache.startHeartbeat((updatedItems: T[]) => {
      setData(updatedItems);
      setLastUpdate(new Date());
    });

    return () => {
      cache.stopHeartbeat();
    };
  }, [cache]);

  return { 
    data, 
    isLoading, 
    lastUpdate,
    refresh: () => cache.getData().then(setData),
    cacheInfo: cache.getCacheInfo()
  };
}

export default {
  HybridCache: HybridCache,
  hybridMenuCache: hybridMenuCache,
  useHybridCache: useHybridCache
};

