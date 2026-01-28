import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAPI } from '@/lib/axios';
import { supabase } from '@/lib/supabase';

export interface RealTimeStats {
  totalDevelopers: number;
  pendingDevelopers: number;
  approvedDevelopers: number;
  totalApps: number;
  pendingApps: number;
  approvedApps: number;
  totalDownloads: number;
  avgRating: number;
}

interface UseRealTimeStatsResult {
  stats: RealTimeStats;
  isLoading: boolean;
  isLive: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

const DEFAULT_STATS: RealTimeStats = {
  totalDevelopers: 0,
  pendingDevelopers: 0,
  approvedDevelopers: 0,
  totalApps: 0,
  pendingApps: 0,
  approvedApps: 0,
  totalDownloads: 0,
  avgRating: 0,
};

export function useRealTimeStats(refreshInterval = 30000): UseRealTimeStatsResult {
  const [stats, setStats] = useState<RealTimeStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      // Try backend API first
      try {
        const response = await adminAPI.getStatsSummary();
        if (response.data) {
          setStats({
            totalDevelopers: response.data.totalDevelopers || 0,
            pendingDevelopers: response.data.pendingDevelopers || 0,
            approvedDevelopers: response.data.approvedDevelopers || 0,
            totalApps: response.data.totalApps || 0,
            pendingApps: response.data.pendingApps || 0,
            approvedApps: response.data.approvedApps || 0,
            totalDownloads: response.data.totalDownloads || 0,
            avgRating: parseFloat(response.data.avgRating) || 0,
          });
          setLastUpdated(new Date());
          setIsLive(true);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fallback to Supabase
      }

      // Supabase fallback - fetch from both tables
      const [developersResult, appsResult] = await Promise.all([
        supabase.from('developers').select('status'),
        supabase.from('apps').select('status, downloads, rating'),
      ]);

      const developers = developersResult.data || [];
      const apps = appsResult.data || [];

      const totalDownloads = apps.reduce((sum, app) => sum + (app.downloads || 0), 0);
      const ratings = apps.filter(app => app.rating > 0);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, app) => sum + app.rating, 0) / ratings.length
        : 0;

      setStats({
        totalDevelopers: developers.length,
        pendingDevelopers: developers.filter(d => d.status === 'pending').length,
        approvedDevelopers: developers.filter(d => d.status === 'approved').length,
        totalApps: apps.length,
        pendingApps: apps.filter(a => a.status === 'pending').length,
        approvedApps: apps.filter(a => a.status === 'approved').length,
        totalDownloads,
        avgRating,
      });
      
      setLastUpdated(new Date());
      setIsLive(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching real-time stats:', err);
      setIsLive(false);
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every X seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchStats();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats, refreshInterval]);

  // Real-time subscriptions for instant updates
  useEffect(() => {
    const developersChannel = supabase
      .channel('stats_developers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'developers' }, () => {
        fetchStats();
      })
      .subscribe();

    const appsChannel = supabase
      .channel('stats_apps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(developersChannel);
      supabase.removeChannel(appsChannel);
    };
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    isLive,
    lastUpdated,
    refresh,
  };
}
