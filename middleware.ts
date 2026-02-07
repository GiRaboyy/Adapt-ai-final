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

  // If user is logged in and trying to access main auth page, softly redirect to dashboard
  // Client-side will handle this more gracefully with a button
  if (user && pathname === '/auth') {
    // Let the auth page handle showing "already logged in" message
    return response;
  }

  // Protected routes - require authentication and role
  if (isDashboard) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url));
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
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$|api|status).*)',
  ],
};
