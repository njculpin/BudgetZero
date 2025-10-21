export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      asset_files: {
        Row: {
          asset_id: string;
          caption: string | null;
          created_at: string;
          deleted_at: string | null;
          file_size_bytes: number | null;
          file_url: string;
          id: number;
          is_deleted: boolean;
          mime_type: string | null;
          storage_path: string;
          updated_at: string;
        };
        Insert: {
          asset_id: string;
          caption?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          file_size_bytes?: number | null;
          file_url: string;
          id?: number;
          is_deleted?: boolean;
          mime_type?: string | null;
          storage_path: string;
          updated_at?: string;
        };
        Update: {
          asset_id?: string;
          caption?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          file_size_bytes?: number | null;
          file_url?: string;
          id?: number;
          is_deleted?: boolean;
          mime_type?: string | null;
          storage_path?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "asset_files_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      asset_images: {
        Row: {
          asset_id: string;
          caption: string | null;
          created_at: string;
          deleted_at: string | null;
          file_size_bytes: number | null;
          id: number;
          image_url: string;
          is_deleted: boolean;
          position: number;
          storage_path: string;
          updated_at: string;
        };
        Insert: {
          asset_id: string;
          caption?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          file_size_bytes?: number | null;
          id?: number;
          image_url: string;
          is_deleted?: boolean;
          position?: number;
          storage_path: string;
          updated_at?: string;
        };
        Update: {
          asset_id?: string;
          caption?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          file_size_bytes?: number | null;
          id?: number;
          image_url?: string;
          is_deleted?: boolean;
          position?: number;
          storage_path?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "asset_images_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      asset_license_acceptances: {
        Row: {
          accepted_at: string;
          asset_id: string;
          asset_license_agreement: string;
          asset_license_id: number;
          asset_license_title: string;
          asset_license_version: string;
          created_at: string;
          deleted_at: string | null;
          id: number;
          is_deleted: boolean;
          user_id: string;
        };
        Insert: {
          accepted_at?: string;
          asset_id: string;
          asset_license_agreement: string;
          asset_license_id: number;
          asset_license_title: string;
          asset_license_version: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          user_id: string;
        };
        Update: {
          accepted_at?: string;
          asset_id?: string;
          asset_license_agreement?: string;
          asset_license_id?: number;
          asset_license_title?: string;
          asset_license_version?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "asset_license_acceptances_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "asset_license_acceptances_asset_license_id_fkey";
            columns: ["asset_license_id"];
            isOneToOne: false;
            referencedRelation: "asset_licenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "asset_license_acceptances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      asset_licenses: {
        Row: {
          asset_id: string;
          created_at: string;
          deleted_at: string | null;
          expires_at: string | null;
          granted_at: string;
          id: number;
          is_active: boolean;
          is_deleted: boolean;
          license_id: string;
          updated_at: string;
        };
        Insert: {
          asset_id: string;
          created_at?: string;
          deleted_at?: string | null;
          expires_at?: string | null;
          granted_at?: string;
          id?: number;
          is_active?: boolean;
          is_deleted?: boolean;
          license_id: string;
          updated_at?: string;
        };
        Update: {
          asset_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          expires_at?: string | null;
          granted_at?: string;
          id?: number;
          is_active?: boolean;
          is_deleted?: boolean;
          license_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "asset_licenses_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "asset_licenses_license_id_fkey";
            columns: ["license_id"];
            isOneToOne: false;
            referencedRelation: "licenses";
            referencedColumns: ["id"];
          },
        ];
      };
      asset_royalties: {
        Row: {
          asset_id: string;
          created_at: string;
          deleted_at: string | null;
          id: number;
          is_deleted: boolean;
          royalty_type: Database["public"]["Enums"]["royalty_type"];
          royalty_value: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          asset_id: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          royalty_type: Database["public"]["Enums"]["royalty_type"];
          royalty_value: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          asset_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          royalty_type?: Database["public"]["Enums"]["royalty_type"];
          royalty_value?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "asset_royalties_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "asset_royalties_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      asset_tags: {
        Row: {
          asset_id: string;
          created_at: string;
          deleted_at: string | null;
          id: number;
          is_deleted: boolean;
          namespace: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          asset_id: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          namespace: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          asset_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          namespace?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "asset_tags_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      asset_to_products: {
        Row: {
          asset_id: string;
          created_at: string;
          id: number;
          product_id: string;
        };
        Insert: {
          asset_id: string;
          created_at?: string;
          id?: number;
          product_id: string;
        };
        Update: {
          asset_id?: string;
          created_at?: string;
          id?: number;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "asset_to_products_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "asset_to_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      assets: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          is_deleted: boolean;
          is_public: boolean;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_deleted?: boolean;
          is_public?: boolean;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_deleted?: boolean;
          is_public?: boolean;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: Database["public"]["Enums"]["entity_type"];
          id: string;
          ip_address: string | null;
          request_id: string | null;
          snapshot: Json | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: Database["public"]["Enums"]["entity_type"];
          id?: string;
          ip_address?: string | null;
          request_id?: string | null;
          snapshot?: Json | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: Database["public"]["Enums"]["entity_type"];
          id?: string;
          ip_address?: string | null;
          request_id?: string | null;
          snapshot?: Json | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      licenses: {
        Row: {
          agreement: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_deleted: boolean;
          tags: string | null;
          title: string;
          updated_at: string;
          version: string;
        };
        Insert: {
          agreement: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean;
          tags?: string | null;
          title: string;
          updated_at?: string;
          version: string;
        };
        Update: {
          agreement?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean;
          tags?: string | null;
          title?: string;
          updated_at?: string;
          version?: string;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: number;
          is_deleted: boolean;
          tags: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: number;
          is_deleted?: boolean;
          tags?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: number;
          is_deleted?: boolean;
          tags?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          caption: string | null;
          created_at: string;
          deleted_at: string | null;
          file_size_bytes: number | null;
          id: number;
          image_url: string;
          is_deleted: boolean;
          position: number;
          product_id: string;
          storage_path: string;
          updated_at: string;
          visible: boolean;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          file_size_bytes?: number | null;
          id?: number;
          image_url: string;
          is_deleted?: boolean;
          position?: number;
          product_id: string;
          storage_path: string;
          updated_at?: string;
          visible?: boolean;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          file_size_bytes?: number | null;
          id?: number;
          image_url?: string;
          is_deleted?: boolean;
          position?: number;
          product_id?: string;
          storage_path?: string;
          updated_at?: string;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_prices: {
        Row: {
          created_at: string;
          currency: string;
          deleted_at: string | null;
          id: number;
          is_deleted: boolean;
          price_cents: number;
          updated_at: string;
          variant_id: number;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          price_cents: number;
          updated_at?: string;
          variant_id: number;
        };
        Update: {
          created_at?: string;
          currency?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          price_cents?: number;
          updated_at?: string;
          variant_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_prices_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_ratings: {
        Row: {
          comment: string | null;
          created_at: string;
          deleted_at: string | null;
          id: number;
          is_deleted: boolean;
          product_id: string;
          score: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          product_id: string;
          score: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          product_id?: string;
          score?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_ratings_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      product_tags: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: number;
          is_deleted: boolean;
          namespace: string;
          product_id: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          namespace?: string;
          product_id: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          namespace?: string;
          product_id?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_teams: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_deleted: boolean;
          product_id: string;
          team_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean;
          product_id: string;
          team_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean;
          product_id?: string;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_teams_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_teams_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      product_to_product_categories: {
        Row: {
          category_id: number;
          created_at: string;
          id: string;
          product_id: string;
          updated_at: string;
        };
        Insert: {
          category_id: number;
          created_at?: string;
          id?: string;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          category_id?: number;
          created_at?: string;
          id?: string;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_to_product_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_to_product_categories_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variant_assets: {
        Row: {
          asset_id: string;
          created_at: string;
          id: number;
          variant_id: number;
        };
        Insert: {
          asset_id: string;
          created_at?: string;
          id?: number;
          variant_id: number;
        };
        Update: {
          asset_id?: string;
          created_at?: string;
          id?: number;
          variant_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_variant_assets_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variant_assets_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variant_images: {
        Row: {
          caption: string | null;
          created_at: string;
          deleted_at: string | null;
          id: number;
          image_url: string;
          is_deleted: boolean;
          position: number;
          updated_at: string;
          variant_id: number;
          visible: boolean;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          image_url: string;
          is_deleted?: boolean;
          position?: number;
          updated_at?: string;
          variant_id: number;
          visible?: boolean;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          image_url?: string;
          is_deleted?: boolean;
          position?: number;
          updated_at?: string;
          variant_id?: number;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "product_variant_images_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: number;
          is_deleted: boolean;
          product_id: string;
          sku: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          product_id: string;
          sku?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          product_id?: string;
          sku?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          handle: string;
          id: string;
          is_deleted: boolean;
          is_featured: boolean;
          published_at: string | null;
          status: Database["public"]["Enums"]["product_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          handle: string;
          id?: string;
          is_deleted?: boolean;
          is_featured?: boolean;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          handle?: string;
          id?: string;
          is_deleted?: boolean;
          is_featured?: boolean;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sale_item_assets: {
        Row: {
          asset_id: string | null;
          created_at: string;
          id: number;
          sale_item_id: number;
        };
        Insert: {
          asset_id?: string | null;
          created_at?: string;
          id?: number;
          sale_item_id: number;
        };
        Update: {
          asset_id?: string | null;
          created_at?: string;
          id?: number;
          sale_item_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_item_assets_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_item_assets_sale_item_id_fkey";
            columns: ["sale_item_id"];
            isOneToOne: false;
            referencedRelation: "sale_items";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          created_at: string;
          currency: string;
          id: number;
          price_cents: number;
          product_id: string | null;
          quantity: number;
          sale_id: number;
          snapshot: Json;
          variant_id: number | null;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: number;
          price_cents: number;
          product_id?: string | null;
          quantity?: number;
          sale_id: number;
          snapshot: Json;
          variant_id?: number | null;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: number;
          price_cents?: number;
          product_id?: string | null;
          quantity?: number;
          sale_id?: number;
          snapshot?: Json;
          variant_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_license_transactions: {
        Row: {
          asset_license_agreement: string;
          asset_license_id: number | null;
          asset_license_title: string;
          asset_license_version: string;
          created_at: string;
          id: number;
          sale_id: number;
          sale_item_asset_id: number;
          sale_item_id: number;
          status: string;
        };
        Insert: {
          asset_license_agreement: string;
          asset_license_id?: number | null;
          asset_license_title: string;
          asset_license_version: string;
          created_at?: string;
          id?: number;
          sale_id: number;
          sale_item_asset_id: number;
          sale_item_id: number;
          status: string;
        };
        Update: {
          asset_license_agreement?: string;
          asset_license_id?: number | null;
          asset_license_title?: string;
          asset_license_version?: string;
          created_at?: string;
          id?: number;
          sale_id?: number;
          sale_item_asset_id?: number;
          sale_item_id?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sale_license_transactions_asset_license_id_fkey";
            columns: ["asset_license_id"];
            isOneToOne: false;
            referencedRelation: "asset_licenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_license_transactions_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_license_transactions_sale_item_asset_id_fkey";
            columns: ["sale_item_asset_id"];
            isOneToOne: false;
            referencedRelation: "sale_item_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_license_transactions_sale_item_id_fkey";
            columns: ["sale_item_id"];
            isOneToOne: false;
            referencedRelation: "sale_items";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_royalty_transactions: {
        Row: {
          asset_royalty_id: number | null;
          calculated_cents: number;
          created_at: string;
          id: number;
          paid_at: string | null;
          recipient_user_id: string;
          royalty_type: Database["public"]["Enums"]["royalty_type"];
          royalty_value: number;
          sale_id: number;
          sale_item_asset_id: number | null;
          sale_item_id: number;
          status: Database["public"]["Enums"]["royalty_transaction_status"];
          stripe_transfer_id: string | null;
        };
        Insert: {
          asset_royalty_id?: number | null;
          calculated_cents: number;
          created_at?: string;
          id?: number;
          paid_at?: string | null;
          recipient_user_id: string;
          royalty_type: Database["public"]["Enums"]["royalty_type"];
          royalty_value: number;
          sale_id: number;
          sale_item_asset_id?: number | null;
          sale_item_id: number;
          status?: Database["public"]["Enums"]["royalty_transaction_status"];
          stripe_transfer_id?: string | null;
        };
        Update: {
          asset_royalty_id?: number | null;
          calculated_cents?: number;
          created_at?: string;
          id?: number;
          paid_at?: string | null;
          recipient_user_id?: string;
          royalty_type?: Database["public"]["Enums"]["royalty_type"];
          royalty_value?: number;
          sale_id?: number;
          sale_item_asset_id?: number | null;
          sale_item_id?: number;
          status?: Database["public"]["Enums"]["royalty_transaction_status"];
          stripe_transfer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sale_royalty_transactions_asset_royalty_id_fkey";
            columns: ["asset_royalty_id"];
            isOneToOne: false;
            referencedRelation: "asset_royalties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_royalty_transactions_recipient_user_id_fkey";
            columns: ["recipient_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_royalty_transactions_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_royalty_transactions_sale_item_asset_id_fkey";
            columns: ["sale_item_asset_id"];
            isOneToOne: false;
            referencedRelation: "sale_item_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_royalty_transactions_sale_item_id_fkey";
            columns: ["sale_item_id"];
            isOneToOne: false;
            referencedRelation: "sale_items";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          created_at: string;
          currency: string;
          id: number;
          price_cents: number;
          status: Database["public"]["Enums"]["order_status"];
          stripe_charge_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: number;
          price_cents: number;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_charge_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: number;
          price_cents?: number;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_charge_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      stripe_prices: {
        Row: {
          created_at: string;
          currency: string;
          deleted_at: string | null;
          fee_type: Database["public"]["Enums"]["fee_type"];
          id: string;
          is_deleted: boolean;
          lookup_name: string;
          price_cents: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          deleted_at?: string | null;
          fee_type: Database["public"]["Enums"]["fee_type"];
          id?: string;
          is_deleted?: boolean;
          lookup_name: string;
          price_cents: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          deleted_at?: string | null;
          fee_type?: Database["public"]["Enums"]["fee_type"];
          id?: string;
          is_deleted?: boolean;
          lookup_name?: string;
          price_cents?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_channels: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: number;
          is_deleted: boolean;
          team_id: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: number;
          is_deleted?: boolean;
          team_id: string;
          title: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: number;
          is_deleted?: boolean;
          team_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_channels_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      team_chat_message_attachments: {
        Row: {
          attachment_url: string;
          chat_message_id: number;
          created_at: string;
          deleted_at: string | null;
          id: number;
          is_deleted: boolean;
          updated_at: string;
        };
        Insert: {
          attachment_url: string;
          chat_message_id: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          updated_at?: string;
        };
        Update: {
          attachment_url?: string;
          chat_message_id?: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_chat_message_attachments_chat_message_id_fkey";
            columns: ["chat_message_id"];
            isOneToOne: false;
            referencedRelation: "team_chat_messages";
            referencedColumns: ["id"];
          },
        ];
      };
      team_chat_message_reactions: {
        Row: {
          chat_message_id: number;
          created_at: string;
          deleted_at: string | null;
          id: number;
          is_deleted: boolean;
          reaction: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          chat_message_id: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          reaction: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          chat_message_id?: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          reaction?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_chat_message_reactions_chat_message_id_fkey";
            columns: ["chat_message_id"];
            isOneToOne: false;
            referencedRelation: "team_chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_chat_message_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      team_chat_messages: {
        Row: {
          channel_id: number;
          created_at: string;
          deleted_at: string | null;
          id: number;
          is_deleted: boolean;
          message: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          channel_id: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          message: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          channel_id?: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: number;
          is_deleted?: boolean;
          message?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_chat_messages_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "team_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      team_users: {
        Row: {
          created_at: string;
          credits: string | null;
          id: number;
          team_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          credits?: string | null;
          id?: number;
          team_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          credits?: string | null;
          id?: number;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_users_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_deleted: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_addresses: {
        Row: {
          address_line1: string;
          address_line2: string | null;
          address_type: string;
          city: string;
          country_code: string;
          created_at: string;
          deleted_at: string | null;
          full_name: string;
          id: number;
          is_deleted: boolean;
          is_primary: boolean;
          phone: string | null;
          postal_code: string;
          state_province: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address_line1: string;
          address_line2?: string | null;
          address_type: string;
          city: string;
          country_code: string;
          created_at?: string;
          deleted_at?: string | null;
          full_name: string;
          id?: number;
          is_deleted?: boolean;
          is_primary?: boolean;
          phone?: string | null;
          postal_code: string;
          state_province?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address_line1?: string;
          address_line2?: string | null;
          address_type?: string;
          city?: string;
          country_code?: string;
          created_at?: string;
          deleted_at?: string | null;
          full_name?: string;
          id?: number;
          is_deleted?: boolean;
          is_primary?: boolean;
          phone?: string | null;
          postal_code?: string;
          state_province?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_payouts: {
        Row: {
          created_at: string;
          currency: string;
          id: string;
          paid_at: string | null;
          period_end: string;
          period_start: string;
          status: Database["public"]["Enums"]["payout_status"];
          stripe_transfer_id: string | null;
          total_cents: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: string;
          paid_at?: string | null;
          period_end: string;
          period_start: string;
          status?: Database["public"]["Enums"]["payout_status"];
          stripe_transfer_id?: string | null;
          total_cents: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
          paid_at?: string | null;
          period_end?: string;
          period_start?: string;
          status?: Database["public"]["Enums"]["payout_status"];
          stripe_transfer_id?: string | null;
          total_cents?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_payouts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_stripe_accounts: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_deleted: boolean;
          stripe_account_id: string | null;
          stripe_customer_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean;
          stripe_account_id?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean;
          stripe_account_id?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_stripe_accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_stripe_invoices: {
        Row: {
          created_at: string;
          currency: string;
          id: number;
          invoice_url: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
          stripe_invoice_id: string;
          subtotal_cents: number;
          tax_cents: number;
          total_cents: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: number;
          invoice_url?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          stripe_invoice_id: string;
          subtotal_cents: number;
          tax_cents?: number;
          total_cents: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: number;
          invoice_url?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          stripe_invoice_id?: string;
          subtotal_cents?: number;
          tax_cents?: number;
          total_cents?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_stripe_invoices_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          bio: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string;
          first_name: string | null;
          full_name: string | null;
          id: string;
          is_deleted: boolean;
          last_name: string | null;
          phone: string | null;
          updated_at: string;
          username: string | null;
          verified: boolean | null;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          first_name?: string | null;
          full_name?: string | null;
          id: string;
          is_deleted?: boolean;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
          username?: string | null;
          verified?: boolean | null;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          first_name?: string | null;
          full_name?: string | null;
          id?: string;
          is_deleted?: boolean;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
          username?: string | null;
          verified?: boolean | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_ulid: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      entity_type:
        | "user"
        | "asset"
        | "product"
        | "sale"
        | "sale_item"
        | "team"
        | "license";
      fee_type: "percentage" | "fixed";
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible";
      order_status: "pending" | "paid" | "failed" | "refunded";
      payout_status: "pending" | "paid" | "failed";
      product_status: "draft" | "published" | "archived";
      royalty_transaction_status:
        | "pending"
        | "ready_to_pay"
        | "paid"
        | "failed"
        | "refunded";
      royalty_type: "fixed" | "percentage";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      entity_type: [
        "user",
        "asset",
        "product",
        "sale",
        "sale_item",
        "team",
        "license",
      ],
      fee_type: ["percentage", "fixed"],
      invoice_status: ["draft", "open", "paid", "void", "uncollectible"],
      order_status: ["pending", "paid", "failed", "refunded"],
      payout_status: ["pending", "paid", "failed"],
      product_status: ["draft", "published", "archived"],
      royalty_transaction_status: [
        "pending",
        "ready_to_pay",
        "paid",
        "failed",
        "refunded",
      ],
      royalty_type: ["fixed", "percentage"],
    },
  },
} as const;
