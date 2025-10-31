import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export const createBrowserClient = () => {
  return createClientComponentClient()
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Database = {
  public: {
    Tables: {
      geo_locations: {
        Row: {
          id: string
          city: string
          state: string
          state_code: string
          county: string | null
          population: number | null
          median_income: number | null
          latitude: number | null
          longitude: number | null
          search_volume: number
          competition_score: number
          priority_score: number
          posts_published_count: number
          last_published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['geo_locations']['Row'], 'id' | 'created_at' | 'updated_at' | 'priority_score'>
        Update: Partial<Database['public']['Tables']['geo_locations']['Insert']>
      }
      posts: {
        Row: {
          id: string
          geo_location_id: string
          template_id: string | null
          title: string
          slug: string
          meta_description: string | null
          content_html: string | null
          excerpt: string | null
          faq_json: any
          schema_json: any
          internal_links_json: any
          research_data_json: any
          price_data_json: any
          permit_data_json: any
          last_data_update: string | null
          wordpress_post_id: number | null
          wordpress_url: string | null
          status: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'needs_update'
          scheduled_date: string | null
          published_at: string | null
          word_count: number | null
          ai_humanized: boolean
          has_video: boolean
          has_calculator: boolean
          quality_score: number | null
          created_by: string | null
          reviewed_by: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      content_templates: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          template_html: string
          faq_template_json: any
          schema_template_json: any
          target_word_count: number
          required_sections: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
    }
  }
}