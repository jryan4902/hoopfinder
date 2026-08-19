// GENERATED FILE — do not edit by hand.
//
// Regenerate after every migration:
//   SUPABASE_PROJECT_ID=<your-project-ref> npm run db:types
//
// (or, against a local stack: supabase gen types typescript --local --schema public)
//
// App-facing aliases live in src/types/models.ts so that regenerating this file
// never clobbers them.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      checkins: {
        Row: {
          court_id: string
          created_at: string
          device_id: string
          headcount: number
          id: string
          run_type: Database['public']['Enums']['run_type']
        }
        Insert: {
          court_id: string
          created_at?: string
          device_id: string
          headcount: number
          id?: string
          run_type: Database['public']['Enums']['run_type']
        }
        Update: {
          court_id?: string
          created_at?: string
          device_id?: string
          headcount?: number
          id?: string
          run_type?: Database['public']['Enums']['run_type']
        }
        Relationships: [
          {
            foreignKeyName: 'checkins_court_id_fkey'
            columns: ['court_id']
            isOneToOne: false
            referencedRelation: 'courts'
            referencedColumns: ['id']
          },
        ]
      }
      court_ratings: {
        Row: {
          court_id: string
          created_at: string
          device_id: string
          id: string
          stars: number
        }
        Insert: {
          court_id: string
          created_at?: string
          device_id: string
          id?: string
          stars: number
        }
        Update: {
          court_id?: string
          created_at?: string
          device_id?: string
          id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: 'court_ratings_court_id_fkey'
            columns: ['court_id']
            isOneToOne: false
            referencedRelation: 'courts'
            referencedColumns: ['id']
          },
        ]
      }
      courts: {
        Row: {
          area: string
          cost: string
          created_at: string
          full_courts: number
          hours: string
          id: string
          kind: Database['public']['Enums']['court_kind']
          lat: number
          lights: boolean
          lng: number
          name: string
          nets: string
          parking: string
          surface: string
        }
        Insert: {
          area: string
          cost: string
          created_at?: string
          full_courts: number
          hours: string
          id: string
          kind: Database['public']['Enums']['court_kind']
          lat: number
          lights?: boolean
          lng: number
          name: string
          nets: string
          parking: string
          surface: string
        }
        Update: {
          area?: string
          cost?: string
          created_at?: string
          full_courts?: number
          hours?: string
          id?: string
          kind?: Database['public']['Enums']['court_kind']
          lat?: number
          lights?: boolean
          lng?: number
          name?: string
          nets?: string
          parking?: string
          surface?: string
        }
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
      court_kind: 'outdoor' | 'indoor'
      run_type: 'shooting' | 'small' | 'full'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']

export type Enums<T extends keyof PublicSchema['Enums']> =
  PublicSchema['Enums'][T]

export const Constants = {
  public: {
    Enums: {
      court_kind: ['outdoor', 'indoor'],
      run_type: ['shooting', 'small', 'full'],
    },
  },
} as const
