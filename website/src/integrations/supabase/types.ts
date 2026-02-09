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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      allocation_config: {
        Row: {
          affiliate_network_pct: number
          btc_mining_machines_pct: number
          core_team_pct: number
          created_at: string | null
          id: string
          investor_returns_pct: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          affiliate_network_pct?: number
          btc_mining_machines_pct?: number
          core_team_pct?: number
          created_at?: string | null
          id?: string
          investor_returns_pct?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          affiliate_network_pct?: number
          btc_mining_machines_pct?: number
          core_team_pct?: number
          created_at?: string | null
          id?: string
          investor_returns_pct?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      allocation_settings: {
        Row: {
          created_at: string | null
          id: string
          max_value: number | null
          min_value: number | null
          name: string
          updated_at: string | null
          updated_by: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: number
        }
        Relationships: []
      }
      banned_usernames: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          word: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          word: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          word?: string
        }
        Relationships: []
      }
      binary_commissions: {
        Row: {
          base_amount: number | null
          created_at: string | null
          id: string
          scale_factor: number | null
          scaled_amount: number | null
          status: Database["public"]["Enums"]["commission_status"] | null
          updated_at: string | null
          user_id: string
          weak_leg_volume: number | null
          week_start: string
        }
        Insert: {
          base_amount?: number | null
          created_at?: string | null
          id?: string
          scale_factor?: number | null
          scaled_amount?: number | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          updated_at?: string | null
          user_id: string
          weak_leg_volume?: number | null
          week_start: string
        }
        Update: {
          base_amount?: number | null
          created_at?: string | null
          id?: string
          scale_factor?: number | null
          scaled_amount?: number | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          updated_at?: string | null
          user_id?: string
          weak_leg_volume?: number | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "binary_commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      binary_tree: {
        Row: {
          created_at: string | null
          id: string
          left_leg_id: string | null
          left_volume: number | null
          right_leg_id: string | null
          right_volume: number | null
          total_left_members: number | null
          total_right_members: number | null
          updated_at: string | null
          user_id: string
          weak_leg: Database["public"]["Enums"]["binary_position"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          left_leg_id?: string | null
          left_volume?: number | null
          right_leg_id?: string | null
          right_volume?: number | null
          total_left_members?: number | null
          total_right_members?: number | null
          updated_at?: string | null
          user_id: string
          weak_leg?: Database["public"]["Enums"]["binary_position"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          left_leg_id?: string | null
          left_volume?: number | null
          right_leg_id?: string | null
          right_volume?: number | null
          total_left_members?: number | null
          total_right_members?: number | null
          updated_at?: string | null
          user_id?: string
          weak_leg?: Database["public"]["Enums"]["binary_position"] | null
        }
        Relationships: [
          {
            foreignKeyName: "binary_tree_left_leg_id_fkey"
            columns: ["left_leg_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "binary_tree_right_leg_id_fkey"
            columns: ["right_leg_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "binary_tree_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      binary_volume: {
        Row: {
          carry_in: number | null
          carry_out: number | null
          created_at: string | null
          id: string
          leg: Database["public"]["Enums"]["binary_position"]
          total_volume: number | null
          updated_at: string | null
          user_id: string
          volume: number | null
          week_start: string
        }
        Insert: {
          carry_in?: number | null
          carry_out?: number | null
          created_at?: string | null
          id?: string
          leg: Database["public"]["Enums"]["binary_position"]
          total_volume?: number | null
          updated_at?: string | null
          user_id: string
          volume?: number | null
          week_start: string
        }
        Update: {
          carry_in?: number | null
          carry_out?: number | null
          created_at?: string | null
          id?: string
          leg?: Database["public"]["Enums"]["binary_position"]
          total_volume?: number | null
          updated_at?: string | null
          user_id?: string
          volume?: number | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "binary_volume_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_upload_logs: {
        Row: {
          created_at: string
          error_details: Json | null
          failed_rows: number
          file_name: string
          id: string
          successful_rows: number
          total_rows: number
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          failed_rows?: number
          file_name: string
          id?: string
          successful_rows?: number
          total_rows?: number
          uploaded_by: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          failed_rows?: number
          file_name?: string
          id?: string
          successful_rows?: number
          total_rows?: number
          uploaded_by?: string
        }
        Relationships: []
      }
      commission_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_value: number
          min_value: number
          setting_name: string
          setting_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_value: number
          min_value: number
          setting_name: string
          setting_value: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_value?: number
          min_value?: number
          setting_name?: string
          setting_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      commission_settings_audit: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_value: number | null
          old_value: number | null
          reason: string | null
          setting_name: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: number | null
          old_value?: number | null
          reason?: string | null
          setting_name: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: number | null
          old_value?: number | null
          reason?: string | null
          setting_name?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at: string | null
          id: string
          metadata: Json | null
          settlement_id: string | null
          source_user_id: string | null
          status: Database["public"]["Enums"]["commission_status"] | null
          transaction_hash: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at?: string | null
          id?: string
          metadata?: Json | null
          settlement_id?: string | null
          source_user_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          commission_type?: Database["public"]["Enums"]["commission_type"]
          created_at?: string | null
          id?: string
          metadata?: Json | null
          settlement_id?: string | null
          source_user_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commissions_settlement"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "weekly_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      deployment_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["deployment_status"]
          id: string
          machine_inventory_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_date?: string
          event_type: Database["public"]["Enums"]["deployment_status"]
          id?: string
          machine_inventory_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["deployment_status"]
          id?: string
          machine_inventory_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deployment_events_machine_inventory_id_fkey"
            columns: ["machine_inventory_id"]
            isOneToOne: false
            referencedRelation: "machine_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_wallets: {
        Row: {
          chain: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          label: string | null
          total_received: number
          updated_at: string
          wallet_address: string
        }
        Insert: {
          chain?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          label?: string | null
          total_received?: number
          updated_at?: string
          wallet_address: string
        }
        Update: {
          chain?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          label?: string | null
          total_received?: number
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      direct_commissions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          rate: number
          source_user_id: string
          status: Database["public"]["Enums"]["commission_status"] | null
          tier: number
          transaction_id: string | null
          updated_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          rate: number
          source_user_id: string
          status?: Database["public"]["Enums"]["commission_status"] | null
          tier: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          rate?: number
          source_user_id?: string
          status?: Database["public"]["Enums"]["commission_status"] | null
          tier?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_commissions_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      encrypted_secrets: {
        Row: {
          auth_tag: string
          created_at: string
          created_by: string
          encrypted_value: string
          encryption_key_id: string
          id: string
          masked_value: string
          metadata: Json | null
          nonce: string
          secret_type: Database["public"]["Enums"]["secret_type"]
          updated_at: string
          updated_by: string
          value_hash: string
        }
        Insert: {
          auth_tag: string
          created_at?: string
          created_by: string
          encrypted_value: string
          encryption_key_id: string
          id?: string
          masked_value: string
          metadata?: Json | null
          nonce: string
          secret_type: Database["public"]["Enums"]["secret_type"]
          updated_at?: string
          updated_by: string
          value_hash: string
        }
        Update: {
          auth_tag?: string
          created_at?: string
          created_by?: string
          encrypted_value?: string
          encryption_key_id?: string
          id?: string
          masked_value?: string
          metadata?: Json | null
          nonce?: string
          secret_type?: Database["public"]["Enums"]["secret_type"]
          updated_at?: string
          updated_by?: string
          value_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "encrypted_secrets_encryption_key_id_fkey"
            columns: ["encryption_key_id"]
            isOneToOne: false
            referencedRelation: "secret_encryption_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      ghost_bv: {
        Row: {
          created_at: string
          expires_at: string
          ghost_bv_amount: number
          id: string
          original_package_value: number
          package_purchase_id: string | null
          pay_leg: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          ghost_bv_amount?: number
          id?: string
          original_package_value?: number
          package_purchase_id?: string | null
          pay_leg?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          ghost_bv_amount?: number
          id?: string
          original_package_value?: number
          package_purchase_id?: string | null
          pay_leg?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ghost_bv_package_purchase_id_fkey"
            columns: ["package_purchase_id"]
            isOneToOne: false
            referencedRelation: "package_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ghost_bv_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashrate_allocations: {
        Row: {
          created_at: string
          id: string
          machine_inventory_id: string
          status: string
          tokenized_ths: number
          total_ths: number
          untokenized_ths: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          machine_inventory_id: string
          status?: string
          tokenized_ths?: number
          total_ths: number
          untokenized_ths: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          machine_inventory_id?: string
          status?: string
          tokenized_ths?: number
          total_ths?: number
          untokenized_ths?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hashrate_listings: {
        Row: {
          allocation_id: string
          amount_ths: number
          created_at: string | null
          expires_at: string | null
          id: string
          price_per_ths: number
          seller_id: string
          status: string
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          allocation_id: string
          amount_ths: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          price_per_ths: number
          seller_id: string
          status?: string
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          allocation_id?: string
          amount_ths?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          price_per_ths?: number
          seller_id?: string
          status?: string
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hashrate_listings_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "hashrate_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      hashrate_tokenizations: {
        Row: {
          allocation_id: string | null
          amount_ths: number
          created_at: string
          id: string
          status: Database["public"]["Enums"]["tokenization_status"]
          token_symbol: string
          tokens_minted: number
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allocation_id?: string | null
          amount_ths: number
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["tokenization_status"]
          token_symbol: string
          tokens_minted: number
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allocation_id?: string | null
          amount_ths?: number
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["tokenization_status"]
          token_symbol?: string
          tokens_minted?: number
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_allocation_id"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "hashrate_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      hashrate_trades: {
        Row: {
          amount_ths: number
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          listing_id: string
          price_per_ths: number
          seller_id: string
          status: string
          total_price: number
          transaction_hash: string | null
          updated_at: string | null
        }
        Insert: {
          amount_ths: number
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          listing_id: string
          price_per_ths: number
          seller_id: string
          status?: string
          total_price: number
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_ths?: number
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string
          price_per_ths?: number
          seller_id?: string
          status?: string
          total_price?: number
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hashrate_trades_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "hashrate_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_fees: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          due_date: string
          fee_amount: number
          id: string
          machine_inventory_id: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          transaction_hash: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          created_at?: string | null
          due_date: string
          fee_amount: number
          id?: string
          machine_inventory_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          transaction_hash?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          due_date?: string
          fee_amount?: number
          id?: string
          machine_inventory_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosting_fees_machine_inventory_id_fkey"
            columns: ["machine_inventory_id"]
            isOneToOne: false
            referencedRelation: "machine_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_sites: {
        Row: {
          assigned_capacity_mw: number
          available_capacity_mw: number | null
          cooling_type: Database["public"]["Enums"]["cooling_type"]
          created_at: string
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          notes: string | null
          site_name: string
          status: string
          total_capacity_mw: number
          updated_at: string
        }
        Insert: {
          assigned_capacity_mw?: number
          available_capacity_mw?: number | null
          cooling_type?: Database["public"]["Enums"]["cooling_type"]
          created_at?: string
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          notes?: string | null
          site_name: string
          status?: string
          total_capacity_mw?: number
          updated_at?: string
        }
        Update: {
          assigned_capacity_mw?: number
          available_capacity_mw?: number | null
          cooling_type?: Database["public"]["Enums"]["cooling_type"]
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          notes?: string | null
          site_name?: string
          status?: string
          total_capacity_mw?: number
          updated_at?: string
        }
        Relationships: []
      }
      leadership_pool_distributions: {
        Row: {
          created_at: string
          distributed_at: string | null
          distribution_status: string
          id: string
          qualified_leaders: Json | null
          tier_0_5_percent: number
          tier_1_0_percent: number
          tier_1_5_percent: number
          total_pool_amount: number
          total_weekly_volume: number
          updated_at: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          distributed_at?: string | null
          distribution_status?: string
          id?: string
          qualified_leaders?: Json | null
          tier_0_5_percent?: number
          tier_1_0_percent?: number
          tier_1_5_percent?: number
          total_pool_amount?: number
          total_weekly_volume?: number
          updated_at?: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          distributed_at?: string | null
          distribution_status?: string
          id?: string
          qualified_leaders?: Json | null
          tier_0_5_percent?: number
          tier_1_0_percent?: number
          tier_1_5_percent?: number
          total_pool_amount?: number
          total_weekly_volume?: number
          updated_at?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      liquidity_pool: {
        Row: {
          current_balance: number
          id: string
          total_contributed: number
          total_utilized: number
          updated_at: string | null
        }
        Insert: {
          current_balance?: number
          id?: string
          total_contributed?: number
          total_utilized?: number
          updated_at?: string | null
        }
        Update: {
          current_balance?: number
          id?: string
          total_contributed?: number
          total_utilized?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      lottery_pool: {
        Row: {
          current_balance: number
          id: string
          total_contributed: number
          total_paid_out: number
          updated_at: string | null
        }
        Insert: {
          current_balance?: number
          id?: string
          total_contributed?: number
          total_paid_out?: number
          updated_at?: string | null
        }
        Update: {
          current_balance?: number
          id?: string
          total_contributed?: number
          total_paid_out?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      machine_bulk_uploads: {
        Row: {
          admin_user_id: string
          created_at: string
          errors_json: Json | null
          failed_rows: number
          file_name: string
          id: string
          status: Database["public"]["Enums"]["upload_status"]
          successful_rows: number
          total_rows: number
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          errors_json?: Json | null
          failed_rows?: number
          file_name: string
          id?: string
          status: Database["public"]["Enums"]["upload_status"]
          successful_rows?: number
          total_rows?: number
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          errors_json?: Json | null
          failed_rows?: number
          file_name?: string
          id?: string
          status?: Database["public"]["Enums"]["upload_status"]
          successful_rows?: number
          total_rows?: number
        }
        Relationships: []
      }
      machine_inventory: {
        Row: {
          activated_at: string | null
          created_at: string
          deployment_status:
            | Database["public"]["Enums"]["deployment_status"]
            | null
          hosting_site_id: string | null
          id: string
          installation_notes: string | null
          installed_at: string | null
          location: string | null
          machine_type_id: string
          purchase_id: string | null
          shipped_at: string | null
          status: string
          tokenized_ths: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          deployment_status?:
            | Database["public"]["Enums"]["deployment_status"]
            | null
          hosting_site_id?: string | null
          id?: string
          installation_notes?: string | null
          installed_at?: string | null
          location?: string | null
          machine_type_id: string
          purchase_id?: string | null
          shipped_at?: string | null
          status?: string
          tokenized_ths?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          deployment_status?:
            | Database["public"]["Enums"]["deployment_status"]
            | null
          hosting_site_id?: string | null
          id?: string
          installation_notes?: string | null
          installed_at?: string | null
          location?: string | null
          machine_type_id?: string
          purchase_id?: string | null
          shipped_at?: string | null
          status?: string
          tokenized_ths?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_inventory_hosting_site_id_fkey"
            columns: ["hosting_site_id"]
            isOneToOne: false
            referencedRelation: "hosting_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_inventory_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: false
            referencedRelation: "machine_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_inventory_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "machine_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_purchases: {
        Row: {
          created_at: string
          id: string
          machine_type_id: string
          payment_currency: string
          quantity: number
          status: string
          total_price: number
          unit_price_usdt: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          machine_type_id: string
          payment_currency: string
          quantity: number
          status?: string
          total_price: number
          unit_price_usdt: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          machine_type_id?: string
          payment_currency?: string
          quantity?: number
          status?: string
          total_price?: number
          unit_price_usdt?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_purchases_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: false
            referencedRelation: "machine_types"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_types: {
        Row: {
          available_quantity: number
          brand: string
          created_at: string
          description: string | null
          efficiency_j_per_th: number
          hash_rate_ths: number
          id: string
          image_url: string | null
          location: string | null
          model: string
          power_watts: number
          price_usdt: number
          status: string
          updated_at: string
        }
        Insert: {
          available_quantity?: number
          brand: string
          created_at?: string
          description?: string | null
          efficiency_j_per_th: number
          hash_rate_ths: number
          id?: string
          image_url?: string | null
          location?: string | null
          model: string
          power_watts: number
          price_usdt: number
          status?: string
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          brand?: string
          created_at?: string
          description?: string | null
          efficiency_j_per_th?: number
          hash_rate_ths?: number
          id?: string
          image_url?: string | null
          location?: string | null
          model?: string
          power_watts?: number
          price_usdt?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      mining_pool_configs: {
        Row: {
          api_key: string
          api_key_secret_id: string | null
          api_secret: string
          api_secret_secret_id: string | null
          base_url: string | null
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: Database["public"]["Enums"]["sync_status"] | null
          pool_name: string
          pool_provider: Database["public"]["Enums"]["pool_provider"]
          subaccount: string | null
          updated_at: string
          user_id: string
          uses_encrypted_secrets: boolean
        }
        Insert: {
          api_key: string
          api_key_secret_id?: string | null
          api_secret: string
          api_secret_secret_id?: string | null
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: Database["public"]["Enums"]["sync_status"] | null
          pool_name: string
          pool_provider: Database["public"]["Enums"]["pool_provider"]
          subaccount?: string | null
          updated_at?: string
          user_id: string
          uses_encrypted_secrets?: boolean
        }
        Update: {
          api_key?: string
          api_key_secret_id?: string | null
          api_secret?: string
          api_secret_secret_id?: string | null
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: Database["public"]["Enums"]["sync_status"] | null
          pool_name?: string
          pool_provider?: Database["public"]["Enums"]["pool_provider"]
          subaccount?: string | null
          updated_at?: string
          user_id?: string
          uses_encrypted_secrets?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mining_pool_configs_api_key_secret_id_fkey"
            columns: ["api_key_secret_id"]
            isOneToOne: false
            referencedRelation: "encrypted_secrets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mining_pool_configs_api_secret_secret_id_fkey"
            columns: ["api_secret_secret_id"]
            isOneToOne: false
            referencedRelation: "encrypted_secrets"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_pool_key_rotations: {
        Row: {
          created_at: string
          id: string
          new_key_fingerprint: string | null
          new_secret_id: string | null
          old_key_fingerprint: string | null
          old_secret_id: string | null
          pool_config_id: string
          rotated_by: string
          rotation_reason: string | null
          rotation_type: Database["public"]["Enums"]["rotation_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          new_key_fingerprint?: string | null
          new_secret_id?: string | null
          old_key_fingerprint?: string | null
          old_secret_id?: string | null
          pool_config_id: string
          rotated_by: string
          rotation_reason?: string | null
          rotation_type?: Database["public"]["Enums"]["rotation_type"]
        }
        Update: {
          created_at?: string
          id?: string
          new_key_fingerprint?: string | null
          new_secret_id?: string | null
          old_key_fingerprint?: string | null
          old_secret_id?: string | null
          pool_config_id?: string
          rotated_by?: string
          rotation_reason?: string | null
          rotation_type?: Database["public"]["Enums"]["rotation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "mining_pool_key_rotations_new_secret_id_fkey"
            columns: ["new_secret_id"]
            isOneToOne: false
            referencedRelation: "encrypted_secrets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mining_pool_key_rotations_old_secret_id_fkey"
            columns: ["old_secret_id"]
            isOneToOne: false
            referencedRelation: "encrypted_secrets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mining_pool_key_rotations_pool_config_id_fkey"
            columns: ["pool_config_id"]
            isOneToOne: false
            referencedRelation: "mining_pool_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_pool_payouts: {
        Row: {
          amount_btc: number
          coin: string
          created_at: string
          id: string
          payout_time: string
          pool_config_id: string
          raw_payload: Json
          transaction_id: string | null
        }
        Insert: {
          amount_btc: number
          coin?: string
          created_at?: string
          id?: string
          payout_time: string
          pool_config_id: string
          raw_payload: Json
          transaction_id?: string | null
        }
        Update: {
          amount_btc?: number
          coin?: string
          created_at?: string
          id?: string
          payout_time?: string
          pool_config_id?: string
          raw_payload?: Json
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mining_pool_payouts_pool_config_id_fkey"
            columns: ["pool_config_id"]
            isOneToOne: false
            referencedRelation: "mining_pool_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_pool_stats_snapshots: {
        Row: {
          active_worker_count: number
          avg_24h_hashrate_hs: number | null
          created_at: string
          current_hashrate_hs: number
          id: string
          payout_coin: string
          pool_config_id: string
          raw_payload: Json
          snapshot_time: string
          unpaid_balance_btc: number
          worker_count: number
        }
        Insert: {
          active_worker_count?: number
          avg_24h_hashrate_hs?: number | null
          created_at?: string
          current_hashrate_hs: number
          id?: string
          payout_coin?: string
          pool_config_id: string
          raw_payload: Json
          snapshot_time?: string
          unpaid_balance_btc?: number
          worker_count?: number
        }
        Update: {
          active_worker_count?: number
          avg_24h_hashrate_hs?: number | null
          created_at?: string
          current_hashrate_hs?: number
          id?: string
          payout_coin?: string
          pool_config_id?: string
          raw_payload?: Json
          snapshot_time?: string
          unpaid_balance_btc?: number
          worker_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "mining_pool_stats_snapshots_pool_config_id_fkey"
            columns: ["pool_config_id"]
            isOneToOne: false
            referencedRelation: "mining_pool_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_pool_workers: {
        Row: {
          avg_hashrate_hs: number | null
          created_at: string
          current_hashrate_hs: number
          id: string
          last_share_time: string | null
          pool_config_id: string
          raw_payload: Json
          status: string
          updated_at: string
          worker_name: string
        }
        Insert: {
          avg_hashrate_hs?: number | null
          created_at?: string
          current_hashrate_hs?: number
          id?: string
          last_share_time?: string | null
          pool_config_id: string
          raw_payload: Json
          status?: string
          updated_at?: string
          worker_name: string
        }
        Update: {
          avg_hashrate_hs?: number | null
          created_at?: string
          current_hashrate_hs?: number
          id?: string
          last_share_time?: string | null
          pool_config_id?: string
          raw_payload?: Json
          status?: string
          updated_at?: string
          worker_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mining_pool_workers_pool_config_id_fkey"
            columns: ["pool_config_id"]
            isOneToOne: false
            referencedRelation: "mining_pool_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_contract_config: {
        Row: {
          admin_wallet: string
          chain: string
          contract_address: string
          created_at: string
          id: string
          is_active: boolean | null
          soulbound_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          admin_wallet: string
          chain: string
          contract_address: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          soulbound_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          admin_wallet?: string
          chain?: string
          contract_address?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          soulbound_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      nft_mint_queue: {
        Row: {
          attempts: number | null
          created_at: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_attempts: number | null
          next_attempt_at: string | null
          nft_id: string
          priority: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          next_attempt_at?: string | null
          nft_id: string
          priority?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          next_attempt_at?: string | null
          nft_id?: string
          priority?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_mint_queue_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "purchase_nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      override_commissions: {
        Row: {
          base_amount: number | null
          created_at: string | null
          id: string
          level: number
          scaled_amount: number | null
          source_user_id: string
          status: Database["public"]["Enums"]["commission_status"] | null
          updated_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          base_amount?: number | null
          created_at?: string | null
          id?: string
          level: number
          scaled_amount?: number | null
          source_user_id: string
          status?: Database["public"]["Enums"]["commission_status"] | null
          updated_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          base_amount?: number | null
          created_at?: string | null
          id?: string
          level?: number
          scaled_amount?: number | null
          source_user_id?: string
          status?: Database["public"]["Enums"]["commission_status"] | null
          updated_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "override_commissions_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "override_commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      package_purchases: {
        Row: {
          created_at: string | null
          id: string
          package_id: string
          payment_currency: string
          payment_order_id: string | null
          status: string
          total_price: number
          transaction_hash: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          package_id: string
          payment_currency: string
          payment_order_id?: string | null
          status?: string
          total_price: number
          transaction_hash?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          package_id?: string
          payment_currency?: string
          payment_order_id?: string | null
          status?: string
          total_price?: number
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_purchases_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          bv_percent: number | null
          commission_unlock_level: number | null
          created_at: string | null
          description: string | null
          features: Json | null
          ghost_bv_amount: number | null
          hashrate_ths: number
          id: string
          is_active: boolean | null
          is_premium_bonus_eligible: boolean | null
          name: string
          price_usd: number
          tier: string
          updated_at: string | null
          xflow_tokens: number
        }
        Insert: {
          bv_percent?: number | null
          commission_unlock_level?: number | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          ghost_bv_amount?: number | null
          hashrate_ths: number
          id?: string
          is_active?: boolean | null
          is_premium_bonus_eligible?: boolean | null
          name: string
          price_usd: number
          tier: string
          updated_at?: string | null
          xflow_tokens: number
        }
        Update: {
          bv_percent?: number | null
          commission_unlock_level?: number | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          ghost_bv_amount?: number | null
          hashrate_ths?: number
          id?: string
          is_active?: boolean | null
          is_premium_bonus_eligible?: boolean | null
          name?: string
          price_usd?: number
          tier?: string
          updated_at?: string | null
          xflow_tokens?: number
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_last_four: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          method_type: string
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          method_type: string
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          method_type?: string
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          allocation_id: string | null
          amount_expected: number
          amount_received: number | null
          chain: string
          confirmations: number | null
          confirmed_at: string | null
          created_at: string
          currency: string
          deposit_wallet_id: string
          expires_at: string
          id: string
          package_id: string
          sender_wallet_expected: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allocation_id?: string | null
          amount_expected: number
          amount_received?: number | null
          chain?: string
          confirmations?: number | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          deposit_wallet_id: string
          expires_at: string
          id?: string
          package_id: string
          sender_wallet_expected?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allocation_id?: string | null
          amount_expected?: number
          amount_received?: number | null
          chain?: string
          confirmations?: number | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          deposit_wallet_id?: string
          expires_at?: string
          id?: string
          package_id?: string
          sender_wallet_expected?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_deposit_wallet_id_fkey"
            columns: ["deposit_wallet_id"]
            isOneToOne: false
            referencedRelation: "deposit_wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          fee_amount: number | null
          id: string
          liquidity_pool_contribution: number | null
          lottery_pool_contribution: number | null
          metadata: Json | null
          payment_method: string
          purchase_id: string | null
          status: string
          transaction_type: string
          tx_hash: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          fee_amount?: number | null
          id?: string
          liquidity_pool_contribution?: number | null
          lottery_pool_contribution?: number | null
          metadata?: Json | null
          payment_method: string
          purchase_id?: string | null
          status?: string
          transaction_type: string
          tx_hash?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          fee_amount?: number | null
          id?: string
          liquidity_pool_contribution?: number | null
          lottery_pool_contribution?: number | null
          metadata?: Json | null
          payment_method?: string
          purchase_id?: string | null
          status?: string
          transaction_type?: string
          tx_hash?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "machine_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          max_value: number | null
          min_value: number | null
          updated_at: string | null
          updated_by: string | null
          value: number
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          max_value?: number | null
          min_value?: number | null
          updated_at?: string | null
          updated_by?: string | null
          value: number
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          max_value?: number | null
          min_value?: number | null
          updated_at?: string | null
          updated_by?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "payout_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          binary_parent_id: string | null
          binary_position: Database["public"]["Enums"]["binary_position"] | null
          created_at: string
          default_placement_leg:
            | Database["public"]["Enums"]["binary_position"]
            | null
          email: string
          full_name: string | null
          id: string
          language_preference: string | null
          rank: string | null
          referral_code: string | null
          referral_sequence_number: number | null
          sponsor_id: string | null
          theme_preference: string | null
          updated_at: string
          username: string | null
          wallet_address: string | null
          wallet_changed_at: string | null
          wallet_link_method: string | null
          wallet_network: string | null
          wallet_verification_method: string | null
          wallet_verified: boolean | null
          wallet_verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          binary_parent_id?: string | null
          binary_position?:
            | Database["public"]["Enums"]["binary_position"]
            | null
          created_at?: string
          default_placement_leg?:
            | Database["public"]["Enums"]["binary_position"]
            | null
          email: string
          full_name?: string | null
          id: string
          language_preference?: string | null
          rank?: string | null
          referral_code?: string | null
          referral_sequence_number?: number | null
          sponsor_id?: string | null
          theme_preference?: string | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
          wallet_changed_at?: string | null
          wallet_link_method?: string | null
          wallet_network?: string | null
          wallet_verification_method?: string | null
          wallet_verified?: boolean | null
          wallet_verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          binary_parent_id?: string | null
          binary_position?:
            | Database["public"]["Enums"]["binary_position"]
            | null
          created_at?: string
          default_placement_leg?:
            | Database["public"]["Enums"]["binary_position"]
            | null
          email?: string
          full_name?: string | null
          id?: string
          language_preference?: string | null
          rank?: string | null
          referral_code?: string | null
          referral_sequence_number?: number | null
          sponsor_id?: string | null
          theme_preference?: string | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
          wallet_changed_at?: string | null
          wallet_link_method?: string | null
          wallet_network?: string | null
          wallet_verification_method?: string | null
          wallet_verified?: boolean | null
          wallet_verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_binary_parent_id_fkey"
            columns: ["binary_parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_nfts: {
        Row: {
          certificate_number: number
          chain: string | null
          contract_address: string | null
          created_at: string
          id: string
          is_soulbound: boolean | null
          metadata: Json
          metadata_uri: string | null
          mint_attempts: number | null
          mint_error: string | null
          mint_status: Database["public"]["Enums"]["nft_mint_status"]
          minted_at: string | null
          purchase_id: string
          token_id: string | null
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_number?: number
          chain?: string | null
          contract_address?: string | null
          created_at?: string
          id?: string
          is_soulbound?: boolean | null
          metadata?: Json
          metadata_uri?: string | null
          mint_attempts?: number | null
          mint_error?: string | null
          mint_status?: Database["public"]["Enums"]["nft_mint_status"]
          minted_at?: string | null
          purchase_id: string
          token_id?: string | null
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_number?: number
          chain?: string | null
          contract_address?: string | null
          created_at?: string
          id?: string
          is_soulbound?: boolean | null
          metadata?: Json
          metadata_uri?: string | null
          mint_attempts?: number | null
          mint_error?: string | null
          mint_status?: Database["public"]["Enums"]["nft_mint_status"]
          minted_at?: string | null
          purchase_id?: string
          token_id?: string | null
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_nfts_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: true
            referencedRelation: "package_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_nfts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_definitions: {
        Row: {
          benefits: Json | null
          created_at: string | null
          id: string
          min_direct_referrals: number
          min_hashrate_ths: number
          min_left_leg_volume: number
          min_personal_sales: number
          min_right_leg_volume: number
          min_team_sales: number
          rank_color: string
          rank_level: number
          rank_name: string
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          id?: string
          min_direct_referrals?: number
          min_hashrate_ths?: number
          min_left_leg_volume?: number
          min_personal_sales?: number
          min_right_leg_volume?: number
          min_team_sales?: number
          rank_color: string
          rank_level: number
          rank_name: string
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          id?: string
          min_direct_referrals?: number
          min_hashrate_ths?: number
          min_left_leg_volume?: number
          min_personal_sales?: number
          min_right_leg_volume?: number
          min_team_sales?: number
          rank_color?: string
          rank_level?: number
          rank_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rank_weekly_caps: {
        Row: {
          created_at: string
          hard_cap_usd: number
          id: string
          rank_name: string
          updated_at: string
          weekly_cap_usd: number
        }
        Insert: {
          created_at?: string
          hard_cap_usd?: number
          id?: string
          rank_name: string
          updated_at?: string
          weekly_cap_usd?: number
        }
        Update: {
          created_at?: string
          hard_cap_usd?: number
          id?: string
          rank_name?: string
          updated_at?: string
          weekly_cap_usd?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          binary_position: Database["public"]["Enums"]["binary_position"] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          level: number | null
          referee_id: string
          referral_level: number
          referrer_id: string
          updated_at: string | null
        }
        Insert: {
          binary_position?:
            | Database["public"]["Enums"]["binary_position"]
            | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          referee_id: string
          referral_level: number
          referrer_id: string
          updated_at?: string | null
        }
        Update: {
          binary_position?:
            | Database["public"]["Enums"]["binary_position"]
            | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          referee_id?: string
          referral_level?: number
          referrer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
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
      roi_calculations: {
        Row: {
          break_even_date: string | null
          btc_price_usd: number
          created_at: string | null
          daily_electricity_cost: number | null
          daily_profit: number | null
          daily_revenue_btc: number | null
          daily_revenue_usd: number | null
          electricity_cost_per_kwh: number
          hashrate_ths: number
          id: string
          initial_investment: number
          machine_type_id: string | null
          monthly_profit: number | null
          network_difficulty: number | null
          roi_months: number | null
          user_id: string
        }
        Insert: {
          break_even_date?: string | null
          btc_price_usd: number
          created_at?: string | null
          daily_electricity_cost?: number | null
          daily_profit?: number | null
          daily_revenue_btc?: number | null
          daily_revenue_usd?: number | null
          electricity_cost_per_kwh: number
          hashrate_ths: number
          id?: string
          initial_investment: number
          machine_type_id?: string | null
          monthly_profit?: number | null
          network_difficulty?: number | null
          roi_months?: number | null
          user_id: string
        }
        Update: {
          break_even_date?: string | null
          btc_price_usd?: number
          created_at?: string | null
          daily_electricity_cost?: number | null
          daily_profit?: number | null
          daily_revenue_btc?: number | null
          daily_revenue_usd?: number | null
          electricity_cost_per_kwh?: number
          hashrate_ths?: number
          id?: string
          initial_investment?: number
          machine_type_id?: string | null
          monthly_profit?: number | null
          network_difficulty?: number | null
          roi_months?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roi_calculations_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: false
            referencedRelation: "machine_types"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_audit_logs: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["secret_audit_event"]
          id: string
          ip_address: string | null
          metadata: Json | null
          secret_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["secret_audit_event"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          secret_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["secret_audit_event"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          secret_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_audit_logs_secret_id_fkey"
            columns: ["secret_id"]
            isOneToOne: false
            referencedRelation: "encrypted_secrets"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_encryption_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_metadata: Json | null
          rotated_at: string | null
          version: number
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_metadata?: Json | null
          rotated_at?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_metadata?: Json | null
          rotated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          operation: string
          resource_id: string | null
          resource_type: string
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          operation: string
          resource_id?: string | null
          resource_type: string
          status: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          operation?: string
          resource_id?: string | null
          resource_type?: string
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      staking_positions: {
        Row: {
          created_at: string
          daily_btc_rate: number
          id: string
          staked_at: string
          status: string
          token_amount: number
          token_symbol: string
          total_btc_earned: number
          unstaked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_btc_rate?: number
          id?: string
          staked_at?: string
          status?: string
          token_amount?: number
          token_symbol?: string
          total_btc_earned?: number
          unstaked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_btc_rate?: number
          id?: string
          staked_at?: string
          status?: string
          token_amount?: number
          token_symbol?: string
          total_btc_earned?: number
          unstaked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staking_positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staking_rewards: {
        Row: {
          btc_earned: number
          created_at: string
          id: string
          override_paid_to_sponsor: number
          reward_date: string
          sponsor_id: string | null
          staking_position_id: string
          status: string
          user_id: string
        }
        Insert: {
          btc_earned?: number
          created_at?: string
          id?: string
          override_paid_to_sponsor?: number
          reward_date?: string
          sponsor_id?: string | null
          staking_position_id: string
          status?: string
          user_id: string
        }
        Update: {
          btc_earned?: number
          created_at?: string
          id?: string
          override_paid_to_sponsor?: number
          reward_date?: string
          sponsor_id?: string | null
          staking_position_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staking_rewards_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staking_rewards_staking_position_id_fkey"
            columns: ["staking_position_id"]
            isOneToOne: false
            referencedRelation: "staking_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staking_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swap_transactions: {
        Row: {
          created_at: string | null
          exchange_rate: number
          fee_amount: number | null
          from_amount: number
          from_currency: string
          id: string
          status: string
          to_amount: number
          to_currency: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exchange_rate: number
          fee_amount?: number | null
          from_amount: number
          from_currency: string
          id?: string
          status?: string
          to_amount: number
          to_currency: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exchange_rate?: number
          fee_amount?: number | null
          from_amount?: number
          from_currency?: string
          id?: string
          status?: string
          to_amount?: number
          to_currency?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      token_balances: {
        Row: {
          balance: number
          id: string
          locked_balance: number
          token_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          locked_balance?: number
          token_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          locked_balance?: number
          token_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      token_info: {
        Row: {
          blockchain: string
          contract_address: string
          current_price_usd: number | null
          decimals: number
          description: string | null
          id: string
          payment_discount_percent: number | null
          token_name: string
          token_symbol: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          blockchain: string
          contract_address: string
          current_price_usd?: number | null
          decimals?: number
          description?: string | null
          id?: string
          payment_discount_percent?: number | null
          token_name: string
          token_symbol: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          blockchain?: string
          contract_address?: string
          current_price_usd?: number | null
          decimals?: number
          description?: string | null
          id?: string
          payment_discount_percent?: number | null
          token_name?: string
          token_symbol?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          is_eligible: boolean | null
          updated_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          is_eligible?: boolean | null
          updated_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          is_eligible?: boolean | null
          updated_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          created_at: string | null
          id: string
          inactive_weeks: number | null
          is_active: boolean | null
          last_activity_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inactive_weeks?: number | null
          is_active?: boolean | null
          last_activity_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inactive_weeks?: number | null
          is_active?: boolean | null
          last_activity_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_earnings: {
        Row: {
          allocation_id: string | null
          btc_earned: number
          created_at: string
          hashrate_ths: number
          id: string
          payout_date: string | null
          payout_tx_hash: string | null
          period: string
          status: string
          updated_at: string
          usd_value: number
          user_id: string
        }
        Insert: {
          allocation_id?: string | null
          btc_earned?: number
          created_at?: string
          hashrate_ths?: number
          id?: string
          payout_date?: string | null
          payout_tx_hash?: string | null
          period: string
          status?: string
          updated_at?: string
          usd_value?: number
          user_id: string
        }
        Update: {
          allocation_id?: string | null
          btc_earned?: number
          created_at?: string
          hashrate_ths?: number
          id?: string
          payout_date?: string | null
          payout_tx_hash?: string | null
          period?: string
          status?: string
          updated_at?: string
          usd_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_earnings_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "hashrate_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_earnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_kyc: {
        Row: {
          created_at: string
          documents: Json | null
          id: string
          kyc_required_threshold_met: boolean
          notes: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          submitted_at: string | null
          total_purchase_amount: number
          total_tokenization_ths: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          documents?: Json | null
          id?: string
          kyc_required_threshold_met?: boolean
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          total_purchase_amount?: number
          total_tokenization_ths?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          documents?: Json | null
          id?: string
          kyc_required_threshold_met?: boolean
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          total_purchase_amount?: number
          total_tokenization_ths?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rank_history: {
        Row: {
          achieved_at: string | null
          criteria_met: Json | null
          id: string
          new_rank: string
          old_rank: string | null
          rank_level: number | null
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          criteria_met?: Json | null
          id?: string
          new_rank: string
          old_rank?: string | null
          rank_level?: number | null
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          criteria_met?: Json | null
          id?: string
          new_rank?: string
          old_rank?: string | null
          rank_level?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rank_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_weekly_earnings: {
        Row: {
          binary_earnings: number
          cap_applied: boolean | null
          created_at: string
          direct_earnings: number
          id: string
          leadership_earnings: number
          override_earnings: number
          total_earnings: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          binary_earnings?: number
          cap_applied?: boolean | null
          created_at?: string
          direct_earnings?: number
          id?: string
          leadership_earnings?: number
          override_earnings?: number
          total_earnings?: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          binary_earnings?: number
          cap_applied?: boolean | null
          created_at?: string
          direct_earnings?: number
          id?: string
          leadership_earnings?: number
          override_earnings?: number
          total_earnings?: number
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_weekly_earnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_audit_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          previous_wallet_address: string | null
          user_agent: string | null
          user_id: string
          wallet_address: string | null
          wallet_network: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          previous_wallet_address?: string | null
          user_agent?: string | null
          user_id: string
          wallet_address?: string | null
          wallet_network?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          previous_wallet_address?: string | null
          user_agent?: string | null
          user_id?: string
          wallet_address?: string | null
          wallet_network?: string | null
        }
        Relationships: []
      }
      wallet_nonces: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          nonce: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          nonce: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      weekly_settlements: {
        Row: {
          binary_commission: number | null
          binary_total: number | null
          blockchain_status: string | null
          blockchain_tx_hash: string | null
          cap_percentage: number | null
          carry_forward_amount: number | null
          claimed_at: string | null
          created_at: string | null
          direct_l1_commission: number | null
          direct_l2_commission: number | null
          direct_l3_commission: number | null
          direct_total: number | null
          grand_total: number | null
          id: string
          is_finalized: boolean
          merkle_proof: Json | null
          merkle_root: string | null
          metadata: Json | null
          override_commission: number | null
          override_total: number | null
          paid_at: string | null
          scale_factor_applied: number | null
          status: Database["public"]["Enums"]["settlement_status"] | null
          strong_leg_volume: number | null
          total_commission: number | null
          transaction_hash: string | null
          updated_at: string | null
          user_id: string
          weak_leg_volume: number | null
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          binary_commission?: number | null
          binary_total?: number | null
          blockchain_status?: string | null
          blockchain_tx_hash?: string | null
          cap_percentage?: number | null
          carry_forward_amount?: number | null
          claimed_at?: string | null
          created_at?: string | null
          direct_l1_commission?: number | null
          direct_l2_commission?: number | null
          direct_l3_commission?: number | null
          direct_total?: number | null
          grand_total?: number | null
          id?: string
          is_finalized?: boolean
          merkle_proof?: Json | null
          merkle_root?: string | null
          metadata?: Json | null
          override_commission?: number | null
          override_total?: number | null
          paid_at?: string | null
          scale_factor_applied?: number | null
          status?: Database["public"]["Enums"]["settlement_status"] | null
          strong_leg_volume?: number | null
          total_commission?: number | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id: string
          weak_leg_volume?: number | null
          week_end_date: string
          week_start_date: string
        }
        Update: {
          binary_commission?: number | null
          binary_total?: number | null
          blockchain_status?: string | null
          blockchain_tx_hash?: string | null
          cap_percentage?: number | null
          carry_forward_amount?: number | null
          claimed_at?: string | null
          created_at?: string | null
          direct_l1_commission?: number | null
          direct_l2_commission?: number | null
          direct_l3_commission?: number | null
          direct_total?: number | null
          grand_total?: number | null
          id?: string
          is_finalized?: boolean
          merkle_proof?: Json | null
          merkle_root?: string | null
          metadata?: Json | null
          override_commission?: number | null
          override_total?: number | null
          paid_at?: string | null
          scale_factor_applied?: number | null
          status?: Database["public"]["Enums"]["settlement_status"] | null
          strong_leg_volume?: number | null
          total_commission?: number | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string
          weak_leg_volume?: number | null
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_settlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_settlements_meta: {
        Row: {
          contract_status: string | null
          contract_tx_hash: string | null
          created_at: string
          id: string
          merkle_root: string
          total_amount: number
          total_users: number
          updated_at: string
          week_start_date: string
        }
        Insert: {
          contract_status?: string | null
          contract_tx_hash?: string | null
          created_at?: string
          id?: string
          merkle_root: string
          total_amount?: number
          total_users?: number
          updated_at?: string
          week_start_date: string
        }
        Update: {
          contract_status?: string | null
          contract_tx_hash?: string | null
          created_at?: string
          id?: string
          merkle_root?: string
          total_amount?: number
          total_users?: number
          updated_at?: string
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_user_rank: {
        Args: { p_new_rank: string; p_reason?: string; p_user_id: string }
        Returns: boolean
      }
      bulk_evaluate_all_ranks: {
        Args: never
        Returns: {
          promotions: Json
          total_evaluated: number
          total_promoted: number
        }[]
      }
      calculate_payment_with_discount: {
        Args: { p_base_amount: number; p_currency: string }
        Returns: {
          discount_amount: number
          discount_percent: number
          final_amount: number
        }[]
      }
      calculate_user_rank: {
        Args: { p_user_id: string }
        Returns: {
          direct_referral_count: number
          left_leg_volume: number
          personal_sales: number
          qualified_rank_level: number
          qualified_rank_name: string
          right_leg_volume: number
          team_sales: number
          total_hashrate: number
        }[]
      }
      can_change_wallet: {
        Args: { p_user_id: string }
        Returns: {
          allowed: boolean
          cooldown_ends_at: string
          reason: string
        }[]
      }
      create_referral_chain: {
        Args: {
          p_binary_position?: string
          p_referee_id: string
          p_sponsor_id: string
        }
        Returns: undefined
      }
      detect_decrypt_anomalies: {
        Args: {
          p_secret_id: string
          p_threshold?: number
          p_time_window_minutes?: number
          p_user_id: string
        }
        Returns: {
          first_access: string
          is_anomaly: boolean
          last_access: string
          unique_ips: number
          usage_count: number
        }[]
      }
      detect_failed_rotations: {
        Args: { p_time_window_hours?: number }
        Returns: {
          attempt_count: number
          last_attempt: string
          pool_config_id: string
          rotated_by: string
        }[]
      }
      detect_unusual_ip_access: {
        Args: { p_time_window_minutes?: number; p_user_id: string }
        Returns: {
          access_count: number
          first_access: string
          ip_address: string
          is_suspicious: boolean
          last_access: string
          unique_secrets: number
        }[]
      }
      evaluate_and_promote_user_rank: {
        Args: { p_user_id: string }
        Returns: {
          new_rank_level: number
          new_rank_name: string
          old_rank_level: number
          old_rank_name: string
          promoted: boolean
        }[]
      }
      expire_payment_orders: { Args: never; Returns: undefined }
      generate_nft_metadata: { Args: { p_purchase_id: string }; Returns: Json }
      generate_referral_code: { Args: never; Returns: string }
      generate_username_referral_code: {
        Args: { p_username: string }
        Returns: string
      }
      get_security_events_summary: {
        Args: { p_time_window_hours?: number }
        Returns: {
          event_count: number
          event_type: string
          latest_event: string
          unique_secrets: number
          unique_users: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_username_available: {
        Args: { p_exclude_user_id?: string; p_username: string }
        Returns: boolean
      }
      log_wallet_event: {
        Args: {
          p_event_type: string
          p_ip_address?: string
          p_metadata?: Json
          p_previous_wallet?: string
          p_user_agent?: string
          p_user_id: string
          p_wallet_address?: string
          p_wallet_network?: string
        }
        Returns: string
      }
      lookup_sponsor_by_referral: {
        Args: { p_referral_code: string }
        Returns: {
          email: string
          full_name: string
          id: string
        }[]
      }
      repair_binary_tree_entries: {
        Args: never
        Returns: {
          details: Json
          repaired_count: number
        }[]
      }
      set_admin_role: { Args: { admin_email: string }; Returns: undefined }
      update_upline_member_counts: {
        Args: {
          p_direct_sponsor_id: string
          p_new_member_id: string
          p_position: Database["public"]["Enums"]["binary_position"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
      binary_position: "left" | "right"
      commission_status: "pending" | "paid" | "cancelled"
      commission_type:
        | "direct_l1"
        | "direct_l2"
        | "direct_l3"
        | "binary_weak_leg"
        | "override_l1"
        | "override_l2"
        | "override_l3"
      cooling_type: "AIR" | "HYDRO" | "IMMERSION"
      deployment_status:
        | "ORDERED"
        | "SHIPPED"
        | "IN_TRANSIT"
        | "ARRIVED"
        | "INSTALLING"
        | "TESTING"
        | "ACTIVE"
        | "MAINTENANCE"
      kyc_status:
        | "NOT_REQUIRED"
        | "PENDING"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "REJECTED"
      nft_mint_status:
        | "PENDING"
        | "QUEUED"
        | "MINTING"
        | "MINTED"
        | "FAILED"
        | "WALLET_REQUIRED"
      pool_provider: "ANTPOOL" | "FOUNDRY" | "VIABTC" | "OTHER" | "F2POOL"
      rotation_type: "SCHEDULED" | "ON_DEMAND" | "FORCED_COMPROMISE"
      secret_audit_event:
        | "CREATED"
        | "UPDATED"
        | "ROTATED"
        | "ACCESSED"
        | "DELETED"
      secret_type: "MINING_POOL_API_KEY" | "MINING_POOL_API_SECRET"
      settlement_status: "pending" | "processing" | "paid" | "failed"
      sync_status: "PENDING" | "IN_PROGRESS" | "SUCCESS" | "ERROR"
      tokenization_status: "PENDING" | "CONFIRMED" | "FAILED"
      upload_status: "SUCCESS" | "PARTIAL" | "FAILED"
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
      app_role: ["admin", "user", "super_admin"],
      binary_position: ["left", "right"],
      commission_status: ["pending", "paid", "cancelled"],
      commission_type: [
        "direct_l1",
        "direct_l2",
        "direct_l3",
        "binary_weak_leg",
        "override_l1",
        "override_l2",
        "override_l3",
      ],
      cooling_type: ["AIR", "HYDRO", "IMMERSION"],
      deployment_status: [
        "ORDERED",
        "SHIPPED",
        "IN_TRANSIT",
        "ARRIVED",
        "INSTALLING",
        "TESTING",
        "ACTIVE",
        "MAINTENANCE",
      ],
      kyc_status: [
        "NOT_REQUIRED",
        "PENDING",
        "SUBMITTED",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
      ],
      nft_mint_status: [
        "PENDING",
        "QUEUED",
        "MINTING",
        "MINTED",
        "FAILED",
        "WALLET_REQUIRED",
      ],
      pool_provider: ["ANTPOOL", "FOUNDRY", "VIABTC", "OTHER", "F2POOL"],
      rotation_type: ["SCHEDULED", "ON_DEMAND", "FORCED_COMPROMISE"],
      secret_audit_event: [
        "CREATED",
        "UPDATED",
        "ROTATED",
        "ACCESSED",
        "DELETED",
      ],
      secret_type: ["MINING_POOL_API_KEY", "MINING_POOL_API_SECRET"],
      settlement_status: ["pending", "processing", "paid", "failed"],
      sync_status: ["PENDING", "IN_PROGRESS", "SUCCESS", "ERROR"],
      tokenization_status: ["PENDING", "CONFIRMED", "FAILED"],
      upload_status: ["SUCCESS", "PARTIAL", "FAILED"],
    },
  },
} as const
