export type ICourse = {
  name?: string
  description?: string | object
  objectives?: string | object
  instructor_uuid?: string
  instructor?: string
  is_free?: boolean
  price?: number
  sale_price?: number
  currency: string
  categories?: string[]
  category_uuids?: string[]
  difficulty: string
  difficulty_uuid?: string
  class_limit?: number
  classLimit?: number
  prerequisites?: string | null
  duration_hours?: number
  duration_minutes?: number
  age_lower_limit?: number
  age_upper_limit?: number
  thumbnail_url?: string
  intro_video_url?: string
  banner_url?: string
  status?: string
  active?: boolean
  created_date?: string
  created_by?: string
  updated_date?: string
  updated_by?: string
  is_published?: boolean
  total_duration_display?: string
  is_draft?: boolean
}
