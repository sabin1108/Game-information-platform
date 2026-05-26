export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
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
      };
    };
  };
};
