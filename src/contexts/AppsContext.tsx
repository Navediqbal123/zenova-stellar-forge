import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { App, AppInsert, AppUpdate, Category, AppStatus } from '@/types/database.types';

// Extended App type with developer name for display
export interface AppWithDeveloper extends App {
  developer_name?: string;
  // UI-friendly aliases (computed from actual fields)
  icon?: string;
  // category is inherited from App type
}

interface AppsContextType {
  apps: AppWithDeveloper[];
  categories: Category[];
  isLoading: boolean;
  featuredApps: AppWithDeveloper[];
  trendingApps: AppWithDeveloper[];
  getAppsByCategory: (categoryId: string) => AppWithDeveloper[];
  getAppsByDeveloper: (developerId: string) => AppWithDeveloper[];
  getAppById: (appId: string) => AppWithDeveloper | undefined;
  searchApps: (query: string) => Promise<AppWithDeveloper[]>;
  updateAppStatus: (appId: string, status: AppStatus) => Promise<void>;
  addApp: (app: Omit<AppInsert, 'id' | 'created_at' | 'updated_at' | 'downloads' | 'rating' | 'review_count' | 'status'>) => Promise<void>;
  refreshApps: () => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const AppsContext = createContext<AppsContextType | undefined>(undefined);

// Default categories as fallback
const defaultCategories: Category[] = [
  { id: 'games', name: 'Games', icon: '🎮', description: 'Play the best mobile games', created_at: new Date().toISOString() },
  { id: 'social', name: 'Social', icon: '💬', description: 'Connect with friends', created_at: new Date().toISOString() },
  { id: 'productivity', name: 'Productivity', icon: '📊', description: 'Get things done', created_at: new Date().toISOString() },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', description: 'Movies, music & more', created_at: new Date().toISOString() },
  { id: 'education', name: 'Education', icon: '📚', description: 'Learn something new', created_at: new Date().toISOString() },
  { id: 'finance', name: 'Finance', icon: '💰', description: 'Manage your money', created_at: new Date().toISOString() },
  { id: 'health', name: 'Health & Fitness', icon: '💪', description: 'Stay healthy', created_at: new Date().toISOString() },
  { id: 'tools', name: 'Tools', icon: '🔧', description: 'Useful utilities', created_at: new Date().toISOString() },
];

export function AppsProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<AppWithDeveloper[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching apps:', error);
        return [];
      }

      return (data || []).map((app: any) => ({
        ...app,
        developer_name: 'Developer',
        icon: app.icon_url || '📱',
        category: app.category,
      }));
    } catch (err) {
      console.error('Error in fetchApps:', err);
      return [];
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return defaultCategories;
      }

      return data && data.length > 0 ? data : defaultCategories;
    } catch (err) {
      console.error('Error in fetchCategories:', err);
      return defaultCategories;
    }
  }, []);

  const refreshApps = useCallback(async () => {
    const fetchedApps = await fetchApps();
    setApps(fetchedApps);
  }, [fetchApps]);

  const refreshCategories = useCallback(async () => {
    const fetchedCategories = await fetchCategories();
    setCategories(fetchedCategories);
  }, [fetchCategories]);

  // Initial data fetch
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      
      const [fetchedApps, fetchedCategories] = await Promise.all([
        fetchApps(),
        fetchCategories(),
      ]);

      if (mounted) {
        setApps(fetchedApps);
        setCategories(fetchedCategories);
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [fetchApps, fetchCategories]);

  // Real-time subscription for apps
  useEffect(() => {
    const channel = supabase
      .channel('apps_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'apps',
        },
        () => {
          // Refresh apps on any change
          refreshApps();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshApps]);

  const approvedApps = apps.filter(app => app.status === 'approved');
  const featuredApps = approvedApps.filter(app => app.featured);
  const trendingApps = approvedApps.filter(app => app.trending);

  const getAppsByCategory = useCallback((categoryId: string) => 
    approvedApps.filter(app => app.category === categoryId), 
    [approvedApps]
  );

  const getAppsByDeveloper = useCallback((developerId: string) => 
    apps.filter(app => app.developer_id === developerId),
    [apps]
  );

  const getAppById = useCallback((appId: string) => 
    apps.find(app => app.id === appId),
    [apps]
  );

  const searchApps = useCallback(async (query: string): Promise<AppWithDeveloper[]> => {
    if (!query.trim()) return approvedApps;
    try {
      const { data, error } = await (supabase.rpc as any)('search_apps_priority', { search_term: query.trim() });
      if (error) {
        console.error('RPC search error, falling back to local:', error);
        const lowerQuery = query.toLowerCase();
        return approvedApps.filter(app =>
          app.name.toLowerCase().includes(lowerQuery) ||
          app.description.toLowerCase().includes(lowerQuery) ||
          (app.category || '').toLowerCase().includes(lowerQuery)
        );
      }
      return (data || []).map((app: any) => ({
        ...app,
        developer_name: app.developer_name || 'Developer',
        icon: app.icon_url || '📱',
        category: app.category,
      }));
    } catch {
      const lowerQuery = query.toLowerCase();
      return approvedApps.filter(app =>
        app.name.toLowerCase().includes(lowerQuery) ||
        app.description.toLowerCase().includes(lowerQuery) ||
        (app.category || '').toLowerCase().includes(lowerQuery)
      );
    }
  }, [approvedApps]);

  const updateAppStatus = async (appId: string, status: AppStatus) => {
    const { error } = await supabase
      .from('apps')
      .update({ status, updated_at: new Date().toISOString() } as AppUpdate)
      .eq('id', appId);

    if (error) {
      console.error('Error updating app status:', error);
      throw error;
    }

    // Optimistic update
    setApps(prev => 
      prev.map(app => 
        app.id === appId 
          ? { ...app, status, updated_at: new Date().toISOString() } 
          : app
      )
    );
  };

  const addApp = async (appData: Omit<AppInsert, 'id' | 'created_at' | 'updated_at' | 'downloads' | 'rating' | 'review_count' | 'status'>) => {
    const newApp: AppInsert = {
      ...appData,
      status: 'pending',
      downloads: 0,
      rating: 0,
      review_count: 0,
    };

    const { error } = await supabase
      .from('apps')
      .insert([newApp]);

    if (error) {
      console.error('Error adding app:', error);
      throw error;
    }

    // Refresh to get the app with developer name
    await refreshApps();
  };

  return (
    <AppsContext.Provider
      value={{
        apps,
        categories,
        isLoading,
        featuredApps,
        trendingApps,
        getAppsByCategory,
        getAppsByDeveloper,
        getAppById,
        searchApps,
        updateAppStatus,
        addApp,
        refreshApps,
        refreshCategories,
      }}
    >
      {children}
    </AppsContext.Provider>
  );
}

export function useApps() {
  const context = useContext(AppsContext);
  if (context === undefined) {
    throw new Error('useApps must be used within an AppsProvider');
  }
  return context;
}

// Re-export types
export type { App, AppInsert, AppUpdate, Category, AppStatus };
