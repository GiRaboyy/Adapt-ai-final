/**
 * Middleware for route protection and authentication
 * Prevents redirect loops by never blocking /auth/callback or /auth/role
 * IMPORTANT: Does NOT enforce role check on dashboard - users can set role later
 */

import { createClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request);
  const pathname = request.nextUrl.pathname;

  // Allowlist - no auth checks or redirects for these paths
  const allowedPaths = [
    '/auth/callback',
    '/auth/role',
    '/auth/forgot',
    '/auth/reset',
    '/auth/verify',
  ];

  if (allowedPaths.some(path => pathname === path)) {
    return response;
  }

  // Get session
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = pathname.startsWith('/auth');
  const isDashboard = pathname.startsWith('/dashboard');

  // If user is logged in and trying to access auth pages (login/signup), redirect to dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protected routes - require authentication only (role is optional, can be set in-app)
  if (isDashboard) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    // No role check - let users access dashboard even without role
    // They can set role later from within the app
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api|status).*)',
  ],
};
