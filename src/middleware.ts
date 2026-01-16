import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constant/supabase';
import { updateSession } from '@/lib/supabase/middleware';

const PROTECTED_ROUTES = ['/dashboard', '/markets', '/portfolio', '/wallet'];
const AUTH_ROUTES = ['/auth'];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/markets/:path*', '/portfolio/:path*', '/wallet/:path*', '/auth/:path*'],
};
