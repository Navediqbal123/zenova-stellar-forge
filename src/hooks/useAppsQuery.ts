import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAPI } from '@/lib/axios';
import { supabase } from '@/lib/supabase';

export type AppStatus = 'pending' | 'approved' | 'rejected';

export interface AppData {
  id: string;
  name: string;
  description: string;
  short_description: string;
  category: string;
  developer_id: string;
  developer_name?: string;
  icon: string;
  icon_url?: string;
  apk_url?: string;
  screenshots: string[];
  version: string;
  size: string;
  downloads: number;
  rating: number;
  review_count: number;
  status: AppStatus;
  featured: boolean;
  trending: boolean;
  is_paid?: boolean;
  price?: number | null;
  contains_ads?: boolean;
  in_app_purchases?: boolean;
  ai_scan_report?: string | null;
  created_at: string;
  updated_at: string;
}

interface UseAppsQueryOptions {
  pollingInterval?: number; // in ms, set to 0 to disable
}

interface UseAppsQueryResult {
  apps: AppData[];
  pendingApps: AppData[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateStatus: (appId: string, status: AppStatus) => Promise<void>;
}

export function useAppsQuery(options: UseAppsQueryOptions = {}): UseAppsQueryResult {
  const { pollingInterval = 60000 } = options; // Default: poll every 60 seconds
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [apps, setApps] = useState<AppData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      // Try backend API first
      try {
        const response = await adminAPI.getAllApps();
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((app: any) => ({
            ...app,
            icon: app.icon || app.icon_url || '📱',
          }));
        }
      } catch {
        // Fallback to Supabase
      }

      // Supabase fallback - simple query without joins
      const { data, error: supabaseError } = await supabase
        .from('apps')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      return (data || []).map((app: any) => ({
        ...app,
        icon: app.icon_url || '📱',
        developer_name: app.developer_name || 'Unknown Developer',
      }));
    } catch (err: any) {
      console.error('Error fetching apps:', err);
      setError(err.message || 'Failed to fetch apps');
      return [];
    }
  }, []);

  const loadApps = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchApps();
    setApps(data);
    setIsLoading(false);
  }, [fetchApps]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const data = await fetchApps();
    setApps(data);
    setIsRefreshing(false);
  }, [fetchApps]);

  const updateStatus = useCallback(async (appId: string, status: AppStatus) => {
    // Optimistic update
    setApps(prev =>
      prev.map(app =>
        app.id === appId
          ? { ...app, status, updated_at: new Date().toISOString() }
          : app
      )
    );

    try {
      // Try backend API first
      try {
        await adminAPI.updateAppStatus(appId, status);
        return;
      } catch {
        // Fallback to Supabase
      }

      const { error: supabaseError } = await supabase
        .from('apps')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', appId);

      if (supabaseError) throw supabaseError;
    } catch (err: any) {
      console.error('Error updating app status:', err);
      // Revert on failure
      const data = await fetchApps();
      setApps(data);
      throw err;
    }
  }, [fetchApps]);

  useEffect(() => {
    loadApps();

    // Real-time subscription
    const channel = supabase
      .channel('apps-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'apps' },
        () => {
          refresh();
        }
      )
      .subscribe();

    // Polling for status updates (useful for developer dashboard)
    if (pollingInterval > 0) {
      pollingRef.current = setInterval(() => {
        refresh();
      }, pollingInterval);
    }

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadApps, refresh, pollingInterval]);

  const pendingApps = apps.filter(app => app.status === 'pending');

  return {
    apps,
    pendingApps,
    isLoading,
    isRefreshing,
    error,
    refresh,
    updateStatus,
  };
}
