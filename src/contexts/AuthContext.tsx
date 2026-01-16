'use client';

import * as React from 'react';

import supabase from '@/lib/supabase/client';
import type { UserProfile, AuthContextType } from '@/types/auth';

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<AuthContextType['user']>(null);
  const [session, setSession] = React.useState<AuthContextType['session']>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchProfile = React.useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      setUserProfile(null);
      return;
    }

    setUserProfile(data as UserProfile);
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (!user?.id) {
      setUserProfile(null);
      return;
    }

    await fetchProfile(user.id);
  }, [fetchProfile, user?.id]);

  const refreshBalance = React.useCallback(async () => {
    await refreshProfile();
  }, [refreshProfile]);

  React.useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);

      if (data.session?.user?.id) {
        await fetchProfile(data.session.user.id);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user?.id) {
        await fetchProfile(nextSession.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = React.useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Failed to sign out from Supabase', error);
        return;
      }

      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Sign-out failed', error);
    } finally {
      setSession(null);
      setUser(null);
      setUserProfile(null);
    }
  }, []);

  const value = React.useMemo<AuthContextType>(
    () => ({
      user,
      session,
      userProfile,
      loading,
      signOut,
      refreshProfile,
      refreshBalance,
    }),
    [loading, refreshProfile, refreshBalance, session, signOut, user, userProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
