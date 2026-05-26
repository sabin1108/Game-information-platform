import type { SupabaseClient } from "@supabase/supabase-js";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          id: string;
          itad_game_id: string | null;
          slug: string | null;
          title: string;
          image_url: string | null;
          release_date: string | null;
          release_status: Database["public"]["Enums"]["release_status"];
          steam_review_count: number | null;
          steam_positive_ratio: number | null;
          tags: string[];
          raw: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          itad_game_id?: string | null;
          slug?: string | null;
          title: string;
          image_url?: string | null;
          release_date?: string | null;
          release_status?: Database["public"]["Enums"]["release_status"];
          steam_review_count?: number | null;
          steam_positive_ratio?: number | null;
          tags?: string[];
          raw?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["games"]["Insert"]>;
        Relationships: [];
      };
      game_store_products: {
        Row: {
          id: string;
          game_id: string;
          store: Database["public"]["Enums"]["store_code"];
          external_id: string;
          store_url: string;
          title: string;
          country: string | null;
          is_active: boolean;
          raw: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          store: Database["public"]["Enums"]["store_code"];
          external_id: string;
          store_url: string;
          title: string;
          country?: string | null;
          is_active?: boolean;
          raw?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_store_products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "game_store_products_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          preferred_country: string;
          preferred_currency: string;
          webview_last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferred_country?: string;
          preferred_currency?: string;
          webview_last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      watchlist_items: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          target_price_cents: number | null;
          target_discount_percent: number | null;
          note: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          target_price_cents?: number | null;
          target_discount_percent?: number | null;
          note?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["watchlist_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "watchlist_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "watchlist_items_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          }
        ];
      };
      price_snapshots: {
        Row: {
          id: string;
          product_id: string;
          country: string;
          currency: string;
          regular_price_cents: number | null;
          current_price_cents: number | null;
          discount_percent: number | null;
          is_historical_low: boolean;
          starts_at: string | null;
          ends_at: string | null;
          observed_at: string;
          raw: Json;
        };
        Insert: {
          id?: string;
          product_id: string;
          country?: string;
          currency: string;
          regular_price_cents?: number | null;
          current_price_cents?: number | null;
          discount_percent?: number | null;
          is_historical_low?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          observed_at?: string;
          raw?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["price_snapshots"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "price_snapshots_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "game_store_products";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      store_code: "steam" | "epic" | "itad";
      release_status: "released" | "upcoming" | "unknown";
      experiment_variant: "control" | "variant_a" | "variant_b";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type TypedSupabaseClient = SupabaseClient<
  Database,
  "public",
  "public",
  Database["public"]
>;
