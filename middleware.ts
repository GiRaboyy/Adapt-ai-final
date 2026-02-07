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
  const isOnboarding = pathname.startsWith('/onboarding');

  // If user is logged in and trying to access auth pages (except verify), redirect to dashboard
  if (user && isAuthPage && !pathname.includes('/verify')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protected routes - require authentication
  if (!user && (isDashboard || isOnboarding)) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Dashboard requires profile with role
  if (user && isDashboard) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const profile = profileData as { role: string | null } | null;
    if (!profile?.role) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
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
     * - api routes
     * - status page (public health check)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$|api|status).*)',
  ],
};
