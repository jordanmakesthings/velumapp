export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          value?: Json
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          estimated_weeks: number | null
          id: string
          is_premium: boolean
          order_index: number
          tags: Json | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          estimated_weeks?: number | null
          id?: string
          is_premium?: boolean
          order_index?: number
          tags?: Json | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          estimated_weeks?: number | null
          id?: string
          is_premium?: boolean
          order_index?: number
          tags?: Json | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      courses_v2: {
        Row: {
          course_type: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_premium: boolean
          is_published: boolean
          modules: Json | null
          order_index: number
          title: string
        }
        Insert: {
          course_type?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          is_published?: boolean
          modules?: Json | null
          order_index?: number
          title: string
        }
        Update: {
          course_type?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          is_published?: boolean
          modules?: Json | null
          order_index?: number
          title?: string
        }
        Relationships: []
      }
      daily_reflections: {
        Row: {
          content: string
          created_at: string
          id: string
          prompt: string | null
          reflection_date: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          prompt?: string | null
          reflection_date?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          prompt?: string | null
          reflection_date?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      journaling_prompts: {
        Row: {
          category: string | null
          id: string
          order_index: number
          prompt: string
        }
        Insert: {
          category?: string | null
          id?: string
          order_index?: number
          prompt: string
        }
        Update: {
          category?: string | null
          id?: string
          order_index?: number
          prompt?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_date: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_date?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_date?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          downloadable_files: Json | null
          duration_minutes: number
          id: string
          is_free_preview: boolean
          media_url: string | null
          order_index: number
          title: string
          written_content: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          downloadable_files?: Json | null
          duration_minutes?: number
          id?: string
          is_free_preview?: boolean
          media_url?: string | null
          order_index?: number
          title: string
          written_content?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          downloadable_files?: Json | null
          duration_minutes?: number
          id?: string
          is_free_preview?: boolean
          media_url?: string | null
          order_index?: number
          title?: string
          written_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      mastery_class_responses: {
        Row: {
          created_at: string
          date: string
          id: string
          mastery_class_id: string
          mastery_class_theme: string | null
          mastery_class_title: string | null
          responses: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mastery_class_id: string
          mastery_class_theme?: string | null
          mastery_class_title?: string | null
          responses?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mastery_class_id?: string
          mastery_class_theme?: string | null
          mastery_class_title?: string | null
          responses?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mastery_class_responses_mastery_class_id_fkey"
            columns: ["mastery_class_id"]
            isOneToOne: false
            referencedRelation: "mastery_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      mastery_classes: {
        Row: {
          audio_url: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_premium: boolean
          order_index: number
          pause_prompts: Json | null
          theme: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          audio_url?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_premium?: boolean
          order_index?: number
          pause_prompts?: Json | null
          theme?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          audio_url?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_premium?: boolean
          order_index?: number
          pause_prompts?: Json | null
          theme?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_answers: Json | null
          onboarding_completed: boolean
          stripe_customer_id: string | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_answers?: Json | null
          onboarding_completed?: boolean
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_answers?: Json | null
          onboarding_completed?: boolean
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          audio_url: string | null
          category: string
          course_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_featured: boolean
          is_premium: boolean
          lock_days: number
          lock_type: string
          order_in_course: number
          order_index: number
          subcategory_id: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          audio_url?: string | null
          category: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_featured?: boolean
          is_premium?: boolean
          lock_days?: number
          lock_type?: string
          order_in_course?: number
          order_index?: number
          subcategory_id?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          audio_url?: string | null
          category?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_featured?: boolean
          is_premium?: boolean
          lock_days?: number
          lock_type?: string
          order_in_course?: number
          order_index?: number
          subcategory_id?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tracks_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed: boolean
          completed_date: string | null
          created_at: string
          id: string
          progress_seconds: number
          stress_after: number | null
          stress_before: number | null
          track_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_date?: string | null
          created_at?: string
          id?: string
          progress_seconds?: number
          stress_after?: number | null
          stress_before?: number | null
          track_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_date?: string | null
          created_at?: string
          id?: string
          progress_seconds?: number
          stress_after?: number | null
          stress_before?: number | null
          track_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
