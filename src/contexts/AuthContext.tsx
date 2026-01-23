import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface DeveloperProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  developerType: 'individual' | 'company';
  developerName: string;
  country: string;
  phone: string;
  website?: string;
  bio?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  developerProfile: DeveloperProfile | null;
  isDeveloperApproved: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  registerDeveloper: (data: Omit<DeveloperProfile, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDeveloperStatus: (developerId: string, status: 'approved' | 'rejected', reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data storage (simulates backend)
const STORAGE_KEY = 'zenova_auth';
const DEVELOPERS_KEY = 'zenova_developers';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [developerProfile, setDeveloperProfile] = useState<DeveloperProfile | null>(null);
  const [allDevelopers, setAllDevelopers] = useState<DeveloperProfile[]>([]);

  // Initialize auth state from storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedDevelopers = localStorage.getItem(DEVELOPERS_KEY);
    
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed.user);
    }
    
    if (storedDevelopers) {
      const developers = JSON.parse(storedDevelopers);
      setAllDevelopers(developers);
    }
    
    setIsLoading(false);
  }, []);

  // Update developer profile when user or developers change
  useEffect(() => {
    if (user && allDevelopers.length > 0) {
      const profile = allDevelopers.find(d => d.userId === user.id);
      setDeveloperProfile(profile || null);
    } else {
      setDeveloperProfile(null);
    }
  }, [user, allDevelopers]);

  // Persist developers to storage
  useEffect(() => {
    if (allDevelopers.length > 0) {
      localStorage.setItem(DEVELOPERS_KEY, JSON.stringify(allDevelopers));
    }
  }, [allDevelopers]);

  const isAdmin = user?.email === 'admin@zenova.com';
  const isDeveloperApproved = developerProfile?.status === 'approved';

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser: User = {
      id: email === 'admin@zenova.com' ? 'admin-001' : `user-${Date.now()}`,
      email,
      name: email === 'admin@zenova.com' ? 'Admin' : email.split('@')[0],
      avatar: undefined,
    };
    
    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: mockUser }));
    setIsLoading(false);
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      avatar: undefined,
    };
    
    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: mockUser }));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setDeveloperProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const registerDeveloper = async (data: Omit<DeveloperProfile, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Must be logged in');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newProfile: DeveloperProfile = {
      ...data,
      id: `dev-${Date.now()}`,
      userId: user.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setAllDevelopers(prev => [...prev, newProfile]);
    setDeveloperProfile(newProfile);
  };

  const updateDeveloperStatus = (developerId: string, status: 'approved' | 'rejected', reason?: string) => {
    setAllDevelopers(prev => 
      prev.map(dev => 
        dev.id === developerId 
          ? { 
              ...dev, 
              status, 
              rejectionReason: reason,
              updatedAt: new Date().toISOString() 
            } 
          : dev
      )
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        developerProfile,
        isDeveloperApproved,
        login,
        register,
        logout,
        registerDeveloper,
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
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  
  useEffect(() => {
    const stored = localStorage.getItem(DEVELOPERS_KEY);
    if (stored) {
      setDevelopers(JSON.parse(stored));
    }
    
    // Listen for storage changes
    const handleStorage = () => {
      const stored = localStorage.getItem(DEVELOPERS_KEY);
      if (stored) {
        setDevelopers(JSON.parse(stored));
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    // Also poll for changes (for same-tab updates)
    const interval = setInterval(() => {
      const stored = localStorage.getItem(DEVELOPERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDevelopers(parsed);
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);
  
  return developers;
}
