export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DeveloperStatus = 'pending' | 'approved' | 'rejected';
export type DeveloperType = 'individual' | 'company';
export type AppStatus = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      developers: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          developer_type: DeveloperType
          developer_name: string
          country: string
          phone: string
          website: string | null
          bio: string | null
          status: DeveloperStatus
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['developers']['Row']> & {
          user_id: string
          full_name: string
          email: string
          developer_type: DeveloperType
          developer_name: string
          country: string
          phone: string
        }
        Update: Partial<Database['public']['Tables']['developers']['Row']>
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string
          description: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & {
          name: string
          icon: string
          description: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Row']>
        Relationships: []
      }
      apps: {
        Row: {
          id: string
          developer_id: string
          name: string
          description: string
          short_description: string
          icon_url: string | null
          screenshots: string[]
          category_id: string
          version: string
          size: string
          downloads: number
          rating: number
          review_count: number
          status: AppStatus
          featured: boolean
          trending: boolean
          is_paid: boolean
          price: number | null
          apk_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['apps']['Row']> & {
          developer_id: string
          name: string
          description: string
          short_description: string
          category_id: string
          version: string
          size: string
        }
        Update: Partial<Database['public']['Tables']['apps']['Row']>
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          app_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['reviews']['Row']> & {
          app_id: string
          user_id: string
          rating: number
        }
        Update: Partial<Database['public']['Tables']['reviews']['Row']>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      developer_status: DeveloperStatus
      developer_type: DeveloperType
      app_status: AppStatus
    }
  }
}

// Convenience types
export type Developer = Database['public']['Tables']['developers']['Row'];
export type DeveloperInsert = Database['public']['Tables']['developers']['Insert'];
export type DeveloperUpdate = Database['public']['Tables']['developers']['Update'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];

export type App = Database['public']['Tables']['apps']['Row'];
export type AppInsert = Database['public']['Tables']['apps']['Insert'];
export type AppUpdate = Database['public']['Tables']['apps']['Update'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
