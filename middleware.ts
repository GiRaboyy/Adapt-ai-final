/**
 * Middleware for route protection and authentication
 */

import { createClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request);
  const pathname = request.nextUrl.pathname;

  // Skip auth check for callback - it handles its own auth
  if (pathname === '/auth/callback') {
    return response;
  }

  // Get session
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = pathname.startsWith('/auth');
  const isDashboard = pathname.startsWith('/dashboard');

  // If user is logged in and trying to access auth pages (except verify), redirect to dashboard
  if (user && isAuthPage && !pathname.includes('/verify')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protected routes - require authentication
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$|api|status).*)',
  ],
};
