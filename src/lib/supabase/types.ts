export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      bets: {
        Row: {
          created_at: string | null;
          entry_price: string;
          id: string;
          mode: 'paper' | 'live';
          outcome_id: string;
          payout_amount: string | null;
          potential_payout: string | null;
          settled_at: string | null;
          shares: string;
          stake: string;
          status: 'open' | 'cashed_out' | 'won' | 'lost';
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          entry_price: string;
          id?: string;
          mode: 'paper' | 'live';
          outcome_id: string;
          payout_amount?: string | null;
          potential_payout?: string | null;
          settled_at?: string | null;
          shares: string;
          stake: string;
          status?: 'open' | 'cashed_out' | 'won' | 'lost';
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          entry_price?: string;
          id?: string;
          mode?: 'paper' | 'live';
          outcome_id?: string;
          payout_amount?: string | null;
          potential_payout?: string | null;
          settled_at?: string | null;
          shares?: string;
          stake?: string;
          status?: 'open' | 'cashed_out' | 'won' | 'lost';
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bets_outcome_id_fkey';
            columns: ['outcome_id'];
            referencedRelation: 'outcomes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bets_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          category: string | null;
          close_time: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          liquidity_parameter: string;
          pricing_model: 'lmsr' | 'parimutuel';
          settled_at: string | null;
          status: 'open' | 'closed' | 'settled';
          title: string;
          updated_at: string | null;
          winning_outcome_id: string | null;
        };
        Insert: {
          category?: string | null;
          close_time: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          liquidity_parameter?: string;
          pricing_model?: 'lmsr' | 'parimutuel';
          settled_at?: string | null;
          status?: 'open' | 'closed' | 'settled';
          title: string;
          updated_at?: string | null;
          winning_outcome_id?: string | null;
        };
        Update: {
          category?: string | null;
          close_time?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          liquidity_parameter?: string;
          pricing_model?: 'lmsr' | 'parimutuel';
          settled_at?: string | null;
          status?: 'open' | 'closed' | 'settled';
          title?: string;
          updated_at?: string | null;
          winning_outcome_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'events_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_winning_outcome_id_fkey';
            columns: ['winning_outcome_id'];
            referencedRelation: 'outcomes';
            referencedColumns: ['id'];
          },
        ];
      };
      ledger_entries: {
        Row: {
          amount: string;
          balance_after: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          mode: 'paper' | 'live';
          reference_id: string | null;
          reference_type: string | null;
          transaction_type:
            | 'deposit'
            | 'withdrawal'
            | 'bet_placed'
            | 'bet_won'
            | 'bet_lost'
            | 'cashout'
            | 'signup_bonus';
          user_id: string;
        };
        Insert: {
          amount: string;
          balance_after: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          mode: 'paper' | 'live';
          reference_id?: string | null;
          reference_type?: string | null;
          transaction_type:
            | 'deposit'
            | 'withdrawal'
            | 'bet_placed'
            | 'bet_won'
            | 'bet_lost'
            | 'cashout'
            | 'signup_bonus';
          user_id: string;
        };
        Update: {
          amount?: string;
          balance_after?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          mode?: 'paper' | 'live';
          reference_id?: string | null;
          reference_type?: string | null;
          transaction_type?:
            | 'deposit'
            | 'withdrawal'
            | 'bet_placed'
            | 'bet_won'
            | 'bet_lost'
            | 'cashout'
            | 'signup_bonus';
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ledger_entries_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      outcomes: {
        Row: {
          created_at: string | null;
          event_id: string;
          id: string;
          initial_probability: string | null;
          label: string;
          shares_outstanding: string;
          total_staked: string;
        };
        Insert: {
          created_at?: string | null;
          event_id: string;
          id?: string;
          initial_probability?: string | null;
          label: string;
          shares_outstanding?: string;
          total_staked?: string;
        };
        Update: {
          created_at?: string | null;
          event_id?: string;
          id?: string;
          initial_probability?: string | null;
          label?: string;
          shares_outstanding?: string;
          total_staked?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'outcomes_event_id_fkey';
            columns: ['event_id'];
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          full_name: string | null;
          id: string;
          is_admin: boolean;
          live_balance: string;
          paper_balance: string;
          phone: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          is_admin?: boolean;
          live_balance?: string;
          paper_balance?: string;
          phone: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          is_admin?: boolean;
          live_balance?: string;
          paper_balance?: string;
          phone?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      withdrawals: {
        Row: {
          amount: string;
          created_at: string | null;
          external_reference: string | null;
          id: string;
          metadata: Json | null;
          phone_number: string;
          provider: 'mtn' | 'airteltigo' | 'telecel';
          status: 'pending' | 'processing' | 'completed' | 'failed';
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: string;
          created_at?: string | null;
          external_reference?: string | null;
          id?: string;
          metadata?: Json | null;
          phone_number: string;
          provider: 'mtn' | 'airteltigo' | 'telecel';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: string;
          created_at?: string | null;
          external_reference?: string | null;
          id?: string;
          metadata?: Json | null;
          phone_number?: string;
          provider?: 'mtn' | 'airteltigo' | 'telecel';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'withdrawals_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_event_with_outcomes: {
        Args: {
          p_event_id: string;
        };
        Returns: Json;
      };
      get_user_balance: {
        Args: {
          p_mode: string;
          p_user_id: string;
        };
        Returns: string;
      };
      settle_event: {
        Args: {
          p_event_id: string;
          p_winning_outcome_id: string;
        };
        Returns: number;
      };
      update_user_balance: {
        Args: {
          p_amount: string;
          p_mode: string;
          p_user_id: string;
        };
        Returns: string;
      };
      increment_outcome_totals: {
        Args: {
          p_outcome_id: string;
          p_delta_shares: number;
          p_delta_stake: number;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never;
