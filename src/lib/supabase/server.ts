import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constant/supabase';
import { SUPABASE_SERVICE_ROLE_KEY } from '@/constant/supabase-server';
import type { Database } from './types';

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        cookieStore.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options?: CookieOptions) {
        cookieStore.set({
          name,
          value: '',
          ...options,
          maxAge: 0,
        });
      },
    },
  });
};

export const createServiceRoleClient = () =>
  createServerClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
