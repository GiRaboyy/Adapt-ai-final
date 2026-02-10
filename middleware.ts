/**
 * Middleware for route protection and authentication
 * Prevents redirect loops by never blocking /auth/callback or /auth/role
 */

import { createClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request);
  const pathname = request.nextUrl.pathname;

  // Allowlist - no auth checks or redirects for these paths
  const allowedPaths = [
    '/auth/callback',
    '/auth/role',
    '/auth/forgot',
    '/auth/reset',
  ];

  if (allowedPaths.some(path => pathname === path)) {
    return response;
  }

  // Get session
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = pathname.startsWith('/auth');
  const isDashboard = pathname.startsWith('/dashboard');
  const isCurator = pathname.startsWith('/curator');

  // If user is logged in and trying to access auth pages, redirect based on role
  if (user && isAuthPage) {
    try {
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.role) {
        // User has role - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        // User doesn't have role - redirect to role selection
        return NextResponse.redirect(new URL('/auth/role', request.url));
      }
    } catch (err) {
      console.error('Middleware auth check error:', err);
      // On error, redirect to dashboard and let it handle
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Protected routes - require authentication and role
  if (isCurator || isDashboard) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Check if user is coming from password recovery (only applicable for /dashboard)
    const fromRecovery = isDashboard && request.nextUrl.searchParams.get('from') === 'recovery';

    if (fromRecovery) {
      // User just completed password reset - skip role check and clean up URL
      const url = request.nextUrl.clone();
      url.searchParams.delete('from');
      return NextResponse.redirect(url);
    }

    // Check if user has a role set
    try {
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || !profile.role) {
        // User doesn't have a role, redirect to role selection
        return NextResponse.redirect(new URL('/auth/role', request.url));
      }
    } catch (err) {
      console.error('Middleware role check error:', err);
      // On error, let them through - the page will handle it
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$|api|cloud-check).*)',
  ],
};
