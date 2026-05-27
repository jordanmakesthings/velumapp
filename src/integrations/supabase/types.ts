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
      course_journal_entries: {
        Row: {
          content: string
          course_id: string
          created_at: string
          day_number: number
          id: string
          lesson_id: string
          prompt: string | null
          user_id: string
        }
        Insert: {
          content?: string
          course_id: string
          created_at?: string
          day_number?: number
          id?: string
          lesson_id: string
          prompt?: string | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          day_number?: number
          id?: string
          lesson_id?: string
          prompt?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_journal_entries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_journal_entries_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
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
          is_free: boolean
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
          is_free?: boolean
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
          is_free?: boolean
          is_premium?: boolean
          is_published?: boolean
          modules?: Json | null
          order_index?: number
          title?: string
        }
        Relationships: []
      }
      custom_track_listens: {
        Row: {
          created_at: string
          duration_listened_sec: number
          id: string
          listened_date: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_listened_sec?: number
          id?: string
          listened_date?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_listened_sec?: number
          id?: string
          listened_date?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_track_listens_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "custom_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_tracks: {
        Row: {
          audio_url: string
          created_at: string | null
          duration_sec: number | null
          id: string
          issue_summary: string | null
          metaphor_family: string | null
          modality: string | null
          play_count: number | null
          script_text: string | null
          title: string
          user_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          issue_summary?: string | null
          metaphor_family?: string | null
          modality?: string | null
          play_count?: number | null
          script_text?: string | null
          title: string
          user_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          issue_summary?: string | null
          metaphor_family?: string | null
          modality?: string | null
          play_count?: number | null
          script_text?: string | null
          title?: string
          user_id?: string
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      goals: {
        Row: {
          cover: string | null
          created_at: string
          id: string
          label: string
          order_index: number
          short: string
          slug: string
        }
        Insert: {
          cover?: string | null
          created_at?: string
          id?: string
          label: string
          order_index?: number
          short: string
          slug: string
        }
        Update: {
          cover?: string | null
          created_at?: string
          id?: string
          label?: string
          order_index?: number
          short?: string
          slug?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          step_number: number
          track_id: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          step_number: number
          track_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          step_number?: number
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_track_id_fkey"
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
          drip_day_offset: number | null
          duration_minutes: number
          id: string
          is_free: boolean
          is_free_preview: boolean
          journal_prompt: string | null
          media_url: string | null
          order_index: number
          thumbnail_square_url: string | null
          thumbnail_url: string | null
          title: string
          written_content: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          downloadable_files?: Json | null
          drip_day_offset?: number | null
          duration_minutes?: number
          id?: string
          is_free?: boolean
          is_free_preview?: boolean
          journal_prompt?: string | null
          media_url?: string | null
          order_index?: number
          thumbnail_square_url?: string | null
          thumbnail_url?: string | null
          title: string
          written_content?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          downloadable_files?: Json | null
          drip_day_offset?: number | null
          duration_minutes?: number
          id?: string
          is_free?: boolean
          is_free_preview?: boolean
          journal_prompt?: string | null
          media_url?: string | null
          order_index?: number
          thumbnail_square_url?: string | null
          thumbnail_url?: string | null
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
          cover_image_url_16_9: string | null
          created_at: string
          description: string | null
          downloadable_files: Json | null
          duration_minutes: number
          id: string
          is_free: boolean
          is_premium: boolean
          order_index: number
          pause_prompts: Json | null
          player_image_url_1_1: string | null
          theme: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          audio_url?: string | null
          cover_image_url?: string | null
          cover_image_url_16_9?: string | null
          created_at?: string
          description?: string | null
          downloadable_files?: Json | null
          duration_minutes?: number
          id?: string
          is_free?: boolean
          is_premium?: boolean
          order_index?: number
          pause_prompts?: Json | null
          player_image_url_1_1?: string | null
          theme?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          audio_url?: string | null
          cover_image_url?: string | null
          cover_image_url_16_9?: string | null
          created_at?: string
          description?: string | null
          downloadable_files?: Json | null
          duration_minutes?: number
          id?: string
          is_free?: boolean
          is_premium?: boolean
          order_index?: number
          pause_prompts?: Json | null
          player_image_url_1_1?: string | null
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
          extra_track_credits: number
          full_name: string | null
          id: string
          is_admin: boolean | null
          landing_page: string | null
          onboarding_answers: Json | null
          onboarding_completed: boolean
          onesignal_player_id: string | null
          phone: string | null
          referral_code: string | null
          referral_credit_months: number
          referred_by: string | null
          referrer: string | null
          reminder_time: string | null
          stripe_customer_id: string | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          tapping_daily_count: number | null
          tapping_daily_date: string | null
          terms_accepted_at: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          unlimited_tracks: boolean
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          voice_preference: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          extra_track_credits?: number
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          landing_page?: string | null
          onboarding_answers?: Json | null
          onboarding_completed?: boolean
          onesignal_player_id?: string | null
          phone?: string | null
          referral_code?: string | null
          referral_credit_months?: number
          referred_by?: string | null
          referrer?: string | null
          reminder_time?: string | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          tapping_daily_count?: number | null
          tapping_daily_date?: string | null
          terms_accepted_at?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          unlimited_tracks?: boolean
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          voice_preference?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          extra_track_credits?: number
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          landing_page?: string | null
          onboarding_answers?: Json | null
          onboarding_completed?: boolean
          onesignal_player_id?: string | null
          phone?: string | null
          referral_code?: string | null
          referral_credit_months?: number
          referred_by?: string | null
          referrer?: string | null
          reminder_time?: string | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          tapping_daily_count?: number | null
          tapping_daily_date?: string | null
          terms_accepted_at?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          unlimited_tracks?: boolean
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          voice_preference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          credited_at: string | null
          id: string
          referred_id: string
          referrer_id: string
          status: string
          subscribed_at: string | null
        }
        Insert: {
          created_at?: string
          credited_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          status?: string
          subscribed_at?: string | null
        }
        Update: {
          created_at?: string
          credited_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
          subscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          order_index: number
          thumbnail_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          order_index?: number
          thumbnail_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tapping_sessions: {
        Row: {
          aspects: string | null
          body_location: string | null
          completed: boolean
          created_at: string
          duration_seconds: number | null
          final_suds: number | null
          id: string
          initial_suds: number
          is_free: boolean
          issue: string
          path: string
          positive_belief: string | null
          resistance_final: number | null
          resistance_initial: number | null
          suds_journey: Json | null
          user_id: string
        }
        Insert: {
          aspects?: string | null
          body_location?: string | null
          completed?: boolean
          created_at?: string
          duration_seconds?: number | null
          final_suds?: number | null
          id?: string
          initial_suds: number
          is_free?: boolean
          issue: string
          path: string
          positive_belief?: string | null
          resistance_final?: number | null
          resistance_initial?: number | null
          suds_journey?: Json | null
          user_id: string
        }
        Update: {
          aspects?: string | null
          body_location?: string | null
          completed?: boolean
          created_at?: string
          duration_seconds?: number | null
          final_suds?: number | null
          id?: string
          initial_suds?: number
          is_free?: boolean
          issue?: string
          path?: string
          positive_belief?: string | null
          resistance_final?: number | null
          resistance_initial?: number | null
          suds_journey?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      track_covers: {
        Row: {
          collection_palette: string | null
          created_at: string
          id: string
          mood: string | null
          name: string
          tags: string[]
          url: string
        }
        Insert: {
          collection_palette?: string | null
          created_at?: string
          id?: string
          mood?: string | null
          name: string
          tags?: string[]
          url: string
        }
        Update: {
          collection_palette?: string | null
          created_at?: string
          id?: string
          mood?: string | null
          name?: string
          tags?: string[]
          url?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          audio_url: string | null
          category: string
          content_type: string
          course_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          goals: string[]
          id: string
          is_featured: boolean
          is_free: boolean
          is_premium: boolean
          lock_days: number
          lock_type: string
          order_in_course: number
          order_index: number
          steps: Json | null
          subcategory_id: string | null
          tags: Json | null
          thumbnail_square_url: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          audio_url?: string | null
          category: string
          content_type?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          goals?: string[]
          id?: string
          is_featured?: boolean
          is_free?: boolean
          is_premium?: boolean
          lock_days?: number
          lock_type?: string
          order_in_course?: number
          order_index?: number
          steps?: Json | null
          subcategory_id?: string | null
          tags?: Json | null
          thumbnail_square_url?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          audio_url?: string | null
          category?: string
          content_type?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          goals?: string[]
          id?: string
          is_featured?: boolean
          is_free?: boolean
          is_premium?: boolean
          lock_days?: number
          lock_type?: string
          order_in_course?: number
          order_index?: number
          steps?: Json | null
          subcategory_id?: string | null
          tags?: Json | null
          thumbnail_square_url?: string | null
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
      attribute_referral: {
        Args: { p_referral_code: string }
        Returns: undefined
      }
      decrement_extra_track_credits: { Args: { uid: string }; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      founding_lifetime_remaining: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_extra_track_credits: {
        Args: { add?: number; uid: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      pick_cover_by_tags: { Args: { p_tags: string[] }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      record_track_listen: {
        Args: { p_seconds: number; p_track_id: string }
        Returns: number
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
