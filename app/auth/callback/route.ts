/**
 * OAuth/Email callback handler
 * Exchanges authorization code for session and creates/updates profile
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent(error_description || 'Ошибка авторизации')}`
    );
  }

  // Handle missing code
  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    // Exchange code for session - this sets the cookies
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=${encodeURIComponent('Ошибка авторизации. Попробуйте снова.')}`
      );
    }

    const user = data.user;

    if (!user) {
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=no_user`);
    }

    // Always ensure profile exists via Python API (bypasses RLS)
    const apiUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/profiles/ensure`
      : `${requestUrl.origin}/api/profiles/ensure`;

    // Check if user already has a profile with a role
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const profileData = existingProfile as { role: string | null } | null;
    const hasRole = profileData && profileData.role;

    // If no role, create profile without role (user will be redirected to role selection)
    if (!hasRole) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            email: user.email || null,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            role: null, // Don't set role yet
          }),
        });

        if (!response.ok) {
          console.error('Profile API error:', await response.text());
        }
      } catch (fetchError) {
        console.error('Profile API fetch error:', fetchError);
        // Don't fail the callback if profile creation fails
      }

      // Redirect to role selection
      return NextResponse.redirect(`${requestUrl.origin}/auth/role`);
    }

    // User has role - redirect to dashboard
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);

  } catch (err) {
    console.error('Unexpected callback error:', err);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent('Произошла непредвиденная ошибка')}`
    );
  }
}
