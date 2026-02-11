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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      intake_submissions: {
        Row: {
          budget: string
          business_type: string
          created_at: string
          description: string
          generated_team: Json | null
          id: string
          industry: string
          project_stage: string
          session_id: string
          timeline: string
          user_id: string | null
        }
        Insert: {
          budget: string
          business_type: string
          created_at?: string
          description: string
          generated_team?: Json | null
          id?: string
          industry: string
          project_stage: string
          session_id: string
          timeline: string
          user_id?: string | null
        }
        Update: {
          budget?: string
          business_type?: string
          created_at?: string
          description?: string
          generated_team?: Json | null
          id?: string
          industry?: string
          project_stage?: string
          session_id?: string
          timeline?: string
          user_id?: string | null
        }
        Relationships: []
      }
      professional_applications: {
        Row: {
          ai_flagged_as_fake: boolean | null
          ai_vetted_at: string | null
          ai_vetting_notes: string | null
          ai_vetting_score: number | null
          ai_vetting_status: string | null
          availability: string
          created_at: string
          email: string
          experience: string
          id: string
          industry: string
          linkedin: string | null
          name: string
          portfolio: string | null
          rate_range: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: string
          status: string
          summary: string
          updated_at: string
        }
        Insert: {
          ai_flagged_as_fake?: boolean | null
          ai_vetted_at?: string | null
          ai_vetting_notes?: string | null
          ai_vetting_score?: number | null
          ai_vetting_status?: string | null
          availability: string
          created_at?: string
          email: string
          experience: string
          id?: string
          industry: string
          linkedin?: string | null
          name: string
          portfolio?: string | null
          rate_range: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role: string
          status?: string
          summary: string
          updated_at?: string
        }
        Update: {
          ai_flagged_as_fake?: boolean | null
          ai_vetted_at?: string | null
          ai_vetting_notes?: string | null
          ai_vetting_score?: number | null
          ai_vetting_status?: string | null
          availability?: string
          created_at?: string
          email?: string
          experience?: string
          id?: string
          industry?: string
          linkedin?: string | null
          name?: string
          portfolio?: string | null
          rate_range?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string
          status?: string
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      professional_matches: {
        Row: {
          created_at: string
          id: string
          notification_sent: boolean
          notification_sent_at: string | null
          professional_id: string
          professional_responded: boolean | null
          purchased_team_id: string
          role_matched: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_sent?: boolean
          notification_sent_at?: string | null
          professional_id: string
          professional_responded?: boolean | null
          purchased_team_id: string
          role_matched: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_sent?: boolean
          notification_sent_at?: string | null
          professional_id?: string
          professional_responded?: boolean | null
          purchased_team_id?: string
          role_matched?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_matches_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_matches_purchased_team_id_fkey"
            columns: ["purchased_team_id"]
            isOneToOne: false
            referencedRelation: "purchased_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          application_id: string | null
          availability: string
          created_at: string
          email: string
          experience: string
          id: string
          industry: string
          is_available: boolean
          linkedin: string | null
          name: string
          phone: string | null
          portfolio: string | null
          rate_range: string
          role: string
          summary: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          availability: string
          created_at?: string
          email: string
          experience: string
          id?: string
          industry: string
          is_available?: boolean
          linkedin?: string | null
          name: string
          phone?: string | null
          portfolio?: string | null
          rate_range: string
          role: string
          summary: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          availability?: string
          created_at?: string
          email?: string
          experience?: string
          id?: string
          industry?: string
          is_available?: boolean
          linkedin?: string | null
          name?: string
          phone?: string | null
          portfolio?: string | null
          rate_range?: string
          role?: string
          summary?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "professional_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchased_teams: {
        Row: {
          created_at: string
          customer_email: string
          id: string
          matched_status: string | null
          professionals: Json
          stripe_session_id: string
          team_data: Json
          team_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          id?: string
          matched_status?: string | null
          professionals: Json
          stripe_session_id: string
          team_data: Json
          team_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          id?: string
          matched_status?: string | null
          professionals?: Json
          stripe_session_id?: string
          team_data?: Json
          team_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
