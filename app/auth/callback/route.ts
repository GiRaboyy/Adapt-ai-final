/**
 * OAuth/Email callback handler
 * Exchanges authorization code for session and creates/updates profile directly
 * 
 * IMPORTANT: This route does NOT depend on /api/profiles/ensure
 * Profile creation happens directly here using service role key
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
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

  // Client for session management (uses anon key)
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
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=session_not_created`);
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if profile exists and get role
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    let role: string | null = null;

    if (existingProfile) {
      // Profile exists - get role
      role = existingProfile.role;
    } else {
      // Create new profile without role (user will select on /auth/role)
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || null,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          role: null,
          org_id: null,
        });

      if (insertError) {
        console.error('Profile insert error:', insertError);
        // Don't fail - user can still proceed, profile will be created later
      }
    }

    // Redirect based on role
    if (!role) {
      return NextResponse.redirect(`${requestUrl.origin}/auth/role`);
    }

    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);

  } catch (err) {
    console.error('Unexpected callback error:', err);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent('Произошла непредвиденная ошибка')}`
    );
  }
}
