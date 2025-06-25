import { useState, useEffect, useCallback } from 'react';
import { 
  getAllActiveBranchTips, 
  getBranchTip, 
  getBatchBranchTips,
  getBranchTipsCacheStats 
} from './blockchain';
import { TicketData } from './types';

// ====== HOOK OPTIMISÉ POUR ACCÈS RAPIDE AUX BOUTS DE BRANCHES ======

export interface UseBranchTipsReturn {
  // Données
  allActiveTips: TicketData[];
  isLoading: boolean;
  error: string | null;
  
  // Actions optimisées
  refreshAllTips: () => Promise<void>;
  getBranchTipFast: (mainTicketId: string) => Promise<TicketData>;
  getBatchTipsFast: (mainTicketIds: string[]) => Promise<Map<string, TicketData>>;
  
  // Métriques
  cacheStats: any;
  lastUpdateTime: Date | null;
  queryCount: number;
}

/**
 * 🚀 Hook optimisé pour accéder rapidement aux bouts de branches (tickets actifs)
 * Remplace les nombreuses requêtes individuelles par des requêtes batch intelligentes
 */
export const useBranchTips = (restaurantId: string): UseBranchTipsReturn => {
  const [allActiveTips, setAllActiveTips] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<any>({});
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [queryCount, setQueryCount] = useState(0);

  // Fonction pour rafraîchir tous les bouts de branches
  const refreshAllTips = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const startTime = Date.now();
      console.log('🚀 [useBranchTips] Récupération optimisée de tous les bouts de branches...');
      
      const tips = await getAllActiveBranchTips(restaurantId);
      const endTime = Date.now();
      
      setAllActiveTips(tips);
      setLastUpdateTime(new Date());
      setQueryCount(prev => prev + 1);
      
      // Mettre à jour les stats du cache
      const stats = getBranchTipsCacheStats();
      setCacheStats(stats);
      
      console.log(`✅ [useBranchTips] ${tips.length} bouts de branches récupérés en ${endTime - startTime}ms`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ [useBranchTips] Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  // Fonction optimisée pour récupérer un bout de branche spécifique
  const getBranchTipFast = useCallback(async (mainTicketId: string): Promise<TicketData> => {
    try {
      console.log('⚡ [useBranchTips] Récupération rapide bout de branche:', mainTicketId);
      
      const startTime = Date.now();
      const tip = await getBranchTip(mainTicketId, restaurantId);
      const endTime = Date.now();
      
      setQueryCount(prev => prev + 1);
      
      // Mettre à jour les stats du cache
      const stats = getBranchTipsCacheStats();
      setCacheStats(stats);
      
      console.log(`⚡ [useBranchTips] Bout de branche récupéré en ${endTime - startTime}ms`);
      
      return tip;
    } catch (err) {
      console.error('❌ [useBranchTips] Erreur récupération rapide:', err);
      throw err;
    }
  }, [restaurantId]);

  // Fonction optimisée pour récupérer plusieurs bouts de branches
  const getBatchTipsFast = useCallback(async (mainTicketIds: string[]): Promise<Map<string, TicketData>> => {
    try {
      console.log('🔄 [useBranchTips] Récupération batch de', mainTicketIds.length, 'bouts de branches');
      
      const startTime = Date.now();
      const tipsMap = await getBatchBranchTips(mainTicketIds, restaurantId);
      const endTime = Date.now();
      
      setQueryCount(prev => prev + 1);
      
      // Mettre à jour les stats du cache
      const stats = getBranchTipsCacheStats();
      setCacheStats(stats);
      
      console.log(`🔄 [useBranchTips] Batch récupéré en ${endTime - startTime}ms:`, {
        requested: mainTicketIds.length,
        found: tipsMap.size,
        cacheHitRate: `${((stats.validEntries / Math.max(stats.totalCached, 1)) * 100).toFixed(1)}%`
      });
      
      return tipsMap;
    } catch (err) {
      console.error('❌ [useBranchTips] Erreur récupération batch:', err);
      throw err;
    }
  }, [restaurantId]);

  // Chargement initial
  useEffect(() => {
    if (restaurantId) {
      refreshAllTips();
    }
  }, [restaurantId, refreshAllTips]);

  // Mise à jour périodique des stats du cache
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = getBranchTipsCacheStats();
      setCacheStats(stats);
    }, 5000); // Toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  return {
    // Données
    allActiveTips,
    isLoading,
    error,
    
    // Actions optimisées
    refreshAllTips,
    getBranchTipFast,
    getBatchTipsFast,
    
    // Métriques
    cacheStats,
    lastUpdateTime,
    queryCount
  };
};

// ====== HOOK POUR SURVEILLANCE D'UNE BRANCHE SPÉCIFIQUE ======

export interface UseBranchTipReturn {
  branchTip: TicketData | null;
  isLoading: boolean;
  error: string | null;
  chainDepth: number;
  isFork: boolean;
  refresh: () => Promise<void>;
}

/**
 * ⚡ Hook pour surveiller le bout d'une branche spécifique
 */
export const useBranchTip = (mainTicketId: string, restaurantId: string): UseBranchTipReturn => {
  const [branchTip, setBranchTip] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!mainTicketId || !restaurantId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const tip = await getBranchTip(mainTicketId, restaurantId);
      setBranchTip(tip);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error(`❌ [useBranchTip] Erreur pour ${mainTicketId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [mainTicketId, restaurantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    branchTip,
    isLoading,
    error,
    chainDepth: branchTip?.forkDepth || 0,
    isFork: branchTip?.blockType === 'fork',
    refresh
  };
};

// ====== HOOK POUR MÉTRIQUES DE PERFORMANCE ======

export interface UseOptimizationMetricsReturn {
  cacheStats: any;
  performanceMetrics: {
    averageQueryTime: number;
    totalQueries: number;
    cacheHitRate: number;
    lastOptimizationUpdate: Date | null;
  };
  refreshMetrics: () => void;
}

/**
 * 📊 Hook pour surveiller les métriques d'optimisation
 */
export const useOptimizationMetrics = (): UseOptimizationMetricsReturn => {
  const [cacheStats, setCacheStats] = useState<any>({});
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageQueryTime: 0,
    totalQueries: 0,
    cacheHitRate: 0,
    lastOptimizationUpdate: null as Date | null
  });

  const refreshMetrics = useCallback(() => {
    const stats = getBranchTipsCacheStats();
    setCacheStats(stats);
    
    const hitRate = stats.totalCached > 0 ? 
      (stats.validEntries / stats.totalCached) * 100 : 0;
    
    setPerformanceMetrics(prev => ({
      ...prev,
      cacheHitRate: hitRate,
      lastOptimizationUpdate: new Date()
    }));
  }, []);

  useEffect(() => {
    refreshMetrics();
    
    const interval = setInterval(refreshMetrics, 10000); // Toutes les 10 secondes
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  return {
    cacheStats,
    performanceMetrics,
    refreshMetrics
  };
};
