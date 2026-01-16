import type { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string | null;
  is_admin: boolean;
  paper_balance: string;
  live_balance: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}
