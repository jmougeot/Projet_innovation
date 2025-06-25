import { useState, useEffect } from 'react';
import { 
  startTicketsRealtimeSync, 
  stopTicketsRealtimeSync,
  startTableTicketsRealtimeSync,
  getTicketListenersStatus,
  debugTicketsRealtimeSync
} from './realtime';
import { 
  getTicketsCacheInfo, 
  getTableCacheInfo,
  logCacheStatus
} from './cache';

// ====== HOOK POUR LA SYNCHRONISATION TEMPS RÉEL DES TICKETS ======

export interface UseTicketsRealtimeSyncReturn {
  isActive: boolean;
  error: string | null;
  listenerCount: number;
  startSync: () => Promise<void>;
  stopSync: () => void;
  restart: () => Promise<void>;
}

/**
 * 🔄 Hook pour gérer la synchronisation temps réel des tickets d'un restaurant
 */
export const useTicketsRealtimeSync = (restaurantId: string): UseTicketsRealtimeSyncReturn => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listenerCount, setListenerCount] = useState(0);

  // Fonction pour démarrer la synchronisation
  const startSync = async () => {
    try {
      setError(null);
      await startTicketsRealtimeSync(restaurantId);
      const status = getTicketListenersStatus();
      setIsActive(status.isActive);
      setListenerCount(status.activeListenersCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors du démarrage de la sync tickets:', err);
    }
  };

  // Fonction pour arrêter la synchronisation
  const stopSync = () => {
    stopTicketsRealtimeSync(restaurantId);
    const status = getTicketListenersStatus();
    setIsActive(status.isActive);
    setListenerCount(status.activeListenersCount);
  };

  // Fonction pour redémarrer la synchronisation
  const restart = async () => {
    stopSync();
    await startSync();
  };

  // Vérifier le statut au montage et périodiquement
  useEffect(() => {
    const checkStatus = () => {
      const status = getTicketListenersStatus();
      setIsActive(status.isActive);
      setListenerCount(status.activeListenersCount);
    };

    // Vérifier au montage
    checkStatus();

    // Vérifier périodiquement (toutes les 5 secondes)
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [restaurantId]);

  // Démarrer automatiquement la sync au montage
  useEffect(() => {
    if (restaurantId && !isActive) {
      startSync();
    }

    // Nettoyage au démontage
    return () => {
      if (isActive) {
        stopTicketsRealtimeSync(restaurantId);
      }
    };
  }, [restaurantId]);

  return {
    isActive,
    error,
    listenerCount,
    startSync,
    stopSync,
    restart
  };
};

// ====== HOOK POUR SURVEILLER LE CACHE DES TICKETS ======

export interface UseTicketsCacheStatusReturn {
  globalCache: {
    isActive: boolean;
    itemsCount: number;
    timeLeftMs: number;
    timeLeftFormatted: string;
  };
  tableCache: {
    totalTablesCached: number;
    tablesInfo: Array<{
      tableId: number;
      hasTicket: boolean;
      ticketId: string | null;
      timeLeftMs: number;
      timeLeftFormatted: string;
    }>;
  };
  refresh: () => void;
  debug: () => void;
}

/**
 * 📊 Hook pour surveiller le statut du cache des tickets
 */
export const useTicketsCacheStatus = (): UseTicketsCacheStatusReturn => {
  const [globalCache, setGlobalCache] = useState({
    isActive: false,
    itemsCount: 0,
    timeLeftMs: 0,
    timeLeftFormatted: '0s'
  });

  const [tableCache, setTableCache] = useState({
    totalTablesCached: 0,
    tablesInfo: [] as Array<{
      tableId: number;
      hasTicket: boolean;
      ticketId: string | null;
      timeLeftMs: number;
      timeLeftFormatted: string;
    }>
  });

  const refresh = () => {
    const globalInfo = getTicketsCacheInfo();
    const tableInfo = getTableCacheInfo();

    setGlobalCache({
      isActive: globalInfo.isActive,
      itemsCount: globalInfo.itemsCount,
      timeLeftMs: globalInfo.timeLeftMs,
      timeLeftFormatted: globalInfo.timeLeftFormatted
    });

    setTableCache({
      totalTablesCached: tableInfo.totalTablesCached,
      tablesInfo: tableInfo.tablesInfo
    });
  };

  const debug = () => {
    logCacheStatus('Hook Debug');
    debugTicketsRealtimeSync();
  };

  // Rafraîchir périodiquement
  useEffect(() => {
    refresh(); // Initial
    const interval = setInterval(refresh, 1000); // Toutes les secondes
    return () => clearInterval(interval);
  }, []);

  return {
    globalCache,
    tableCache,
    refresh,
    debug
  };
};

// ====== HOOK POUR LA SYNCHRONISATION D'UNE TABLE SPÉCIFIQUE ======

export interface UseTableTicketsRealtimeSyncReturn {
  isActive: boolean;
  error: string | null;
  startTableSync: () => Promise<void>;
  stopTableSync: () => void;
}

/**
 * 🔄 Hook pour gérer la synchronisation temps réel des tickets d'une table spécifique
 */
export const useTableTicketsRealtimeSync = (
  restaurantId: string, 
  tableId: number
): UseTableTicketsRealtimeSyncReturn => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTableSync = async () => {
    try {
      setError(null);
      await startTableTicketsRealtimeSync(restaurantId, tableId);
      setIsActive(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error(`Erreur lors du démarrage de la sync pour la table ${tableId}:`, err);
    }
  };

  const stopTableSync = () => {
    const status = getTicketListenersStatus();
    const tableListenerKey = `${restaurantId}_table_${tableId}`;
    const hasTableListener = status.listeners.includes(tableListenerKey);
    
    if (hasTableListener) {
      stopTicketsRealtimeSync(restaurantId);
      setIsActive(false);
    }
  };

  // Vérifier le statut périodiquement
  useEffect(() => {
    const checkStatus = () => {
      const status = getTicketListenersStatus();
      const tableListenerKey = `${restaurantId}_table_${tableId}`;
      const hasTableListener = status.listeners.includes(tableListenerKey);
      setIsActive(hasTableListener);
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [restaurantId, tableId]);

  return {
    isActive,
    error,
    startTableSync,
    stopTableSync
  };
};
