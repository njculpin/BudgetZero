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
      block_templates: {
        Row: {
          category: string | null
          content: Json
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          project_id: string
          style_config: Json | null
          tags: string[] | null
          type: Database["public"]["Enums"]["block_type"]
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          content?: Json
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          style_config?: Json | null
          tags?: string[] | null
          type: Database["public"]["Enums"]["block_type"]
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          style_config?: Json | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["block_type"]
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "block_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "game_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          content: Json
          created_at: string | null
          grid_position: Json | null
          id: string
          is_template: boolean | null
          order_index: number
          page_id: string
          style_config: Json | null
          template_category: string | null
          template_name: string | null
          type: Database["public"]["Enums"]["block_type"]
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          grid_position?: Json | null
          id?: string
          is_template?: boolean | null
          order_index?: number
          page_id: string
          style_config?: Json | null
          template_category?: string | null
          template_name?: string | null
          type: Database["public"]["Enums"]["block_type"]
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          grid_position?: Json | null
          id?: string
          is_template?: boolean | null
          order_index?: number
          page_id?: string
          style_config?: Json | null
          template_category?: string | null
          template_name?: string | null
          type?: Database["public"]["Enums"]["block_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "project_pages"
            referencedColumns: ["id"]
          },
        ]
      }
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
      creator_profiles: {
        Row: {
          availability_status:
            | Database["public"]["Enums"]["availability_status"]
            | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id: string
          location: string | null
          portfolio_links: string[] | null
          preferred_project_types: string[] | null
          rate_range: string | null
          skills: string[] | null
          specialties: string[] | null
          time_zone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability_status?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          location?: string | null
          portfolio_links?: string[] | null
          preferred_project_types?: string[] | null
          rate_range?: string | null
          skills?: string[] | null
          specialties?: string[] | null
          time_zone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability_status?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          location?: string | null
          portfolio_links?: string[] | null
          preferred_project_types?: string[] | null
          rate_range?: string | null
          skills?: string[] | null
          specialties?: string[] | null
          time_zone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      page_collaboration: {
        Row: {
          cursor_position: Json | null
          id: string
          is_editing: boolean | null
          last_seen: string | null
          page_id: string
          user_id: string
        }
        Insert: {
          cursor_position?: Json | null
          id?: string
          is_editing?: boolean | null
          last_seen?: string | null
          page_id: string
          user_id: string
        }
        Update: {
          cursor_position?: Json | null
          id?: string
          is_editing?: boolean | null
          last_seen?: string | null
          page_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_collaboration_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "project_pages"
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
      project_contributions: {
        Row: {
          asset_id: string | null
          block_id: string | null
          contribution_type: string
          contributor_id: string
          created_at: string | null
          description: string | null
          id: string
          page_id: string | null
          project_id: string
        }
        Insert: {
          asset_id?: string | null
          block_id?: string | null
          contribution_type: string
          contributor_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          page_id?: string | null
          project_id: string
        }
        Update: {
          asset_id?: string | null
          block_id?: string | null
          contribution_type?: string
          contributor_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          page_id?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contributions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "content_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contributions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "project_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "game_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_merges: {
        Row: {
          id: string
          merge_reason: string | null
          merge_type: string | null
          merged_at: string | null
          merged_by: string
          merged_project_id: string
          parent_project_id: string
        }
        Insert: {
          id?: string
          merge_reason?: string | null
          merge_type?: string | null
          merged_at?: string | null
          merged_by: string
          merged_project_id: string
          parent_project_id: string
        }
        Update: {
          id?: string
          merge_reason?: string | null
          merge_type?: string | null
          merged_at?: string | null
          merged_by?: string
          merged_project_id?: string
          parent_project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_merges_merged_project_id_fkey"
            columns: ["merged_project_id"]
            isOneToOne: false
            referencedRelation: "game_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_merges_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "game_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_pages: {
        Row: {
          created_at: string | null
          id: string
          is_archived: boolean | null
          last_edited_by: string | null
          order_index: number
          section_id: string
          template_type:
            | Database["public"]["Enums"]["page_template_type"]
            | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          last_edited_by?: string | null
          order_index?: number
          section_id: string
          template_type?:
            | Database["public"]["Enums"]["page_template_type"]
            | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          last_edited_by?: string | null
          order_index?: number
          section_id?: string
          template_type?:
            | Database["public"]["Enums"]["page_template_type"]
            | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_pages_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "project_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      project_roles: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string | null
          permissions: Json | null
          project_id: string
          role: Database["public"]["Enums"]["contributor_role"]
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          project_id: string
          role: Database["public"]["Enums"]["contributor_role"]
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          project_id?: string
          role?: Database["public"]["Enums"]["contributor_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "game_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sections: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean | null
          name: string
          order_index: number
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          order_index?: number
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          order_index?: number
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "game_projects"
            referencedColumns: ["id"]
          },
        ]
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
      create_default_project_structure: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      get_default_role_permissions: {
        Args: { role_name: Database["public"]["Enums"]["contributor_role"] }
        Returns: Json
      }
      get_project_merge_history: {
        Args: { project_id: string }
        Returns: {
          merge_id: string
          merge_reason: string
          merge_type: string
          merged_at: string
          merged_by_email: string
          source_project_name: string
        }[]
      }
      merge_project_content: {
        Args: {
          merge_type?: string
          source_project_id: string
          target_project_id: string
        }
        Returns: string
      }
      migrate_existing_rulebooks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_to_role_based_projects: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
      availability_status: "available" | "limited" | "unavailable"
      block_type:
        | "paragraph"
        | "heading"
        | "list"
        | "quote"
        | "image"
        | "table"
        | "divider"
        | "rule_snippet"
        | "component_definition"
        | "stat_block"
        | "example_play"
        | "designer_note"
        | "template"
      compensation_type: "equity" | "fixed" | "royalty" | "credit" | "hybrid"
      contributor_role:
        | "illustrator"
        | "3d-modeler"
        | "writer"
        | "graphic-designer"
        | "game-designer"
        | "playtester"
        | "project-lead"
        | "business-developer"
        | "publisher"
      contributor_status: "applied" | "accepted" | "active" | "completed"
      experience_level: "beginner" | "intermediate" | "advanced" | "expert"
      milestone_status: "planning" | "funding" | "in-progress" | "completed"
      page_template_type:
        | "blank"
        | "rules_section"
        | "component_spec"
        | "quick_start"
        | "playtesting_notes"
        | "design_rationale"
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
      availability_status: ["available", "limited", "unavailable"],
      block_type: [
        "paragraph",
        "heading",
        "list",
        "quote",
        "image",
        "table",
        "divider",
        "rule_snippet",
        "component_definition",
        "stat_block",
        "example_play",
        "designer_note",
        "template",
      ],
      compensation_type: ["equity", "fixed", "royalty", "credit", "hybrid"],
      contributor_role: [
        "illustrator",
        "3d-modeler",
        "writer",
        "graphic-designer",
        "game-designer",
        "playtester",
        "project-lead",
        "business-developer",
        "publisher",
      ],
      contributor_status: ["applied", "accepted", "active", "completed"],
      experience_level: ["beginner", "intermediate", "advanced", "expert"],
      milestone_status: ["planning", "funding", "in-progress", "completed"],
      page_template_type: [
        "blank",
        "rules_section",
        "component_spec",
        "quick_start",
        "playtesting_notes",
        "design_rationale",
      ],
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

