import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const SUPABASE_URL = 'https://xyotguuokzccdzxpzgru.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5b3RndXVva3pjY2R6eHB6Z3J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzQ1MTYsImV4cCI6MjA3OTYxMDUxNn0.zlw6x27IKkTmrxuxJLiR_r6IJDvOnwDWn_2H0_eOQ8o';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Admin email constant
export const ADMIN_EMAIL = 'navedahmad9012@gmail.com';

// Helper to check if user is admin
export const isAdminEmail = (email: string | undefined | null): boolean => {
  return email === ADMIN_EMAIL;
};

// Storage bucket names
export const STORAGE_BUCKETS = {
  APP_ICONS: 'app-icons',
  APP_SCREENSHOTS: 'app-screenshots',
  APP_FILES: 'app-files',
} as const;

// Helper function to get public URL for a storage file
export const getStorageUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
