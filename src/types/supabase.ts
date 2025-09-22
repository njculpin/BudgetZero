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
      contributors: {
        Row: {
          application_message: string | null
          compensation_details: string
          compensation_type: Database["public"]["Enums"]["compensation_type"]
          created_at: string | null
          id: string
          milestone_id: string | null
          portfolio_links: string[] | null
          project_id: string
          role: Database["public"]["Enums"]["contributor_role"]
          status: Database["public"]["Enums"]["contributor_status"] | null
          user_id: string
        }
        Insert: {
          application_message?: string | null
          compensation_details: string
          compensation_type: Database["public"]["Enums"]["compensation_type"]
          created_at?: string | null
          id?: string
          milestone_id?: string | null
          portfolio_links?: string[] | null
          project_id: string
          role: Database["public"]["Enums"]["contributor_role"]
          status?: Database["public"]["Enums"]["contributor_status"] | null
          user_id: string
        }
        Update: {
          application_message?: string | null
          compensation_details?: string
          compensation_type?: Database["public"]["Enums"]["compensation_type"]
          created_at?: string | null
          id?: string
          milestone_id?: string | null
          portfolio_links?: string[] | null
          project_id?: string
          role?: Database["public"]["Enums"]["contributor_role"]
          status?: Database["public"]["Enums"]["contributor_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributors_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "game_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      game_assets: {
        Row: {
          contributor_id: string
          created_at: string | null
          file_size: number
          file_url: string
          id: string
          name: string
          project_id: string
          status: Database["public"]["Enums"]["asset_status"] | null
          type: Database["public"]["Enums"]["asset_type"]
          version: number | null
        }
        Insert: {
          contributor_id: string
          created_at?: string | null
          file_size: number
          file_url: string
          id?: string
          name: string
          project_id: string
          status?: Database["public"]["Enums"]["asset_status"] | null
          type: Database["public"]["Enums"]["asset_type"]
          version?: number | null
        }
        Update: {
          contributor_id?: string
          created_at?: string | null
          file_size?: number
          file_url?: string
          id?: string
          name?: string
          project_id?: string
          status?: Database["public"]["Enums"]["asset_status"] | null
          type?: Database["public"]["Enums"]["asset_type"]
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_assets_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "contributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "game_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      game_projects: {
        Row: {
          category: Database["public"]["Enums"]["project_category"]
          concept_art_url: string | null
          created_at: string | null
          creator_id: string
          description: string
          estimated_players: string
          estimated_playtime: string
          id: string
          name: string
          status: Database["public"]["Enums"]["project_status"] | null
          target_audience: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["project_category"]
          concept_art_url?: string | null
          created_at?: string | null
          creator_id: string
          description: string
          estimated_players: string
          estimated_playtime: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["project_status"] | null
          target_audience: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["project_category"]
          concept_art_url?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string
          estimated_players?: string
          estimated_playtime?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          target_audience?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string | null
          current_funding: number | null
          deadline: string | null
          deliverables: string[] | null
          description: string
          funding_goal: number | null
          id: string
          name: string
          project_id: string
          required_skills: string[] | null
          status: Database["public"]["Enums"]["milestone_status"] | null
          timeline_weeks: number
        }
        Insert: {
          created_at?: string | null
          current_funding?: number | null
          deadline?: string | null
          deliverables?: string[] | null
          description: string
          funding_goal?: number | null
          id?: string
          name: string
          project_id: string
          required_skills?: string[] | null
          status?: Database["public"]["Enums"]["milestone_status"] | null
          timeline_weeks: number
        }
        Update: {
          created_at?: string | null
          current_funding?: number | null
          deadline?: string | null
          deliverables?: string[] | null
          description?: string
          funding_goal?: number | null
          id?: string
          name?: string
          project_id?: string
          required_skills?: string[] | null
          status?: Database["public"]["Enums"]["milestone_status"] | null
          timeline_weeks?: number
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "game_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rulebook_versions: {
        Row: {
          change_summary: string | null
          content: string
          created_at: string | null
          edited_by: string
          id: string
          rulebook_id: string
          version: number
        }
        Insert: {
          change_summary?: string | null
          content: string
          created_at?: string | null
          edited_by: string
          id?: string
          rulebook_id: string
          version: number
        }
        Update: {
          change_summary?: string | null
          content?: string
          created_at?: string | null
          edited_by?: string
          id?: string
          rulebook_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "rulebook_versions_rulebook_id_fkey"
            columns: ["rulebook_id"]
            isOneToOne: false
            referencedRelation: "rulebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      rulebooks: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          last_edited_by: string
          project_id: string
          template_id: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          last_edited_by: string
          project_id: string
          template_id?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          last_edited_by?: string
          project_id?: string
          template_id?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rulebooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "game_projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      asset_status: "draft" | "review" | "approved" | "rejected"
      asset_type:
        | "image"
        | "3d-model"
        | "document"
        | "audio"
        | "video"
        | "other"
      compensation_type: "equity" | "fixed" | "royalty" | "credit" | "hybrid"
      contributor_role:
        | "illustrator"
        | "3d-modeler"
        | "writer"
        | "graphic-designer"
        | "game-designer"
        | "playtester"
      contributor_status: "applied" | "accepted" | "active" | "completed"
      milestone_status: "planning" | "funding" | "in-progress" | "completed"
      project_category:
        | "board-game"
        | "card-game"
        | "rpg"
        | "miniature-game"
        | "other"
      project_status: "idea" | "in-development" | "completed" | "published"
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
      asset_status: ["draft", "review", "approved", "rejected"],
      asset_type: ["image", "3d-model", "document", "audio", "video", "other"],
      compensation_type: ["equity", "fixed", "royalty", "credit", "hybrid"],
      contributor_role: [
        "illustrator",
        "3d-modeler",
        "writer",
        "graphic-designer",
        "game-designer",
        "playtester",
      ],
      contributor_status: ["applied", "accepted", "active", "completed"],
      milestone_status: ["planning", "funding", "in-progress", "completed"],
      project_category: [
        "board-game",
        "card-game",
        "rpg",
        "miniature-game",
        "other",
      ],
      project_status: ["idea", "in-development", "completed", "published"],
    },
  },
} as const

