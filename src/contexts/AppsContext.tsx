import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface App {
  id: string;
  developerId: string;
  developerName: string;
  name: string;
  description: string;
  shortDescription: string;
  icon: string;
  screenshots: string[];
  category: string;
  version: string;
  size: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  trending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  appCount: number;
}

interface AppsContextType {
  apps: App[];
  categories: Category[];
  featuredApps: App[];
  trendingApps: App[];
  getAppsByCategory: (categoryId: string) => App[];
  getAppsByDeveloper: (developerId: string) => App[];
  getAppById: (appId: string) => App | undefined;
  searchApps: (query: string) => App[];
  updateAppStatus: (appId: string, status: 'approved' | 'rejected') => void;
  addApp: (app: Omit<App, 'id' | 'createdAt' | 'updatedAt' | 'downloads' | 'rating' | 'reviewCount' | 'status'>) => void;
}

const AppsContext = createContext<AppsContextType | undefined>(undefined);

const APPS_KEY = 'zenova_apps';

// Default categories
const defaultCategories: Category[] = [
  { id: 'games', name: 'Games', icon: '🎮', description: 'Play the best mobile games', appCount: 0 },
  { id: 'social', name: 'Social', icon: '💬', description: 'Connect with friends', appCount: 0 },
  { id: 'productivity', name: 'Productivity', icon: '📊', description: 'Get things done', appCount: 0 },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', description: 'Movies, music & more', appCount: 0 },
  { id: 'education', name: 'Education', icon: '📚', description: 'Learn something new', appCount: 0 },
  { id: 'finance', name: 'Finance', icon: '💰', description: 'Manage your money', appCount: 0 },
  { id: 'health', name: 'Health & Fitness', icon: '💪', description: 'Stay healthy', appCount: 0 },
  { id: 'tools', name: 'Tools', icon: '🔧', description: 'Useful utilities', appCount: 0 },
];

// Default mock apps
const defaultApps: App[] = [
  {
    id: 'app-1',
    developerId: 'dev-mock-1',
    developerName: 'Zenova Games',
    name: 'Cosmic Runner',
    description: 'Race through the cosmos in this stunning endless runner. Dodge asteroids, collect power-ups, and unlock new characters.',
    shortDescription: 'Endless space runner game',
    icon: '🚀',
    screenshots: [],
    category: 'games',
    version: '2.1.0',
    size: '145 MB',
    downloads: 1250000,
    rating: 4.8,
    reviewCount: 45000,
    status: 'approved',
    featured: true,
    trending: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: 'app-2',
    developerId: 'dev-mock-2',
    developerName: 'Social Connect Inc',
    name: 'ChatFlow',
    description: 'The next generation messaging app with end-to-end encryption and beautiful design.',
    shortDescription: 'Secure messaging app',
    icon: '💬',
    screenshots: [],
    category: 'social',
    version: '3.5.2',
    size: '89 MB',
    downloads: 5000000,
    rating: 4.6,
    reviewCount: 120000,
    status: 'approved',
    featured: true,
    trending: false,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
  },
  {
    id: 'app-3',
    developerId: 'dev-mock-3',
    developerName: 'TaskMaster Studios',
    name: 'FocusFlow',
    description: 'Boost your productivity with smart task management and pomodoro timer.',
    shortDescription: 'Productivity & focus app',
    icon: '⚡',
    screenshots: [],
    category: 'productivity',
    version: '1.8.0',
    size: '32 MB',
    downloads: 890000,
    rating: 4.9,
    reviewCount: 28000,
    status: 'approved',
    featured: false,
    trending: true,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12',
  },
  {
    id: 'app-4',
    developerId: 'dev-mock-4',
    developerName: 'FinTech Pro',
    name: 'WealthTracker',
    description: 'Track your investments, expenses, and budget all in one place.',
    shortDescription: 'Financial tracking app',
    icon: '💎',
    screenshots: [],
    category: 'finance',
    version: '2.3.1',
    size: '56 MB',
    downloads: 450000,
    rating: 4.7,
    reviewCount: 15000,
    status: 'approved',
    featured: false,
    trending: true,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-16',
  },
  {
    id: 'app-5',
    developerId: 'dev-mock-5',
    developerName: 'LearnNow Education',
    name: 'BrainBoost',
    description: 'Learn anything with AI-powered personalized lessons and quizzes.',
    shortDescription: 'AI learning platform',
    icon: '🧠',
    screenshots: [],
    category: 'education',
    version: '4.0.0',
    size: '78 MB',
    downloads: 2100000,
    rating: 4.8,
    reviewCount: 67000,
    status: 'approved',
    featured: true,
    trending: false,
    createdAt: '2024-01-02',
    updatedAt: '2024-01-14',
  },
  {
    id: 'app-6',
    developerId: 'dev-mock-6',
    developerName: 'Stream Studios',
    name: 'StreamHub',
    description: 'Watch live streams, movies, and exclusive content.',
    shortDescription: 'Entertainment streaming',
    icon: '🎬',
    screenshots: [],
    category: 'entertainment',
    version: '5.2.0',
    size: '124 MB',
    downloads: 8500000,
    rating: 4.5,
    reviewCount: 230000,
    status: 'approved',
    featured: false,
    trending: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10',
  },
];

export function AppsProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<App[]>([]);
  const [categories] = useState<Category[]>(defaultCategories);

  // Initialize apps from storage
  useEffect(() => {
    const stored = localStorage.getItem(APPS_KEY);
    if (stored) {
      setApps(JSON.parse(stored));
    } else {
      setApps(defaultApps);
      localStorage.setItem(APPS_KEY, JSON.stringify(defaultApps));
    }
  }, []);

  // Persist apps to storage
  useEffect(() => {
    if (apps.length > 0) {
      localStorage.setItem(APPS_KEY, JSON.stringify(apps));
    }
  }, [apps]);

  const approvedApps = apps.filter(app => app.status === 'approved');
  const featuredApps = approvedApps.filter(app => app.featured);
  const trendingApps = approvedApps.filter(app => app.trending);

  const getAppsByCategory = (categoryId: string) => 
    approvedApps.filter(app => app.category === categoryId);

  const getAppsByDeveloper = (developerId: string) => 
    apps.filter(app => app.developerId === developerId);

  const getAppById = (appId: string) => 
    apps.find(app => app.id === appId);

  const searchApps = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return approvedApps.filter(app => 
      app.name.toLowerCase().includes(lowerQuery) ||
      app.description.toLowerCase().includes(lowerQuery) ||
      app.category.toLowerCase().includes(lowerQuery)
    );
  };

  const updateAppStatus = (appId: string, status: 'approved' | 'rejected') => {
    setApps(prev => 
      prev.map(app => 
        app.id === appId 
          ? { ...app, status, updatedAt: new Date().toISOString() } 
          : app
      )
    );
  };

  const addApp = (appData: Omit<App, 'id' | 'createdAt' | 'updatedAt' | 'downloads' | 'rating' | 'reviewCount' | 'status'>) => {
    const newApp: App = {
      ...appData,
      id: `app-${Date.now()}`,
      status: 'pending',
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setApps(prev => [...prev, newApp]);
  };

  return (
    <AppsContext.Provider
      value={{
        apps,
        categories,
        featuredApps,
        trendingApps,
        getAppsByCategory,
        getAppsByDeveloper,
        getAppById,
        searchApps,
        updateAppStatus,
        addApp,
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
