import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isAdminEmail } from '@/lib/supabase';
import type { Developer, DeveloperInsert, DeveloperStatus, DeveloperUpdate } from '@/types/database.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  developerProfile: Developer | null;
  isDeveloperApproved: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  registerDeveloper: (data: Omit<DeveloperInsert, 'user_id' | 'email' | 'status' | 'created_at' | 'updated_at'>) => Promise<void>;
  refreshDeveloperProfile: () => Promise<void>;
  updateDeveloperStatus: (developerId: string, status: DeveloperStatus, reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [developerProfile, setDeveloperProfile] = useState<Developer | null>(null);

  const fetchDeveloperProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching developer profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in fetchDeveloperProfile:', err);
      return null;
    }
  }, []);

  const refreshDeveloperProfile = useCallback(async () => {
    if (user?.id) {
      const profile = await fetchDeveloperProfile(user.id);
      setDeveloperProfile(profile);
    }
  }, [user?.id, fetchDeveloperProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Defer fetching developer profile to avoid blocking
        setTimeout(async () => {
          if (mounted) {
            const profile = await fetchDeveloperProfile(newSession.user.id);
            if (mounted) {
              setDeveloperProfile(profile);
            }
          }
        }, 0);
      } else {
        setDeveloperProfile(null);
      }

      setIsLoading(false);
    });

    // Then get the initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const profile = await fetchDeveloperProfile(initialSession.user.id);
        if (mounted) {
          setDeveloperProfile(profile);
        }
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchDeveloperProfile]);

  // Set up real-time subscription for developer profile changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('developer_profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'developers',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setDeveloperProfile(payload.new as Developer);
          } else if (payload.eventType === 'DELETE') {
            setDeveloperProfile(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isAdmin = isAdminEmail(user?.email);
  const isDeveloperApproved = developerProfile?.status === 'approved';

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setDeveloperProfile(null);
  };

  const registerDeveloper = async (data: Omit<DeveloperInsert, 'user_id' | 'email' | 'status' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Must be logged in');

    const developerData: DeveloperInsert = {
      ...data,
      user_id: user.id,
      email: user.email!,
      status: 'pending',
    };

    const { data: newDeveloper, error } = await supabase
      .from('developers')
      .insert([developerData])
      .select()
      .single();

    if (error) {
      console.error('Developer registration error:', error);
      throw error;
    }

    setDeveloperProfile(newDeveloper);
  };

  const updateDeveloperStatus = async (developerId: string, status: DeveloperStatus, reason?: string) => {
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
      console.error('Error updating developer status:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        developerProfile,
        isDeveloperApproved,
        login,
        register,
        logout,
        registerDeveloper,
        refreshDeveloperProfile,
        updateDeveloperStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to get all developers (for admin)
export function useDevelopers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDevelopers = useCallback(async () => {
    try {
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

    // Set up real-time subscription
    const channel = supabase
      .channel('all_developers_changes')
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

  return { developers, isLoading };
}

// Re-export types for convenience
export type { Developer, DeveloperStatus };
