import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { adminAPI } from '@/lib/axios';
import type { Developer, DeveloperStatus, DeveloperUpdate } from '@/types/database.types';

interface UseDevelopersQueryReturn {
  developers: Developer[];
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  updateStatus: (developerId: string, status: DeveloperStatus, reason?: string) => Promise<void>;
}

export function useDevelopersQuery(): UseDevelopersQueryReturn {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDevelopers = useCallback(async () => {
    try {
      // Try backend API first
      try {
        const response = await adminAPI.getAllDevelopers();
        if (response.data?.developers) {
          return response.data.developers;
        }
      } catch {
        // Fallback to Supabase
      }

      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching developers:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in fetchDevelopers:', err);
      return [];
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const data = await fetchDevelopers();
    setDevelopers(data);
    setIsRefreshing(false);
  }, [fetchDevelopers]);

  const updateStatus = useCallback(async (developerId: string, status: DeveloperStatus, reason?: string) => {
    // Optimistic update
    setDevelopers(prev => 
      prev.map(dev => 
        dev.id === developerId 
          ? { ...dev, status, rejection_reason: reason || dev.rejection_reason, updated_at: new Date().toISOString() }
          : dev
      )
    );

    try {
      // Try backend API first
      try {
        await adminAPI.updateDeveloperStatus(developerId, status, reason);
        return;
      } catch {
        // Fallback to Supabase
      }

      const updateData: DeveloperUpdate = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('developers')
        .update(updateData)
        .eq('id', developerId);

      if (error) {
        throw error;
      }
    } catch (error) {
      // Revert optimistic update on error
      const data = await fetchDevelopers();
      setDevelopers(data);
      throw error;
    }
  }, [fetchDevelopers]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    const loadDevelopers = async () => {
      setIsLoading(true);
      const data = await fetchDevelopers();
      if (mounted) {
        setDevelopers(data);
        setIsLoading(false);
      }
    };

    loadDevelopers();

    // Real-time subscription
    const channel = supabase
      .channel('developers_query_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'developers',
        },
        async () => {
          if (mounted) {
            const data = await fetchDevelopers();
            if (mounted) {
              setDevelopers(data);
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchDevelopers]);

  return {
    developers,
    isLoading,
    isRefreshing,
    refresh,
    updateStatus,
  };
}
