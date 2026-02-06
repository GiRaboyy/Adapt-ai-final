/**
 * Middleware for route protection and authentication
 */

import { createClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request);

  // Get session
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (user && isAuthPage && !request.nextUrl.pathname.includes('/callback')) {
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
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes that should remain public
     * - status page (public health check)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/health|api/supabase/health|api/storage|status).*)',
  ],
};
