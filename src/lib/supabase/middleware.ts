import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constant/supabase';
import type { Database } from './types';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options?: CookieOptions) {
        response.cookies.set({
          name,
          value: '',
          ...options,
          maxAge: 0,
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
